import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const DividendSchema = z.object({
  ticker: z.string().min(3).max(10).toUpperCase(),
  type: z.enum(['DIVIDENDO', 'JCP', 'RENDIMENTO_FII', 'AMORTIZACAO']),
  amount: z.number().positive('Valor deve ser maior que zero'),
  quantity: z.number().positive().optional(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(500).optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabase
      .from('dividends')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('payment_date', { ascending: false });

    if (ticker) {
      query = query.eq('ticker', ticker.toUpperCase());
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (from) {
      query = query.gte('payment_date', from);
    }
    if (to) {
      query = query.lte('payment_date', to);
    }

    const { data, count, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const totalAmount = data.reduce((sum, item) => sum + Number(item.amount), 0);

    return NextResponse.json({
      data,
      total: count || 0,
      totalAmount
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = DividendSchema.parse(body);

    const { data, error } = await supabase
      .from('dividends')
      .insert([{
        ...validatedData,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
