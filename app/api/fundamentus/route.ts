import { NextResponse } from 'next/server';

export async function fetchFundamentusData(): Promise<string[]> {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  console.log(`Chamando Edge Function: ${SUPABASE_URL}/functions/v1/fundamentus-scraper`);
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/fundamentus-scraper`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Erro ao chamar fundamentus-scraper: ${response.status} - ${errorText}`);
    throw new Error(`Failed to call fundamentus-scraper: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    console.error(`Erro retornado pela Edge Function: ${data.error}`);
    throw new Error(data.error);
  }

  const tickers: string[] = data;
  console.log(`Tickers recebidos da Edge Function: ${tickers?.length || 0}`);
  
  return (tickers || []).filter(t => !t.endsWith("12"));
}

export async function GET() {
  try {
    const resultTickers = await fetchFundamentusData();
    return NextResponse.json(resultTickers);
  } catch (error: any) {
    console.error('Error fetching Fundamentus from Edge Function:', error);
    return NextResponse.json({ error: error.message || 'Failed to process data' }, { status: 500 });
  }
}
