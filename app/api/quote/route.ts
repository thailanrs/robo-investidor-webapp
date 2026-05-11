import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export const revalidate = 60; // 1 minuto

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json(
      { error: "Parâmetro 'ticker' é obrigatório" },
      { status: 400 }
    );
  }

  try {
    const symbol = ticker.endsWith(".SA") ? ticker : `${ticker}.SA`;
    const quote = await yahooFinance.quote(symbol);

    if (!quote) {
      return NextResponse.json(
        { error: "Ativo não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      symbol: quote.symbol,
      regularMarketPrice: quote.regularMarketPrice || 0,
      regularMarketChange: quote.regularMarketChange || 0,
      regularMarketChangePercent: quote.regularMarketChangePercent || 0,
      regularMarketDayHigh: quote.regularMarketDayHigh || 0,
      regularMarketDayLow: quote.regularMarketDayLow || 0,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
      volume: quote.regularMarketVolume || 0,
      longName: quote.longName || quote.shortName || ticker,
      currency: quote.currency || "BRL",
      exchangeName: quote.exchangeName || "B3",
    });
  } catch (error: any) {
    console.error("Erro ao buscar cotação:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar dados do ativo" },
      { status: 500 }
    );
  }
}