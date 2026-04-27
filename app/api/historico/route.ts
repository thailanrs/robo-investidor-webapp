import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('historico_analises')
      .select('*')
      .order('data_analise', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
