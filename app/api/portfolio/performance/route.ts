import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import yahooFinance from "yahoo-finance2";

export const revalidate = 3600; // Cache de 1 hora

type SeriesPoint = { date: string; value: number };

/** Busca taxa CDI mensal acumulada do Banco Central do Brasil */
async function fetchCDISeries(startDate: Date, endDate: Date): Promise<SeriesPoint[]> {
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${fmt(startDate)}&dataFinal=${fmt(endDate)}`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`BCB API error: ${res.status}`);

  const raw: { data: string; valor: string }[] = await res.json();

  // Agrupar por mês (pegar último valor de cada mês) e calcular acumulado
  const byMonth: Map<string, number> = new Map();
  for (const entry of raw) {
    const [d, m, y] = entry.data.split("/");
    const key = `${y}-${m}`;
    byMonth.set(key, parseFloat(entry.valor.replace(",", ".")));
  }

  const series: SeriesPoint[] = [];
  let accumulated = 100;
  // Iterate from startDate to endDate month by month
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

  // Buscar histórico mensal de cada ticker
  const historicals: Record<string, Map<string, number>> = {};
  await Promise.allSettled(
    tickers.map(async (ticker) => {
      try {
        const hist = await yahooFinance.historical(ticker, {
          period1: startDate,
          period2: endDate,
          interval: "1mo",
        });
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
    const keyDate = cursor.toISOString().substring(0, 10);

    // Posição da carteira neste mês (acumula transações até este mês)
    const holdings: Map<string, number> = new Map();
    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      if (txDate > new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)) continue;
      const t = `${tx.ticker}.SA`;
      const cur = holdings.get(t) ?? 0;
      holdings.set(t, tx.type === "BUY" ? cur + tx.quantity : cur - tx.quantity);
    }

    // Valor total da carteira neste mês
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
  const { data: { user } } = await supabase.auth.getUser();

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

    // Calcular startDate baseado no period e na data da primeira transação
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
    // 'max' usa firstTxDate diretamente

    const [portfolioSeries, cdiSeries] = await Promise.all([
      fetchPortfolioSeries(transactions, startDate, now),
      fetchCDISeries(startDate, now).catch(() => [] as SeriesPoint[]),
    ]);

    // Carteira Ideal: placeholder indexado em 100 até ROB-14 estar concluído
    // (scraper Fundamentus + snapshots históricos ainda não existem)
    const idealSeries: SeriesPoint[] = portfolioSeries.map((p) => ({ date: p.date, value: 100 }));

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
