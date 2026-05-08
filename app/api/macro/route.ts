import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { withCache } from '@/lib/dataCache';
import { CurrencyRate, MacroPrimeRate, MacroOverview } from '@/types/market';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

const MACRO_CACHE_TTL = 60 * 60 * 1000; // 1 hora

// ──────────────────────────────────────────────────────────
// BCB SGS (Banco Central do Brasil — Sistema Gerenciador de Séries)
// API pública, sem autenticação, sem rate limit significativo.
// Séries utilizadas:
//   432  = Meta para Taxa SELIC (% a.a.)
//   4389 = Taxa CDI over anualizada (% a.a.)
// ──────────────────────────────────────────────────────────
const BCB_SGS_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

interface BcbSgsEntry {
  data: string;   // "DD/MM/YYYY"
  valor: string;  // "14.75"
}

async function fetchBcbSerie(code: number, n = 1): Promise<BcbSgsEntry | null> {
  const url = `${BCB_SGS_BASE}.${code}/dados/ultimos/${n}?formato=json`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.warn(`[MACRO] BCB SGS série ${code} returned ${res.status}`);
      return null;
    }
    const data: BcbSgsEntry[] = await res.json();
    return data.length > 0 ? data[data.length - 1] : null;
  } catch (e) {
    console.warn(`[MACRO] BCB SGS série ${code} fetch failed:`, e);
    return null;
  }
}

function bcbDateToISO(bcbDate: string): string {
  // BCB retorna "DD/MM/YYYY" → converter para "YYYY-MM-DD"
  const [d, m, y] = bcbDate.split('/');
  return `${y}-${m}-${d}`;
}

// ──────────────────────────────────────────────────────────
export async function GET() {
  try {
    const result = await withCache<MacroOverview>(
      'macro:overview',
      async () => {
        const currencies: CurrencyRate[] = [];
        const rates: MacroPrimeRate[] = [];

        // 1. Câmbio via Yahoo Finance (USD/BRL e EUR/BRL)
        try {
          const [usdQuote, eurQuote] = await Promise.all([
            yahooFinance.quote('USDBRL=X'),
            yahooFinance.quote('EURBRL=X'),
          ]);

          if (usdQuote?.regularMarketPrice) {
            currencies.push({
              pair: 'USD/BRL',
              bidPrice: usdQuote.regularMarketPrice,
              percentChange: usdQuote.regularMarketChangePercent || 0,
              updatedAtDate: new Date().toISOString().split('T')[0],
            });
          }

          if (eurQuote?.regularMarketPrice) {
            currencies.push({
              pair: 'EUR/BRL',
              bidPrice: eurQuote.regularMarketPrice,
              percentChange: eurQuote.regularMarketChangePercent || 0,
              updatedAtDate: new Date().toISOString().split('T')[0],
            });
          }
        } catch (e) {
          console.warn('[MACRO] Yahoo Finance currency fetch failed:', e);
        }

        // 2. Meta SELIC via BCB SGS (série 432 = % a.a.)
        const selicEntry = await fetchBcbSerie(432);
        if (selicEntry) {
          rates.push({
            name: 'SELIC',
            value: parseFloat(selicEntry.valor),
            unit: '% a.a.',
            effectiveDate: bcbDateToISO(selicEntry.data),
          });
        }

        // 3. CDI over anualizado via BCB SGS (série 4389 = % a.a.)
        const cdiEntry = await fetchBcbSerie(4389);
        if (cdiEntry) {
          rates.push({
            name: 'CDI',
            value: parseFloat(cdiEntry.valor),
            unit: '% a.a.',
            effectiveDate: bcbDateToISO(cdiEntry.data),
          });
        }

        return {
          currencies,
          rates,
          stale: false,
        };
      },
      MACRO_CACHE_TTL
    );

    return NextResponse.json({
      data: {
        ...result.data,
        stale: result.stale,
      },
      cache_hit: result.cache_hit,
    });
  } catch (error) {
    console.error(`[MACRO ERROR]`, error);
    return NextResponse.json(
      { error: 'Falha ao buscar dados macroeconômicos' },
      { status: 500 }
    );
  }
}
