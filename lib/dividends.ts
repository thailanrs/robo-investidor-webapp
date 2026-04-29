export type DividendType = 'DIVIDENDO' | 'JCP' | 'RENDIMENTO_FII' | 'AMORTIZACAO';

export interface Dividend {
  id: string;
  user_id: string;
  ticker: string;
  type: DividendType;
  amount: number;
  quantity?: number;
  payment_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GetDividendsParams {
  ticker?: string;
  type?: DividendType;
  from?: string;
  to?: string;
}

export interface GetDividendsResponse {
  data: Dividend[];
  total: number;
  totalAmount: number;
}

export type CreateDividendPayload = Omit<Dividend, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export async function fetchDividends(params?: GetDividendsParams): Promise<GetDividendsResponse> {
  const url = new URL('/api/dividends', window.location.origin);
  if (params?.ticker) url.searchParams.append('ticker', params.ticker);
  if (params?.type) url.searchParams.append('type', params.type);
  if (params?.from) url.searchParams.append('from', params.from);
  if (params?.to) url.searchParams.append('to', params.to);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Erro ao buscar proventos');
  }
  return response.json();
}

export async function createDividend(payload: CreateDividendPayload): Promise<{ data: Dividend }> {
  const response = await fetch('/api/dividends', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Erro ao criar provento');
  }
  return response.json();
}

export async function deleteDividend(id: string): Promise<{ success: true }> {
  const response = await fetch(`/api/dividends/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Erro ao deletar provento');
  }
  return response.json();
}
