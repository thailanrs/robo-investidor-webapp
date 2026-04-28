import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (client) {
    return client
  }

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Desativa a Web Locks API para evitar deadlocks.
        // A sessão é gerenciada server-side via cookies no middleware,
        // então o lock client-side é desnecessário.
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
          return fn()
        },
      }
    }
  )

  return client
}