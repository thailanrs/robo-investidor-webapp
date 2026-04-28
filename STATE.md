# Estado Atual do Projeto (State of Project)

## Tabelas no Supabase (Database Schema)
* `historico_analises`: id, data_analise, dados_acoes (jsonb), resumo_ia, user_id
* `users` (Supabase Auth nativo)
* `transactions`: id, user_id, ticker, type, quantity, unit_price, other_costs, date, created_at
* `profiles`: id (references auth.users), nome_completo, avatar_url, data_atualizacao
* [NOVAS TABELAS DEVEM SER REGISTRADAS AQUI COM SEUS CAMPOS EXATOS]

## Arquitetura de Autenticação
* **Server-side:** O layout `app/(app)/layout.tsx` é um Server Component que busca o usuário via cookies (`utils/supabase/server.ts`). Os dados são injetados em toda a árvore client via `UserProvider` (`contexts/UserContext.tsx`).
* **Client-side:** Componentes acessam os dados do usuário via hook `useUser()`. **Nunca** chamar `supabase.auth.getUser()` em componentes client para evitar deadlocks da Web Locks API.
* **Middleware:** `proxy.ts` + `utils/supabase/middleware.ts` protegem todas as rotas por padrão. Apenas `/login`, `/auth/callback` e `/api/*` são públicas.

## Funcionalidades Concluídas
* [x] Scraping Fundamentus via Supabase Edge Function (contorna bloqueio Cloudflare em produção)
* [x] Integração Yahoo Finance (yahoo-finance2) com sufixo .SA para ativos B3
* [x] HU 1.1 - Autenticação Supabase (Login/Cadastro, OAuth Google, Proteção de Rotas, Middleware)
* [x] HU 1.2 - CRUD de Lançamentos de Notas de Corretagem (Criar, Editar, Excluir + campo Outros Custos)
* [x] ROB-7 - Motor de Cálculo de Posição Atual e Preço Médio (página /carteira - "Meus Ativos")
* [x] ROB-11 - Integrar Cotações em Tempo Real e Cálculo de Rentabilidade Atual
* [x] UX Global: Sidebar Colapsável (ícone-only ↔ ícone+texto), Header e Dropdown de Usuário
* [x] Perfil: Configuração de Perfil, Avatar e Alteração de Senha
* [x] Login UX: Toggle de senha, fluxo "Esqueci minha senha", mensagens de erro/sucesso
* [x] Redefinição de Senha via Supabase `resetPasswordForEmail`

## Regras de Negócio
* **Outros Custos (`other_costs`):** Campo que representa taxas, emolumentos e corretagem. **NÃO** entra no cálculo de preço médio ou valor do ativo. É usado apenas para representar o custo total da operação: `custo_total = (quantity × unit_price) + other_costs`.
* **Preço Médio Ponderado:** Calculado apenas sobre operações de COMPRA: `PM = (Σ qtd_compra × preço_compra) / Σ qtd_compra`. Operações de VENDA reduzem a quantidade em carteira mas **NÃO** alteram o preço médio. Engine em `lib/portfolio.ts`.

## Trabalho em Progresso
* [x] HU 1.5 - Implementar Dashboard com Análise Quantitativa
* [x] [Dashboard] Gráficos de Composição de Carteira e Evolução