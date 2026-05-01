import { parseBrapiError } from './brapiErrors';

export interface BrapiConfig {
  baseURL: string;
  token: string;
}

import { BrapiQuoteResponse } from '@/types/brapi';

class BrapiClient {
  private config: BrapiConfig;

  constructor() {
    const token = process.env.BRAPI_TOKEN;
    const baseURL = process.env.BRAPI_API_URL ?? 'https://brapi.dev/api';

    if (process.env.NODE_ENV !== 'production' && !token) {
      throw new Error('BRAPI_TOKEN is not set in environment variables');
    } else if (!token) {
      console.warn('BRAPI_TOKEN is not set. API calls will likely fail.');
    }

    this.config = {
      baseURL,
      token: token || '',
    };
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.config.baseURL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    url.searchParams.append('token', this.config.token);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw parseBrapiError(response, params?.ticker, endpoint);
    }

    return response.json() as Promise<T>;
  }

  public async getQuote(ticker: string, params?: Record<string, string>): Promise<BrapiQuoteResponse> {
    return this.fetch<BrapiQuoteResponse>(`/quote/${ticker}`, params);
  }

  public async getQuoteList(params?: Record<string, string>): Promise<{ stocks: import('@/types/brapi').AssetListItem[] }> {
    return this.fetch<{ stocks: import('@/types/brapi').AssetListItem[] }>('/quote/list', params);
  }
}

export const brapiClient = new BrapiClient();
