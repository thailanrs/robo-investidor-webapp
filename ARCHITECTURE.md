# Robô Investidor - Architecture & Tech Stack

## Visão Geral
SaaS de gestão de patrimônio e análise quantitativa de ativos da B3 (Ações, FIIs e FIAGROs). O sistema combina a Fórmula Mágica de Joel Greenblatt com IA generativa para auxiliar na tomada de decisão.

## Tech Stack
* **Framework:** Next.js 14+ (App Router)
* **Linguagem:** TypeScript
* **Estilização:** Tailwind CSS (Shadcn UI / v0 para componentes base)
* **Backend & Auth:** Supabase (PostgreSQL, Row Level Security habilitado)
* **IA Generativa:** Google Gemini (gemini-2.5-flash) via `@google/generative-ai`
* **Scraping e Dados Financeiros:** `cheerio` (Fundamentus) e `yahoo-finance2` (Histórico/Cotações)
* **Deploy:** Vercel

## Princípios de Desenvolvimento (Para Agentes de IA)
1.  **Segurança:** Todas as rotas de API sensíveis devem validar a sessão do usuário via Supabase Auth. Tabelas do banco de dados utilizam RLS atrelado ao `auth.uid()`.
2.  **Performance:** Utilize Server Components sempre que possível. Processamentos pesados de dados (como o cálculo do ranking quantitativo) não devem bloquear a thread principal (UI).
3.  **Design System:** O padrão visual é o Dark Mode com acentos em cores neon (ex: verde para alta, vermelho para baixa). Gráficos devem usar bibliotecas leves (Recharts ou Chart.js).
4.  **Lançamentos:** A arquitetura do banco de dados para a carteira do usuário deve seguir o padrão "Event Sourcing" (Ledger). Não atualize saldos diretamente; grave transações de COMPRA/VENDA e calcule o saldo e preço médio a partir do histórico.