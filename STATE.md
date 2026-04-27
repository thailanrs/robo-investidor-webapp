# Estado Atual do Projeto (State of Project)

## Tabelas no Supabase (Database Schema)
* `historico_analises`: id, data_analise, dados_acoes (jsonb), resumo_ia, user_id
* `users` (Supabase Auth nativo)
* `transactions`: id, user_id, ticker, type, quantity, unit_price, date, created_at
* `profiles`: id (references auth.users), nome_completo, avatar_url, data_atualizacao
* [NOVAS TABELAS DEVEM SER REGISTRADAS AQUI COM SEUS CAMPOS EXATOS]

## Funcionalidades Concluídas
* [x] Scraping Fundamentus e API Yahoo Finance
* [x] Integração Gemini IA para insights
* [x] Autenticação Supabase (Login/Cadastro) e proteção de rotas
* [x] HU 1.2 - CRUD de Lançamentos de Notas de Corretagem (Antigravity)
* [x] UX Global: Sidebar Colapsável, Header e Dropdown (Fase 0)
* [x] Perfil: Configuração de Perfil e Avatar (Fase 0)

## Trabalho em Progresso
* [ ] HU 1.1 - Implementar Autenticação de Usuários com Supabase (Jules)