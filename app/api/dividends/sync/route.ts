import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDividendSuggestions } from '@/lib/services/dividendSyncService';
import { z } from 'zod';

const SyncInsertSchema = z.array(
  z.object({
    ticker: z.string().min(3).max(10).toUpperCase(),
    type: z.enum(['DIVIDENDO', 'JCP', 'RENDIMENTO_FII', 'AMORTIZACAO']),
    amount: z.number().positive(),
    quantity: z.number().positive(),
    payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: z.string().max(500).optional(),
  })
);

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const suggestions = await getDividendSuggestions(user.id);

    return NextResponse.json({ data: suggestions });
  } catch (error: any) {
    console.error('Error syncing dividends:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
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
    const validatedData = SyncInsertSchema.parse(body.dividends);

    if (validatedData.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const inserts = validatedData.map(div => ({
      ...div,
      user_id: user.id,
      notes: div.notes || 'Sincronizado automaticamente'
    }));

    const { data, error } = await supabase
      .from('dividends')
      .insert(inserts)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error bulk inserting dividends:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
