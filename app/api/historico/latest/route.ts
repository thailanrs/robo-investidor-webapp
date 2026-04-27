import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('historico_analises')
      .select('*')
      .order('data_analise', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Supabase returns PGRST116 when single() finds 0 rows
        return NextResponse.json({ success: true, data: null });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Erro ao buscar análise mais recente:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
