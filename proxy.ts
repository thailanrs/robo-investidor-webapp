import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  // 1. Block direct brapi calls from frontend
  const urlStr = request.url.toLowerCase();
  const hasBrapiHeader = request.headers.get('x-direct-brapi') !== null;

  // Checking if the request is trying to hit brapi directly (either via url containing brapi.dev or specific header)
  if (urlStr.includes('brapi.dev') || hasBrapiHeader) {
    console.warn(`[Proxy] Blocked direct brapi call from frontend. URL: ${request.url}`);
    return NextResponse.json(
      { error: 'Direct brapi calls are not allowed. Use /api/market/*' },
      { status: 403 }
    );
  }

  // 2. Auth session management via Supabase
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes, shouldn't need session sync like pages, but we DO block brapi calls there if they somehow leak, though mostly we want to intercept client calls before they reach anywhere external. Actually, the requirement says "Aplicar apenas em rotas não-API (matcher: ['/((?!api|_next).*)'])")
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
