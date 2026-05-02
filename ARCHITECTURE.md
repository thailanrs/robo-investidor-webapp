# Robô Investidor - Architecture & Tech Stack
_Última atualização: 2026-05-01_

## Visão Geral
SaaS de gestão de patrimônio e análise quantitativa de ativos da B3 (Ações, FIIs e FIAGROs). O sistema combina a Fórmula Mágica de Joel Greenblatt com IA generativa para auxiliar na tomada de decisão. Integra a API **brapi.dev** como fonte primária de dados de mercado em tempo real.

## Tech Stack
* **Framework:** Next.js 15 (App Router, Turbopack)
* **Linguagem:** TypeScript
* **Estilização:** Tailwind CSS (Shadcn UI / v0 para componentes base)
* **Backend & Auth:** Supabase (PostgreSQL, Row Level Security habilitado, `@supabase/ssr`)
* **IA Generativa:** Google Gemini (gemini-2.5-flash) via `@google/generative-ai`
* **Dados de Mercado:** brapi.dev SDK (`brapi`) — fonte primária para cotações, histórico, dividendos, fundamentalistas e macro
* **Scraping Legado:** `cheerio` (Fundamentus) e `yahoo-finance2` — mantidos para ranking quantitativo até migração completa para brapi
* **Data Fetching Client:** `@tanstack/react-query` (useQuery, useMutation, useQueryClient)
* **Cache:** Memory (in-process Map) + Supabase KV (persistência entre deploys)
* **Deploy:** Vercel

## Arquitetura de Autenticação
A autenticação segue o padrão **Server-First** para evitar deadlocks da Web Locks API do Supabase no navegador.

### Fluxo
1. **Middleware** (`proxy.ts` → `utils/supabase/middleware.ts`): Intercepta todas as requisições. Valida a sessão via cookies usando `createServerClient`. Redireciona para `/login` se não há usuário autenticado. Rotas públicas: `/login`, `/auth/callback`, `/api/*`.
2. **Server Layout** (`app/(app)/layout.tsx`): Server Component que busca o usuário via `supabase.auth.getUser()` (cookies, sem locks). Busca também o perfil (`profiles`). Injeta os dados no `UserProvider`.
3. **UserContext** (`contexts/UserContext.tsx`): React Context que distribui `{ id, email, profile }` para toda a árvore de componentes client.
4. **Componentes Client**: Acessam dados do usuário via hook `useUser()`. **Nunca** chamam `supabase.auth.getUser()` diretamente (causa deadlocks).

### Clientes Supabase
* **Server** (`utils/supabase/server.ts`): Usado em Server Components e Server Actions. Lê/escreve cookies.
* **Client** (`utils/supabase/client.ts`): Singleton com no-op lock. Usado apenas para operações de dados (CRUD) em componentes client, nunca para autenticação.

## Estrutura de Route Groups
* `app/(auth)/` — Rotas públicas de autenticação: `/login`, `/auth/callback`
* `app/(app)/` — Rotas protegidas: Dashboard (`/`), Meus Ativos (`/carteira`), Lançamentos (`/carteira/lancamentos`), Histórico (`/historico`), Perfil (`/perfil`), Proventos (`/proventos`)

## Estrutura de Pastas

```
robo-investidor-webapp/
├── app/
│   ├── api/
│   │   ├── quotes/route.ts              # Cotações em tempo real (ROB-37) ✅
│   │   ├── assets/
│   │   │   └── search/route.ts          # Autocomplete de ativos (ROB-48) ✅
│   │   ├── history/
│   │   │   └── [ticker]/route.ts        # Histórico OHLCV (ROB-49) ✅
│   │   ├── dividends/
│   │   │   └── [ticker]/route.ts        # Dividendos e JCP (ROB-50) ✅
│   │   ├── fundamentals/
│   │   │   └── [ticker]/route.ts        # Dados fundamentalistas (ROB-51) ✅
│   │   ├── macro/route.ts               # Câmbio + indicadores macro (ROB-52) ✅
│   │   ├── fundamentus/route.ts         # Scraping Fundamentus (legado)
│   │   └── cron/update-ranking/route.ts # Cron job diário (ROB-16) ✅
│   ├── (auth)/
│   ├── (app)/
│   └── layout.tsx
├── components/
│   ├── layout/                          # Sidebar, Header, UserDropdown
│   ├── ui/                              # Componentes Shadcn/custom
│   └── Providers.tsx                    # QueryClientProvider
├── contexts/
│   └── UserContext.tsx
├── hooks/
│   └── brapi/                           # Hooks React Query para brapi (próxima fase)
├── lib/
│   ├── brapiClient.ts                   # Singleton SDK brapi (ROB-36) ✅
│   ├── brapiCache.ts                    # getCached() memory+KV, TTLs (ROB-53) ✅
│   ├── brapiErrors.ts                   # BrapiError, handleBrapiError (ROB-53) ✅
│   ├── brapiLogger.ts                   # logBrapiRequest(), brapi_request_logs (ROB-53) ✅
│   ├── dividendMatcher.ts               # matchDividendsWithUserEntries() (ROB-50) ✅
│   ├── portfolio.ts                     # Engine preço médio / posição
│   └── supabase/
├── types/
│   ├── brapi.ts                         # Tipagem completa da camada brapi ✅
│   └── supabase.ts
├── utils/
│   └── supabase/                        # server.ts, client.ts, middleware.ts
├── supabase/
│   └── migrations/                      # Migrations SQL versionadas
└── public/
```

## Camada de Dados de Mercado (brapi)

### Fluxo de uma Requisição

```
Client Component
  → fetch('/api/quotes?tickers=PETR4')
    → app/api/quotes/route.ts
      → getCached(key, fetcher, ttl)          [brapiCache.ts]
        → brapiClient.quote(tickers)          [brapiClient.ts]
      → logBrapiRequest(...)                  [brapiLogger.ts]
      → NextResponse.json({ data, stale })
```

### API Routes Brapi Disponíveis

| Rota | Descrição | TTL Cache | Issue |
|---|---|---|---|
| `GET /api/quotes` | Cotações em tempo real | 5 min | ROB-37 ✅ |
| `GET /api/assets/search` | Lista/autocomplete de ativos | 24h | ROB-48 ✅ |
| `GET /api/history/[ticker]` | Histórico OHLCV | 1h | ROB-49 ✅ |
| `GET /api/dividends/[ticker]` | Dividendos e JCP históricos | 12h | ROB-50 ✅ |
| `GET /api/fundamentals/[ticker]` | Dados fundamentalistas | 24h | ROB-51 ✅ |
| `GET /api/macro` | Câmbio (USD/BRL, EUR/BRL) + SELIC | 1h | ROB-52 ✅ |

### Estratégia de Cache (ROB-53)

* **Camada 1 — Memory**: Map in-process, zero latência, dura até restart do servidor
* **Camada 2 — Supabase KV**: Persiste entre deploys/instâncias, tolerante a cold start
* **Campo `stale`**: retornado em todos os responses; `true` indica dado servido do cache

### Tratamento de Erros

Todas as routes usam `handleBrapiError(error, ticker?)` que mapeia para:
* `BrapiError` → 502 Bad Gateway
* `RateLimitError` → 429 Too Many Requests
* `AuthenticationError` → 401 Unauthorized
* `NotFoundError` → 404 Not Found

## Layout de UI
* **Sidebar** (`components/layout/Sidebar.tsx`): Colapsável (ícone-only ↔ ícone+texto). Estado gerenciado no `AppLayoutClient`.
* **Header** (`components/layout/Header.tsx`): Top bar com botão de menu mobile e `UserDropdown`.
* **UserDropdown** (`components/layout/UserDropdown.tsx`): Exibe avatar/iniciais, nome, link para perfil e logout. Dados vêm do `useUser()`.

## React Query (TanStack Query)

O `@tanstack/react-query` é usado em páginas client para data fetching com cache e mutations.

### Setup obrigatório

> ⚠️ **Causa raiz do bug `/proventos` (29/04/2026):** A página `app/(app)/proventos/page.tsx` usa `useQuery`, `useMutation` e `useQueryClient`, mas o `app/(app)/layout.tsx` não possuía `QueryClientProvider` na árvore. Isso causa erro de runtime no Next.js e a página exibe "This page couldn't load". **Qualquer nova página que use hooks do React Query depende desse provider.**

* O **`QueryClientProvider`** deve envolver toda a árvore `app/(app)/` via um componente `Providers` client-side.
* **Regra:** Nunca use `useQuery`, `useMutation` ou `useQueryClient` em uma página sem garantir que o `QueryClientProvider` esteja presente no layout pai.

### Padrão de implementação

```tsx
// components/Providers.tsx  ← criar este arquivo
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

```tsx
// app/(app)/layout.tsx  ← envolver {children} com <Providers>
import { Providers } from "@/components/Providers";
// <Providers>{children}</Providers>
```

## Funções Reutilizáveis (Importante para Agentes de IA)

> ⚠️ **Regra de Reuso:** Nunca duplicar lógica de scraping, ranking ou dados de mercado.

| Função | Arquivo | Descrição |
|---|---|---|
| `fetchFundamentusData()` | `app/api/fundamentus/route.ts` | Scraping do Fundamentus, filtros e ranking Fórmula Mágica. Deve ser **importada** pelo cron job (ROB-16) — nunca reimplementada. |
| `getCached()` | `lib/brapiCache.ts` | Cache duplo memory+KV. Usar em **todas** as routes brapi. |
| `handleBrapiError()` | `lib/brapiErrors.ts` | Mapeia erros brapi para HTTP status. Usar no `catch` de todas as routes brapi. |
| `logBrapiRequest()` | `lib/brapiLogger.ts` | Registra latência e cache hit em `brapi_request_logs`. Chamar após cada request brapi. |
| `matchDividendsWithUserEntries()` | `lib/dividendMatcher.ts` | Compara dividendos brapi com lançamentos manuais do usuário. |

## 🗂️ Migrations de Banco de Dados (CRÍTICO)

> ⚠️ **Lição aprendida (ROB-13):** O Jules criou migrations em `./supabase/migrations/` — pasta ignorada pelo CI/CD. O pipeline da Vercel e o processo de deploy **não executam** migrations automaticamente a partir dessa pasta. Toda migration deve ser colocada no caminho correto abaixo.

### Caminho Canônico para Migrations
```
./supabase/migrations/
```

### Regras
1. **Sempre** criar arquivos `.sql` de migration em `./supabase/migrations/`.
2. Nomear o arquivo com timestamp + descrição: `YYYYMMDDHHMMSS_nome_da_migration.sql`.
3. O SQL deve ser **idempotente** quando possível.
4. **Toda migration mergeada na `main` deve ser executada manualmente no Supabase de produção**.
5. Após aplicar a migration em produção, atualizar o `STATE.md`.

### Checklist de Release (por PR com DDL)
- [ ] Arquivo `.sql` criado em `./supabase/migrations/`
- [ ] Migration executada no Supabase de produção
- [ ] Tabela/campos novos registrados no `STATE.md`
- [ ] Smoke test da rota/funcionalidade em produção após deploy

## Princípios de Desenvolvimento (Para Agentes de IA)
1. **Segurança:** Todas as rotas de API sensíveis devem validar a sessão do usuário via Supabase Auth. Tabelas do banco de dados utilizam RLS atrelado ao `auth.uid()`. Rotas de cron devem validar `Authorization: Bearer {CRON_SECRET}`.
2. **Performance:** Utilize Server Components sempre que possível. Processamentos pesados não devem bloquear a thread principal.
3. **Design System:** O padrão visual é o Dark Mode com acentos em cores neon (verde para alta, vermelho para baixa). Gráficos devem usar Recharts ou Chart.js.
4. **Lançamentos:** Arquitetura de banco no padrão "Event Sourcing" (Ledger). Não atualize saldos diretamente; grave transações e calcule a partir do histórico. O campo `other_costs` **NÃO** entra no cálculo de preço médio.
5. **Autenticação Client-Side:** Nunca chamar `supabase.auth.getUser()` em componentes client. Sempre use `useUser()` do Context.
6. **Migrations:** Sempre criar migrations em `./supabase/migrations/`.
7. **Reuso de Código:** Nunca reimplementar funções já existentes. Ver seção "Funções Reutilizáveis" acima.
8. **React Query:** Toda página que use `useQuery`, `useMutation` ou `useQueryClient` depende do `QueryClientProvider` no layout pai.
9. **Scraping e Integrações Externas:** Toda chamada a sites com risco de bloqueio de IP por WAF (Fundamentus, B3) deve ser extraída para uma Edge Function no Supabase — nunca via API Routes da Vercel.
10. **Brapi:** Nunca chamar `brapiClient` diretamente de componentes ou páginas. Sempre via API Route → `getCached()` → `brapiClient`. Isso garante cache centralizado e logging consistente.
