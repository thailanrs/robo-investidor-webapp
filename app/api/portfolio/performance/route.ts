import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import yahooFinance from "yahoo-finance2";

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
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${fmt(startDate)}&dataFinal=${fmt(endDate)}`;

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
  let accumulated = 100;
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const monthlyRate = byMonth.get(key) ?? 0;
    accumulated = accumulated * (1 + monthlyRate / 100);
    series.push({ date: key, value: parseFloat(accumulated.toFixed(2)) });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return series;
}

/** Calcula série mensal da carteira do usuário usando Yahoo Finance */
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
        // Cast explícito para YahooHistoricalRow[] para evitar inferência 'never'
        // causada pelo overload de yahooFinance.historical com queryOptions tipado
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
      } catch {
        // ticker indisponível no Yahoo — ignora silenciosamente
      }
    })
  );

  const series: SeriesPoint[] = [];
  let portfolioBase: number | null = null;

  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;

    const holdings: Map<string, number> = new Map();
    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      if (txDate > new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)) continue;
      const t = `${tx.ticker}.SA`;
      const cur = holdings.get(t) ?? 0;
      holdings.set(t, tx.type === "BUY" ? cur + tx.quantity : cur - tx.quantity);
    }

    let totalValue = 0;
    for (const [ticker, qty] of holdings.entries()) {
      if (qty <= 0) continue;
      const price = historicals[ticker]?.get(key) ?? 0;
      totalValue += qty * price;
    }

    if (portfolioBase === null || portfolioBase === 0) {
      portfolioBase = totalValue || 1;
    }

    const indexed = parseFloat(((totalValue / portfolioBase) * 100).toFixed(2));
    series.push({ date: key, value: indexed > 0 ? indexed : 100 });
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

    let startDate = new Date(firstTxDate);
    if (period === "1y") {
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      if (oneYearAgo > startDate) startDate = oneYearAgo;
    } else if (period === "2y") {
      const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), 1);
      if (twoYearsAgo > startDate) startDate = twoYearsAgo;
    } else if (period === "5y") {
      const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), 1);
      if (fiveYearsAgo > startDate) startDate = fiveYearsAgo;
    }

    const [portfolioSeries, cdiSeries] = await Promise.all([
      fetchPortfolioSeries(transactions, startDate, now),
      fetchCDISeries(startDate, now).catch(() => [] as SeriesPoint[]),
    ]);

    const idealSeries: SeriesPoint[] = portfolioSeries.map((p) => ({
      date: p.date,
      value: 100,
    }));

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
