import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { priceAlertSchema } from "@/lib/schemas/price-alert";

// GET /api/price-alerts - List all price alerts for the authenticated user
export async function GET() {
  const supabase = await createClient();

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

  const { data: alerts, error } = await supabase
    .from("price_alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Erro ao buscar alertas", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(alerts);
}

// POST /api/price-alerts - Create a new price alert
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Get current user (following CONVENTIONS.md: user is injected via server-side)
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

  // Validate request body
  const body = await request.json();
  const validationResult = priceAlertSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: validationResult.error.issues },
      { status: 400 }
    );
  }

  const { ticker, target_price, direction } = validationResult.data;

  // Create alert
  const { data: alert, error: insertError } = await supabase
    .from("price_alerts")
    .insert({
      ticker: ticker.toUpperCase(),
      target_price,
      direction,
      user_id: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Erro ao criar alerta", details: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(alert, { status: 201 });
}