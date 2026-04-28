import { NextRequest, NextResponse } from 'next/server';
import yahooFinanceDefault from 'yahoo-finance2';

const yahooFinance = new (yahooFinanceDefault as any)();

// Cache route segment options
export const revalidate = 300; // Cache por 5 minutos (300 segundos)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get('tickers');

  if (!tickersParam) {
    return NextResponse.json({ error: 'Nenhum ticker fornecido.' }, { status: 400 });
  }

  const tickers = tickersParam.split(',').map((t) => t.trim().toUpperCase());

  if (tickers.length === 0) {
    return NextResponse.json({ error: 'Nenhum ticker válido fornecido.' }, { status: 400 });
  }

  try {
    // Formatar os tickers (adicionando .SA para ativos brasileiros sem sufixo)
    // Uma heurística simples: se o ticker só tem letras e números (sem ponto), adicionamos .SA
    const formattedTickers = tickers.map((ticker) => {
      if (!ticker.includes('.')) {
        return `${ticker}.SA`;
      }
      return ticker;
    });

    const quotes = await yahooFinance.quote(formattedTickers);

    // Mapear de volta para o ticker original para facilitar o uso no frontend
    const result: Record<string, { price: number; currency: string; change: number; changePercent: number }> = {};
    
    // O retorno pode ser um único objeto (se 1 ticker) ou array de objetos
    const quotesArray: any[] = Array.isArray(quotes) ? quotes : [quotes];

    quotesArray.forEach((quote: any) => {
      // Remover .SA do símbolo retornado caso o ticker original não tivesse
      const originalTicker = tickers.find(
        (t) => t === quote.symbol || `${t}.SA` === quote.symbol
      ) || quote.symbol;

      result[originalTicker] = {
        price: quote.regularMarketPrice || 0,
        currency: quote.currency || 'BRL',
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao buscar cotações:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar cotações do Yahoo Finance.', details: error.message },
      { status: 500 }
    );
  }
}
