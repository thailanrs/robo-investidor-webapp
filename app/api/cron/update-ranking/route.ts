import { NextResponse } from 'next/server';
import { fetchFundamentusData } from '@/app/api/fundamentus/route';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // 1. Validar CRON_SECRET no header Authorization
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Chamar fetchFundamentusData()
    const tickers = await fetchFundamentusData();

    if (!tickers || tickers.length === 0) {
      throw new Error('No tickers returned from fetchFundamentusData');
    }

    // 3. Inserir em ideal_portfolio_snapshots via supabase service_role client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials for cron job');
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const snapshotDate = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD for date column

    const { error } = await supabase
      .from('ideal_portfolio_snapshots')
      .insert([
        {
          snapshot_date: snapshotDate,
          tickers: tickers,
        }
      ]);

    if (error) {
      throw error;
    }

    // 4. Retornar { success, updatedAt, count }
    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      count: tickers.length
    });

  } catch (error) {
    console.error('Error executing update-ranking cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
