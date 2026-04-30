import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const tickers = Array.from(new Set(transactions.map(t => {
      const ticker = t.ticker.toUpperCase();
      return ticker.endsWith(".SA") ? ticker : `${ticker}.SA`;
    })));
    const startDate = new Date(transactions[0].date);
    const endDate = new Date();

    // Buscar preços históricos
    const historicals: Record<string, Map<string, number>> = {};
    const lastPrices: Record<string, number> = {};

    await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const hist = (await yahooFinance.historical(ticker, {
            period1: startDate.toISOString().substring(0, 10),
            period2: endDate.toISOString().substring(0, 10),
            interval: "1mo",
          })) as any[];
          
          const priceMap = new Map<string, number>();
          for (const h of hist) {
            const key = `${h.date.getFullYear()}-${String(h.date.getMonth() + 1).padStart(2, "0")}`;
            const price = h.adjClose ?? h.close;
            priceMap.set(key, price);
            if (price) lastPrices[ticker] = price;
          }
          historicals[ticker] = priceMap;
        } catch (e) {
          console.error(`Error fetching ${ticker}:`, e);
        }
      })
    );

    const series: any[] = [];
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

      // Calcular holdings e custo médio até monthEnd
      const holdings: Map<string, { qty: number; totalCost: number }> = new Map();
      
      for (const tx of transactions) {
        if (new Date(tx.date) > monthEnd) continue;
        
        const ticker = tx.ticker.toUpperCase();
        const tickerSA = ticker.endsWith(".SA") ? ticker : `${ticker}.SA`;
        const current = holdings.get(tickerSA) || { qty: 0, totalCost: 0 };
        
        const qty = Number(tx.quantity || 0);
        const unitPrice = Number(tx.unit_price || tx.price || 0);
        const otherCosts = Number(tx.other_costs || 0);

        if (tx.type === "COMPRA") {
          current.qty += qty;
          current.totalCost += (qty * unitPrice) + otherCosts;
        } else {
          if (current.qty > 0) {
            const avgPrice = current.totalCost / current.qty;
            current.qty -= qty;
            current.totalCost -= qty * avgPrice;
          }
        }
        holdings.set(tickerSA, current);
      }

      let totalCostBasis = 0;
      let totalMarketValue = 0;

      for (const [tickerSA, data] of holdings.entries()) {
        if (data.qty <= 0) continue;
        
        totalCostBasis += (data.totalCost || 0);
        
        let price = historicals[tickerSA]?.get(key);
        if (price === undefined) {
          price = lastPrices[tickerSA] || 0;
        } else {
          lastPrices[tickerSA] = price;
        }
        
        totalMarketValue += data.qty * price;
      }

      series.push({
        month: `${String(cursor.getMonth() + 1).padStart(2, "0")}/${cursor.getFullYear()}`,
        valorAplicado: Math.round(totalCostBasis || 0),
        ganhoCapital: Math.round((totalMarketValue || 0) - (totalCostBasis || 0)),
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }

    return NextResponse.json({ 
      data: series,
      debug: {
        transactionCount: transactions.length,
        tickersProcessed: tickers,
        totalPoints: series.length
      }
    });
  } catch (error) {
    console.error("Error calculating equity evolution:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
