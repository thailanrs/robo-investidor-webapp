import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Busca os tickers ranqueados pela Fórmula Mágica via Supabase Edge Function.
 * 
 * O scraping do Fundamentus é delegado para a Edge Function `fundamentus-scraper`
 * no Supabase (Deno Deploy), pois o Cloudflare do Fundamentus bloqueia
 * requisições vindas de IPs de datacenters (AWS/Vercel).
 */
export async function fetchFundamentusData(): Promise<string[]> {
  const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/fundamentus-scraper`;

  const response = await fetch(edgeFunctionUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Edge Function retornou status ${response.status}: ${errorBody}`);
  }

  const tickers: string[] = await response.json();
  return tickers;
}

export async function GET() {
  try {
    const resultTickers = await fetchFundamentusData();
    return NextResponse.json(resultTickers);
  } catch (error) {
    console.error('Error fetching Fundamentus data:', error);
    return NextResponse.json({ error: 'Failed to process data' }, { status: 500 });
  }
}
