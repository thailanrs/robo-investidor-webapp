import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// DELETE /api/price-alerts/:id - Delete a price alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { id } = params;

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Usuário não autenticado" },
      { status: 401 }
    );
  }

  // Delete alert (RLS ensures user can only delete their own)
  const { error: deleteError } = await supabase
    .from("price_alerts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // Extra safety check

  if (deleteError) {
    return NextResponse.json(
      { error: "Erro ao deletar alerta", details: deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, id });
}