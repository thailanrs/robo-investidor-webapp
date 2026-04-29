import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;

    // Deleta o registro, validando indiretamente pelo userId
    const { error: deleteError } = await supabase
      .from('dividends')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('user_id', user.id);

    if (deleteError) {
       return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
