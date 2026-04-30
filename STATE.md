# Estado Atual do Projeto (State of Project)

## Tabelas no Supabase (Database Schema)
* `ideal_portfolio_snapshots`: id (uuid, PK), snapshot_date (date, not null), tickers (jsonb, not null), created_at (timestamptz, default now())
* `historico_analises`: id, data_analise, dados_acoes (jsonb), resumo_ia, user_id
* `users` (Supabase Auth nativo)
* `transactions`: id, user_id, ticker, type, quantity, unit_price, other_costs, date, created_at
* `profiles`: id (references auth.users), nome_completo, avatar_url, data_atualizacao, nivel
* `dividends`: id, user_id (references auth.users), ticker, type (enum: DIVIDENDO | JCP | RENDIMENTO_FII | AMORTIZACAO), amount, quantity, payment_date, notes, created_at, updated_at — **migration aplicada manualmente em produção em 29/04/2026 (ROB-13)**
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

## Regras de Negócio
* **Outros Custos (`other_costs`):** Campo que representa taxas, emolumentos e corretagem. **NÃO** entra no cálculo de preço médio ou valor do ativo. É usado apenas para representar o custo total da operação: `custo_total = (quantity × unit_price) + other_costs`.
* **Preço Médio Ponderado:** Calculado apenas sobre operações de COMPRA: `PM = (Σ qtd_compra × preço_compra) / Σ qtd_compra`. Operações de VENDA reduzem a quantidade em carteira mas **NÃO** alteram o preço médio. Engine em `lib/portfolio.ts`.

## Trabalho em Progresso
* [ ] ROB-14 - Motor de Ranking da Fórmula Mágica (dependência do ROB-16)

## ⚠️ Pendências de Segurança (Supabase Advisors)
As seguintes issues de segurança foram identificadas e devem ser endereçadas em sprints futuras:
1. **`historico_analises` — RLS policy permissiva (`USING (true)`):** Política "Permitir inserção e leitura pública" permite acesso irrestrito à tabela. Avaliar se isso é intencional ou deve ser restrito por `auth.uid()`. [Docs](https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy)
2. **`handle_new_user()` e `rls_auto_enable()` — SECURITY DEFINER executável publicamente:** Funções acessíveis pelo role `anon` via REST. Revogar `EXECUTE` ou migrar para `SECURITY INVOKER`. [Docs](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
3. **Bucket `avatars` — SELECT policy permissiva:** Permite listagem de todos os arquivos. Restringir se não for intencional. [Docs](https://supabase.com/docs/guides/database/database-linter?lint=0025_public_bucket_allows_listing)
4. **Proteção contra senhas vazadas desabilitada (Auth):** Habilitar verificação HaveIBeenPwned no dashboard do Supabase. [Docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
