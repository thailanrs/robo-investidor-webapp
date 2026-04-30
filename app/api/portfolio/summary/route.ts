import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export const revalidate = 600; // 10 minutos

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    // 1. Buscar transações e proventos em paralelo
    const [transactionsRes, dividendsRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true }),
      supabase
        .from("dividends")
        .select("*")
        .eq("user_id", user.id)
    ]);

    if (transactionsRes.error) throw transactionsRes.error;
    if (dividendsRes.error) throw dividendsRes.error;

    const transactions = transactionsRes.data || [];
    const dividends = dividendsRes.data || [];

    // 2. Calcular posições atuais, preço médio e fluxo de caixa
    const positions: Record<string, { quantity: number; totalCost: number; totalOtherCosts: number }> = {};
    let totalSpent = 0;
    let totalReceivedFromSales = 0;

    for (const tx of transactions) {
      const ticker = tx.ticker.toUpperCase();
      if (!positions[ticker]) {
        positions[ticker] = { quantity: 0, totalCost: 0, totalOtherCosts: 0 };
      }

      const cost = tx.quantity * tx.unit_price;
      const fees = tx.other_costs || 0;
      positions[ticker].totalOtherCosts += fees;

      if (tx.type === "COMPRA") {
        positions[ticker].quantity += tx.quantity;
        positions[ticker].totalCost += cost;
        totalSpent += (cost + fees);
      } else {
        // Venda: reduzimos proporcionalmente o custo médio
        const avgPriceBefore = positions[ticker].quantity > 0 
          ? positions[ticker].totalCost / positions[ticker].quantity 
          : 0;
        
        positions[ticker].totalCost -= (tx.quantity * avgPriceBefore);
        positions[ticker].quantity -= tx.quantity;
        totalReceivedFromSales += (cost - fees);
      }
    }

    // 3. Buscar preços atuais via Yahoo Finance
    const activeTickers = Object.keys(positions).filter(t => positions[t].quantity > 0);
    const prices: Record<string, number> = {};
    
    if (activeTickers.length > 0) {
      try {
        const symbols = activeTickers.map(t => `${t}.SA`);
        // Yahoo Finance 2 quote can return a single object if only one symbol
        const quotes = await yahooFinance.quote(symbols);
        const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
        
        quotesArray.forEach(q => {
          const ticker = q.symbol.replace(".SA", "");
          prices[ticker] = q.regularMarketPrice || 0;
        });
      } catch (err) {
        console.error("Erro ao buscar cotações:", err);
        // Fallback: usar o último preço médio se falhar (não ideal, mas evita crash)
      }
    }

    // 4. Consolidar métricas finais
    let patrimonioTotal = 0;
    let custoPosicaoAberta = 0;
    
    const positionsList = activeTickers.map(ticker => {
      const pos = positions[ticker];
      const currentPrice = prices[ticker] || (pos.totalCost / pos.quantity);
      const balance = pos.quantity * currentPrice;
      
      patrimonioTotal += balance;
      custoPosicaoAberta += pos.totalCost;

      return {
        ticker,
        quantity: pos.quantity,
        avgPrice: pos.totalCost / pos.quantity,
        totalInvested: pos.totalCost,
        balance,
        currentPrice
      };
    });

    const proventosTotal = dividends.reduce((sum, d) => sum + d.amount, 0);
    
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    const proventos12M = dividends
      .filter(d => new Date(d.payment_date) >= oneYearAgo)
      .reduce((sum, d) => sum + d.amount, 0);

    // Lucro Total = (Patrimônio Atual + Vendas + Proventos) - (Total Gasto em Compras)
    const lucroTotal = (patrimonioTotal + totalReceivedFromSales + proventosTotal) - totalSpent;
    
    // Rentabilidade Histórica = Lucro Total / Total Gasto
    const rentabilidadePercent = totalSpent > 0 ? (lucroTotal / totalSpent) * 100 : 0;

    // Variação de Cotação (Unrealized Gain) = Patrimônio Atual - Custo das Posições Abertas
    const ganhoCapital = patrimonioTotal - custoPosicaoAberta;
    const variacaoPercent = custoPosicaoAberta > 0 ? (ganhoCapital / custoPosicaoAberta) * 100 : 0;

    return NextResponse.json({
      patrimonioTotal,
      valorInvestido: custoPosicaoAberta,
      lucroTotal,
      ganhoCapital,
      dividendos: proventosTotal,
      proventos12M,
      proventosTotal,
      variacaoPercent,
      variacaoValor: ganhoCapital,
      rentabilidadePercent,
      positions: positionsList
    });

  } catch (error: any) {
    console.error("Portfolio Summary API Error:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
