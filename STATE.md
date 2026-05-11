# Estado Atual do Projeto (State of Project)
_Última atualização: 2026-05-11_

## Tabelas no Supabase (Database Schema)
* `ideal_portfolio_snapshots`: id (uuid, PK), snapshot_date (date, not null), tickers (jsonb, not null), created_at (timestamptz, default now())
* `historico_analises`: id, data_analise, dados_acoes (jsonb), resumo_ia, user_id
* `users` (Supabase Auth nativo)
* `transactions`: id, user_id, ticker, type, quantity, unit_price, other_costs, date, created_at
* `profiles`: id (references auth.users), nome_completo, avatar_url, data_atualizacao, nivel
* `dividends`: id, user_id (references auth.users), ticker, type (enum: DIVIDENDO | JCP | RENDIMENTO_FII | AMORTIZACAO), amount, quantity, payment_date, notes, created_at, updated_at — **migration aplicada manualmente em produção em 29/04/2026 (ROB-13)**
* `data_cache`: key, value (jsonb), expires_at (timestamptz) — **tabela KV genérica para cache de dados de mercado** (renomeada de `brapi_cache` em 2026-05-08)
* `notifications`: id (uuid PK), user_id (references auth.users), type (varchar(50), ex: 'price_alert', 'dividend'), title (varchar(255)), message (text), read (boolean default false), created_at (timestamptz default now()), related_entity_id (uuid, opcional) — **migration atualizada em 2026-05-08 (ELE-6), migration de limpeza de índice órfão 20260508214500_drop_orphaned_notification_index.sql aplicada**, RLS habilitado com política de acesso por usuário (auth.uid() = user_id), índices em (user_id, read) e (created_at DESC), Supabase Realtime habilitado
* `price_alerts`: id (uuid PK, default gen_random_uuid()), ticker (text, not null), target_price (numeric, not null), direction (enum: above/below, not null), user_id (uuid, references auth.users, not null), triggered_at (timestamptz, nullable), created_at (timestamptz, default now()) — **migration criada em 2026-05-08 (ELE-7)**, RLS habilitado com política de acesso por usuário (auth.uid() = user_id), índices em (user_id), (ticker), (triggered_at), (created_at DESC)
* [NOVAS TABELAS DEVEM SER REGISTRADAS AQUI COM SEUS CAMPOS EXATOS]

## Arquitetura de Autenticação
* **Server-side:** O layout `app/(app)/layout.tsx` é um Server Component que busca o usuário via cookies (`utils/supabase/server.ts`). Os dados são injetados em toda a árvore client via `UserProvider` (`contexts/UserContext.tsx`).
* **Client-side:** Componentes acessam os dados do usuário via hook `useUser()`. **Nunca** chamar `supabase.auth.getUser()` em componentes client para evitar deadlocks da Web Locks API.
* **Middleware:** `proxy.ts` + `utils/supabase/middleware.ts` protegem todas as rotas por padrão. Apenas `/login`, `/auth/callback` e `/api/*` são públicas.

## Funcionalidades Concluídas
* [x] Scraping Fundamentus e API Yahoo Finance
* [x] Integração Gemini IA para insights
* [x] HU 1.1 - Autenticação Supabase (Login/Cadastro, OAuth Google, Proteção de Rotas, Middleware)
* [x] HU 1.2 - CRUD de Lançamentos de Notas de Corretagem (Criar, Editar, Excluir + campo Outros Custos)
* [x] ROB-7 - Motor de Cálculo de Posição Atual e Preço Médio (página /carteira - "Meus Ativos")
* [x] UX Global: Sidebar Colapsável (ícone-only ↔ ícone+texto), Header e Dropdown de Usuário
* [x] Perfil: Configuração de Perfil, Avatar e Alteração de Senha
* [x] Login UX: Toggle de senha, fluxo "Esqueci minha senha", mensagens de erro/sucesso
* [x] Redefinição de Senha via Supabase `resetPasswordForEmail`
* [x] HU 1.5 - Dashboard com Análise Quantitativa
* [x] ROB-12 - Performance Comparativa (ideal_portfolio_snapshots, API, Gráfico Recharts)
* [x] ROB-12 - Redesign Premium do Header (Search, Icons, User Badge)
* [x] ROB-12 - Componentes Globais UI (Input e Select em Glassmorphism)
* [x] ROB-13 - CRUD de Proventos (Dividendos/JCP/FII) + Página `/proventos` com KPIs, Gráfico de Evolução, Tabela com Filtros (PR #22 mergeado em 29/04/2026)
* [x] ROB-16 - Cron Job Diário (`/api/cron/update-ranking`, schedule: `0 21 * * 1-5` UTC = 18h BRT, dias úteis)
* [x] Rota `/api/macro` — Câmbio (USD/BRL, EUR/BRL) via Yahoo Finance + SELIC/CDI via Bolsai API
* [x] ELE-6 - Sistema de notificações in-app (Bell Icon, dropdown, Realtime, API /api/notifications)
* [x] ELE-7 - Sistema de alertas de preço por e-mail (API routes, Edge Function, UI modal/lista, pg_cron schedule)
* [x] ELE-12 - Correção de erros na tela de /dashboard (com revert parcial da ELE-7, re-implementado em ELE-15)

### Funcionalidades Removidas/Migradas
* ~~ROB-36 a ROB-53~~ — Integração brapi.dev removida em 2026-05-08. Dados de mercado migrados para **yahoo-finance2** (cotações, histórico, dividendos), **Bolsai API** (fundamentalistas BR) e **BCB SGS** (macro). Motivo: limitações do plano gratuito da brapi não supriam o volume de dados necessário. E Bolsai retornou 403 para macro.

## Regras de Negócio
* **Outros Custos (`other_costs`):** Campo que representa taxas, emolumentos e corretagem. **NÃO** entra no cálculo de preço médio ou valor do ativo. É usado apenas para representar o custo total da operação: `custo_total = (quantity × unit_price) + other_costs`.
* **Preço Médio Ponderado:** Calculado apenas sobre operações de COMPRA: `PM = (Σ qtd_compra × preço_compra) / Σ qtd_compra`. Operações de VENDA reduzem a quantidade em carteira mas **NÃO** alteram o preço médio. Engine em `lib/portfolio.ts`.
* **Dados de Mercado:** Toda cotação, histórico, dividendo, fundamentalista ou macro exibido na UI deve ser originado das fontes de dados oficiais (Yahoo Finance, Bolsai, Fundamentus Edge Function). Todas as chamadas devem usar `withCache()` de `lib/dataCache.ts`.
* **Stale Data:** O campo `stale: true` no response das API Routes indica dado servido do cache. A UI deve exibir indicador visual sutil quando `stale === true`.

## Trabalho em Progresso
* [ ] ROB-14 - Motor de Ranking da Fórmula Mágica (dependência do ROB-16)
* [ ] Componentes de mercado para UI (MacroWidget, AssetSearch, FundamentalsPanel)

## Decisões Técnicas Registradas

| Data | Decisão | Justificativa |
|---|---|---|
| 2026-04-xx | Cache duplo memory + KV | Minimizar latência em cold start e deploys Vercel |
| 2026-04-xx | TTLs diferenciados por endpoint | Dados macro/fundamentalistas mudam menos que cotações |
| 2026-05-01 | Campo `stale` em todos os responses | Client pode exibir indicador de dado desatualizado na UI |
| 2026-05-08 | Remoção da brapi.dev como fonte de dados | Limitações do plano gratuito não supriam o volume. Migrado para yahoo-finance2 + Bolsai API + BCB SGS |
| 2026-05-08 | Remoção do `swr` | Padronização em `@tanstack/react-query` como único client-side data fetching |
| 2026-05-08 | `types/market.ts` como tipagem genérica | Interfaces agnósticas de fonte: `MarketQuote`, `MacroOverview`, etc. |

## ⚠️ Pendências de Segurança (Supabase Advisors)
As seguintes issues de segurança foram identificadas e devem ser endereçadas em sprints futuras:
1. **`historico_analises` — RLS policy permissiva (`USING (true)`):** Política "Permitir inserção e leitura pública" permite acesso irrestrito à tabela. Avaliar se isso é intencional ou deve ser restrito por `auth.uid()`. [Docs](https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy)
2. **`handle_new_user()` e `rls_auto_enable()` — SECURITY DEFINER executável publicamente:** Funções acessíveis pelo role `anon` via REST. Revogar `EXECUTE` ou migrar para `SECURITY INVOKER`. [Docs](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
3. **Bucket `avatars` — SELECT policy permissiva:** Permite listagem de todos os arquivos. Restringir se não for intencional. [Docs](https://supabase.com/docs/guides/database/database-linter?lint=0025_public_bucket_allows_listing)
4. **Proteção contra senhas vazadas desabilitada (Auth):** Habilitar verificação HaveIBeenPwned no dashboard do Supabase. [Docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

## Dívida Técnica
* `npm_output.log` e `server.pid` commitados no repositório → adicionar ao `.gitignore` e remover do tracking
* Revisar se `proxy.ts` na raiz ainda é necessário após estrutura App Router
