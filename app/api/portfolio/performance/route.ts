import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export const revalidate = 3600; // Cache de 1 hora

type SeriesPoint = { date: string; value: number };

// Tipo explícito do resultado de yahooFinance.historical para evitar inferência 'never'
type YahooHistoricalRow = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose?: number;
  volume: number;
};

/** Busca taxa CDI mensal acumulada do Banco Central do Brasil */
async function fetchCDISeries(startDate: Date, endDate: Date): Promise<SeriesPoint[]> {
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.4391/dados?formato=json&dataInicial=${fmt(startDate)}&dataFinal=${fmt(endDate)}`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`BCB API error: ${res.status}`);

  const raw: { data: string; valor: string }[] = await res.json();

  const byMonth: Map<string, number> = new Map();
  for (const entry of raw) {
    const [, m, y] = entry.data.split("/");
    const key = `${y}-${m}`;
    byMonth.set(key, parseFloat(entry.valor.replace(",", ".")));
  }

  const series: SeriesPoint[] = [];
  let accumulated = 1.0;
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  // Ponto inicial de referência (0%)
  const startKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
  series.push({ date: startKey, value: 0 });

  // Começa a acumular a partir do primeiro mês real (cursor se mantém no mesmo mês, mas o primeiro ponto já foi gerado)
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const monthlyRate = byMonth.get(key) ?? 0;
    
    // Só acumulamos se não for o primeiro ponto (que já é 0)
    if (key !== startKey) {
      accumulated = accumulated * (1 + monthlyRate / 100);
      series.push({ date: key, value: parseFloat(((accumulated - 1) * 100).toFixed(2)) });
    }
    
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return series;
}

/** Busca série histórica de benchmark (Ibovespa) */
async function fetchBenchmarkSeries(
  symbol: string,
  startDate: Date,
  endDate: Date
): Promise<SeriesPoint[]> {
  try {
    const hist = (await yahooFinance.historical(symbol, {
      period1: startDate.toISOString().substring(0, 10),
      period2: endDate.toISOString().substring(0, 10),
      interval: "1mo" as "1mo",
    })) as YahooHistoricalRow[];

    if (!hist || hist.length === 0) return [];

    const basePrice = hist[0].adjClose ?? hist[0].close;
    const series: SeriesPoint[] = [];
    
    // Ponto inicial (0%)
    series.push({
      date: `${hist[0].date.getFullYear()}-${String(hist[0].date.getMonth() + 1).padStart(2, "0")}`,
      value: 0
    });

    for (let i = 1; i < hist.length; i++) {
      const h = hist[i];
      const price = h.adjClose ?? h.close;
      const pct = basePrice > 0 ? ((price / basePrice) - 1) * 100 : 0;
      series.push({
        date: `${h.date.getFullYear()}-${String(h.date.getMonth() + 1).padStart(2, "0")}`,
        value: parseFloat(pct.toFixed(2)),
      });
    }
    return series;
  } catch (error) {
    console.error(`Error fetching benchmark ${symbol}:`, error);
    return [];
  }
}

/** Calcula série mensal da carteira do usuário usando Time-Weighted Return (TWR) */
async function fetchPortfolioSeries(
  transactions: any[],
  startDate: Date,
  endDate: Date
): Promise<SeriesPoint[]> {
  const tickers = [...new Set(transactions.map((t: any) => `${t.ticker}.SA`))];
  const historicals: Record<string, Map<string, number>> = {};

  await Promise.allSettled(
    tickers.map(async (ticker) => {
      try {
        const hist = (await yahooFinance.historical(ticker, {
          period1: startDate.toISOString().substring(0, 10),
          period2: endDate.toISOString().substring(0, 10),
          interval: "1mo" as "1mo",
        })) as YahooHistoricalRow[];

        const priceMap = new Map<string, number>();
        for (const h of hist) {
          const key = `${h.date.getFullYear()}-${String(h.date.getMonth() + 1).padStart(2, "0")}`;
          priceMap.set(key, h.adjClose ?? h.close);
        }
        historicals[ticker] = priceMap;
      } catch { }
    })
  );

  const series: SeriesPoint[] = [];
  let accumulatedReturn = 1.0;
  let prevMonthValue = 0;

  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  // Ponto inicial (0%)
  const startKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
  series.push({ date: startKey, value: 0 });

  // Prepara o valor base para o cálculo do próximo mês
  const initialHoldings: Map<string, number> = new Map();
  const initialMonthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  for (const tx of transactions) {
    if (new Date(tx.date) > initialMonthEnd) continue;
    const t = `${tx.ticker}.SA`;
    const cur = initialHoldings.get(t) ?? 0;
    initialHoldings.set(t, tx.type === "COMPRA" ? cur + tx.quantity : cur - tx.quantity);
  }
  for (const [ticker, qty] of initialHoldings.entries()) {
    if (qty <= 0) continue;
    const price = historicals[ticker]?.get(startKey) ?? 0;
    prevMonthValue += qty * price;
  }

  cursor.setMonth(cursor.getMonth() + 1);

  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

    // 1. Calcular holdings até o fim deste mês
    const holdings: Map<string, number> = new Map();
    for (const tx of transactions) {
      if (new Date(tx.date) > monthEnd) continue;
      const t = `${tx.ticker}.SA`;
      const cur = holdings.get(t) ?? 0;
      holdings.set(t, tx.type === "COMPRA" ? cur + tx.quantity : cur - tx.quantity);
    }

    // 2. Valor total da carteira no fim do mês
    let currentTotalValue = 0;
    for (const [ticker, qty] of holdings.entries()) {
      if (qty <= 0) continue;
      const price = historicals[ticker]?.get(key) ?? 0;
      currentTotalValue += qty * price;
    }

    // 3. Fluxo de caixa do mês (Compras - Vendas)
    let monthlyFlow = 0;
    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      if (txDate >= monthStart && txDate <= monthEnd) {
        const cost = tx.quantity * tx.unit_price + (tx.other_costs || 0);
        monthlyFlow += (tx.type === "COMPRA" ? cost : -cost);
      }
    }

    // 4. Calcular retorno mensal (Dietz Method simplificado)
    // Retorno = Valor Final / (Valor Inicial + Fluxo)
    if (prevMonthValue + monthlyFlow > 0) {
      const monthlyReturn = currentTotalValue / (prevMonthValue + monthlyFlow);
      accumulatedReturn *= monthlyReturn;
    } else if (currentTotalValue > 0 && monthlyFlow > 0) {
      // Caso inicial ou reinício
      accumulatedReturn *= (currentTotalValue / monthlyFlow);
    }

    series.push({ 
      date: key, 
      value: parseFloat(((accumulatedReturn - 1) * 100).toFixed(2)) 
    });

    prevMonthValue = currentTotalValue;
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return series;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "1y";

  try {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        series: [
          { name: "Minha Carteira", data: [] },
          { name: "Carteira Ideal", data: [] },
          { name: "CDI", data: [] },
        ],
      });
    }

    const firstTxDate = new Date(transactions[0].date);
    const now = new Date();

    // Lógica de StartDate: O período selecionado respeita o limite do primeiro lançamento
    let startDate = new Date(firstTxDate);
    if (period !== "max") {
      const periodMap: Record<string, number> = { "1y": 1, "2y": 2, "5y": 5 };
      const years = periodMap[period] || 1;
      const limitDate = new Date(now.getFullYear() - years, now.getMonth(), 1);
      // Se o período selecionado for anterior ao primeiro lançamento, usamos o período
      // Caso contrário, usamos o primeiro lançamento
      if (limitDate > startDate) {
        startDate = limitDate;
      }
    }

    const [portfolioSeries, cdiSeries, idealSeries] = await Promise.all([
      fetchPortfolioSeries(transactions, startDate, now),
      fetchCDISeries(startDate, now).catch(() => [] as SeriesPoint[]),
      fetchBenchmarkSeries("^BVSP", startDate, now), // Ibovespa como Carteira Ideal
    ]);

    return NextResponse.json({
      series: [
        { name: "Minha Carteira", data: portfolioSeries },
        { name: "Carteira Ideal", data: idealSeries },
        { name: "CDI", data: cdiSeries },
      ],
    });
  } catch (error: any) {
    console.error("Performance API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
