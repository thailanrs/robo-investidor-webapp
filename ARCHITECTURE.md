# Robô Investidor - Architecture & Tech Stack

## Visão Geral
SaaS de gestão de patrimônio e análise quantitativa de ativos da B3 (Ações, FIIs e FIAGROs). O sistema combina a Fórmula Mágica de Joel Greenblatt com IA generativa para auxiliar na tomada de decisão.

## Tech Stack
* **Framework:** Next.js 16 (App Router, Turbopack)
* **Linguagem:** TypeScript
* **Estilização:** Tailwind CSS (Shadcn UI / v0 para componentes base)
* **Backend & Auth:** Supabase (PostgreSQL, Row Level Security habilitado, `@supabase/ssr`)
* **IA Generativa:** Google Gemini (gemini-2.5-flash) via `@google/generative-ai`
* **Scraping e Dados Financeiros:** `cheerio` (Fundamentus) e `yahoo-finance2` (Histórico/Cotações)
* **Data Fetching Client:** `@tanstack/react-query` (useQuery, useMutation, useQueryClient)
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

// Dentro do JSX do layout:
// <Providers>{children}</Providers>
```

## Funções Reutilizáveis de Scraping (Importante para Agentes de IA)

> ⚠️ **Regra de Reuso:** Nunca duplicar lógica de scraping ou ranking. As funções abaixo são exported nomeados e devem ser importadas diretamente onde necessário.

| Função | Arquivo | Descrição |
|---|---|---|
| `fetchFundamentusData()` | `app/api/fundamentus/route.ts` | Executa o scraping do Fundamentus, aplica filtros de qualidade e retorna os tickers rankeados pela Fórmula Mágica como `string[]`. Deve ser **importada** pelo cron job (ROB-16) e qualquer outra rota que precise do ranking — nunca reimplementada. |

## 🗂️ Migrations de Banco de Dados (CRÍTICO)

> ⚠️ **Lição aprendida (ROB-13):** O Jules criou migrations em `./supabase/migrations/` — pasta ignorada pelo CI/CD. O pipeline da Vercel e o processo de deploy **não executam** migrations automaticamente a partir dessa pasta. Toda migration deve ser colocada no caminho correto abaixo.

### Caminho Canônico para Migrations
```
./utils/supabase/migrations/
```

### Regras
1. **Sempre** criar arquivos `.sql` de migration em `./utils/supabase/migrations/` — nunca em `./supabase/migrations/` ou qualquer outro caminho.
2. Nomear o arquivo com timestamp + descrição: `YYYYMMDDHHMMSS_nome_da_migration.sql` (ex: `20260429120000_create_dividends.sql`).
3. O SQL deve ser **idempotente** quando possível: usar `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DO $$ ... IF NOT EXISTS ... $$`.
4. **Toda migration mergeada na `main` deve ser executada manualmente no Supabase de produção** até que um pipeline automatizado seja implementado. Registrar no PR que a migration foi aplicada.
5. Após aplicar a migration em produção, atualizar o `STATE.md` com as novas tabelas/campos.

### Checklist de Release (por PR com DDL)
- [ ] Arquivo `.sql` criado em `./utils/supabase/migrations/`
- [ ] Migration executada no Supabase de produção
- [ ] Tabela/campos novos registrados no `STATE.md`
- [ ] Smoke test da rota/funcionalidade em produção após deploy

## Princípios de Desenvolvimento (Para Agentes de IA)
1.  **Segurança:** Todas as rotas de API sensíveis devem validar a sessão do usuário via Supabase Auth. Tabelas do banco de dados utilizam RLS atrelado ao `auth.uid()`. Rotas de cron devem validar `Authorization: Bearer {CRON_SECRET}`.
2.  **Performance:** Utilize Server Components sempre que possível. Processamentos pesados de dados (como o cálculo do ranking quantitativo) não devem bloquear a thread principal (UI).
3.  **Design System:** O padrão visual é o Dark Mode com acentos em cores neon (ex: verde para alta, vermelho para baixa). Gráficos devem usar bibliotecas leves (Recharts ou Chart.js).
4.  **Lançamentos:** A arquitetura do banco de dados para a carteira do usuário deve seguir o padrão "Event Sourcing" (Ledger). Não atualize saldos diretamente; grave transações de COMPRA/VENDA e calcule o saldo e preço médio a partir do histórico. O campo `other_costs` (taxas/emolumentos) **NÃO** entra no cálculo de preço médio ou valor do ativo — é usado apenas para representar o custo total da operação.
5.  **Autenticação Client-Side:** Nunca chamar `supabase.auth.getUser()` em componentes client. Sempre use `useUser()` do Context. A sessão é gerenciada exclusivamente server-side via cookies.
6.  **Migrations:** Sempre criar migrations em `./utils/supabase/migrations/` — ver seção "Migrations de Banco de Dados" acima.
7.  **Reuso de Código:** Nunca reimplementar funções já existentes. Ver seção "Funções Reutilizáveis de Scraping" acima.
8.  **React Query:** Toda página que use `useQuery`, `useMutation` ou `useQueryClient` depende do `QueryClientProvider` no layout pai (`app/(app)/layout.tsx` via `components/Providers.tsx`). Ver seção "React Query" acima.
