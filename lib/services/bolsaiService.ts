import { withCache } from '@/lib/dataCache';

const BOLSAI_API_KEY = process.env.BOLSAI_API_KEY || '';
const BASE_URL = 'https://api.usebolsai.com/api/v1';

export class BolsaiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'BolsaiError';
    this.status = status;
  }
}

export interface BolsaiFii {
  ticker: string;
  name: string;
  reference_date: string;
  close_price: number;
  book_value_per_share: number;
  pvp: number;
  dividend_yield_ttm: number;
  net_asset_value: number;
  shares_outstanding: number;
  total_shareholders: number;
  segment: string;
  management_type: string;
}

export interface BolsaiFundamentals {
  cvm_code: string;
  ticker: string;
  reference_date: string;
  close_price: number;
  shares_outstanding: number;
  market_cap: number;
  pl: number;
  pvp: number;
  ev_ebitda: number;
  ev_ebit: number;
  p_ebitda: number;
  p_ebit: number;
  p_sr: number;
  lpa: number;
  vpa: number;
  roe: number;
  roa: number;
  roic: number;
  net_margin: number;
  gross_margin: number;
  ebitda_margin: number;
  ebit_margin: number;
  debt_equity: number;
  net_debt_equity: number;
  net_debt_ebitda: number;
  net_debt_ebit: number;
  current_ratio: number;
  asset_turnover: number;
  p_assets: number;
  ebit_over_assets: number;
  cagr_revenue_5y: number;
  cagr_earnings_5y: number | null;
  net_income: number;
  equity: number;
  net_revenue: number;
  total_debt: number;
  ebitda: number;
  ebit: number;
  net_debt: number;
  cash: number;
  total_assets: number;
  current_assets: number;
  current_liabilities: number;
  corporate_name: string;
}

export interface BolsaiMacroResponse {
  series: string;
  series_code: string;
  count: number;
  data: Array<{
    date: string;
    value: number;
  }>;
}

class BolsaiClient {
  private async fetch<T>(endpoint: string): Promise<T> {
    if (!BOLSAI_API_KEY) {
      console.warn('BOLSAI_API_KEY is not defined.');
    }

    const url = `${BASE_URL}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        headers: {
          'X-API-Key': BOLSAI_API_KEY,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = 'Failed to fetch Bolsai API';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText;
        }
        throw new BolsaiError(errorMessage, response.status);
      }

      return response.json() as Promise<T>;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new BolsaiError('Bolsai API request timed out', 408);
      }
      throw err;
    }
  }

  public async getFiiFundamentals(ticker: string): Promise<BolsaiFii> {
    const tickerUpper = ticker.toUpperCase();
    const result = await withCache(
      `bolsai:fii:${tickerUpper}`,
      () => this.fetch<BolsaiFii>(`/fiis/${tickerUpper}`),
      24 * 60 * 60 * 1000 // 24 hours TTL
    );
    return result.data;
  }

  public async getFundamentals(ticker: string): Promise<BolsaiFundamentals> {
    const tickerUpper = ticker.toUpperCase();
    const result = await withCache(
      `bolsai:fundamentals:${tickerUpper}`,
      () => this.fetch<BolsaiFundamentals>(`/fundamentals/${tickerUpper}`),
      24 * 60 * 60 * 1000 // 24 hours TTL
    );
    return result.data;
  }

  public async getMacroData(indicator: 'selic' | 'ipca' | 'cdi' | 'usd_brl'): Promise<BolsaiMacroResponse> {
    // Buscar os ultimos 5 valores
    const result = await withCache(
      `bolsai:macro:${indicator}`,
      () => this.fetch<BolsaiMacroResponse>(`/macro/${indicator}?limit=5`),
      12 * 60 * 60 * 1000 // 12 hours TTL
    );
    return result.data;
  }
}

export const bolsaiClient = new BolsaiClient();
