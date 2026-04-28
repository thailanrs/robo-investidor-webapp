---
design-tokens:
  colors:
    brand:
      primary:
        name: Emerald
        value: oklch(0.643 0.153 164.607) # emerald-500
        description: Cor principal para identidade estrutural e indicadores de sucesso.
      accent:
        name: Indigo
        value: oklch(0.585 0.176 273.284) # indigo-500
        description: Cor de destaque para ações principais e badges de ativos.
      tech:
        name: Cyan
        value: oklch(0.723 0.16 232.661) # cyan-500
        description: Cor secundária para gradientes de IA e elementos de tecnologia.
    neutral:
      background:
        light: oklch(1 0 0)
        dark: oklch(0.145 0 0)
      foreground:
        light: oklch(0.145 0 0)
        dark: oklch(0.985 0 0)
      surface:
        light: oklch(1 0 0)
        dark: oklch(0.205 0 0)
      border:
        light: oklch(0.922 0 0)
        dark: oklch(1 0 0 / 10%)
    semantic:
      success: oklch(0.643 0.153 164.607)
      error: oklch(0.577 0.245 27.325)
      warning: oklch(0.769 0.188 70.08)
  typography:
    fonts:
      sans: "Geist, ui-sans-serif, system-ui, sans-serif"
      mono: "Geist Mono, ui-monospace, SFMono-Regular, monospace"
    weights:
      normal: 400
      medium: 500
      semibold: 600
      bold: 700
      extrabold: 800
    sizes:
      xs: 0.75rem
      sm: 0.875rem
      base: 1rem
      lg: 1.125rem
      xl: 1.25rem
      2xl: 1.5rem
      3xl: 1.875rem
      4xl: 2.25rem
      5xl: 3rem
  spacing:
    scale:
      0: 0
      1: 0.25rem
      2: 0.5rem
      3: 0.75rem
      4: 1rem
      6: 1.5rem
      8: 2rem
      12: 3rem
      16: 4rem
  radii:
    base: 0.625rem
    sm: 0.375rem
    md: 0.5rem
    lg: 0.625rem
    xl: 0.875rem
    "2xl": 1.125rem
    full: 9999px
  elevation:
    shadows:
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
      brand: "0 10px 15px -3px rgba(99, 102, 241, 0.2)"
      neon-emerald: "0 0 12px rgba(16, 185, 129, 0.35)"
      neon-cyan: "0 0 12px rgba(6, 182, 212, 0.35)"
      neon-indigo: "0 0 12px rgba(99, 102, 241, 0.35)"
  motion:
    duration:
      fast: 150ms
      normal: 300ms
      slow: 700ms
    easing:
      standard: cubic-bezier(0.4, 0, 0.2, 1)
      ease-in-out: ease-in-out
---

# Design System: Robô Investidor

Este documento descreve a identidade visual e as decisões de design do **Robô Investidor**. O sistema foi projetado para transmitir confiança, precisão e modernidade, características essenciais para uma ferramenta de análise financeira quantitativa.

## Visão Geral Estética

A estética do Robô Investidor é definida como **"Cyber-Financial Premium"**. Ela combina uma base profunda em Dark Mode (Zinc-950/900) com elementos de **glassmorphism**, gradientes neon e tipografia de alto impacto. O objetivo é que o sistema pareça um produto de nível institucional — algo que um trader profissional usaria — mas com a fluidez e leveza de uma fintech moderna.

A referência visual de nível premium é: painéis de trading de alto desempenho como Bloomberg Terminal, mas com a modernidade de interfaces como Linear, Vercel e plataformas SaaS de nova geração.

---

## 1. Paleta de Cores e Hierarquia

O sistema opera exclusivamente em **Modo Escuro (Dark Mode)**, usando a escala OKLCH para garantir percepção de brilho uniforme.

- **Emerald (Sucesso/Crescimento):** Rentabilidade positiva, indicadores ativos, logotipo, linhas de gráficos "Minha Carteira".
- **Indigo (Ação/Foco):** CTAs primários, tickers de ativos, linha de gráfico "Carteira Ideal".
- **Cyan (Tecnologia/IA):** Gradientes de IA, badge de nível do usuário, glow de elementos tech. Linha de gráfico CDI.
- **Vermelho/Rose:** Rentabilidade negativa, alertas críticos.
- **Zinc (Neutros):** Toda a infraestrutura visual — backgrounds, superfícies, bordas.

### Gradientes Chave
```
-- Badge Premium: linear-gradient(135deg, #06b6d4, #10b981)  (Cyan → Emerald)
-- IA/Tech elements: linear-gradient(135deg, #6366f1, #06b6d4) (Indigo → Cyan)
-- Linha Carteira Ideal (gráfico): stroke com indigo-500 + glow indigo
-- Linha CDI (gráfico): stroke com cyan-400 + glow cyan
-- Linha Minha Carteira (gráfico): stroke com emerald-500 + glow emerald
```

---

## 2. Tipografia

Família exclusiva: **Geist** (Vercel). Nunca misturar com outras fontes.

| Elemento | Fonte | Peso | Modificadores |
|---|---|---|---|
| Títulos de página | Geist Sans | `extrabold` (800) | `tracking-tight` |
| Subtítulos de seção | Geist Sans | `semibold` (600) | — |
| Labels e metadados técnicos | Geist Mono | `medium` (500) | `tracking-wider`, `uppercase` |
| Valores numéricos críticos (patrimônio, %) | Geist Sans | `bold` (700) | `tabular-nums`, `font-variant-numeric: tabular-nums` |
| Corpo e descrições | Geist Sans | `normal` (400) | `text-zinc-400` |
| Badge de nível ("PREMIUM ELITE") | Geist Sans | `semibold` (600) | `uppercase`, `tracking-widest`, tamanho `xs` |

> ⚠️ **Regra de ouro:** Valores financeiros (preços, percentuais, quantidades) DEVEM usar `tabular-nums` para evitar "dança" de números em atualizações em tempo real.

---

## 3. Superfícies, Profundidade e Glassmorphism

### Hierarquia de Camadas
```
Zinc-950  → Background global (página)
Zinc-900  → Cards padrão
Zinc-800  → Cards aninhados, dropdowns, tooltips
Zinc-700  → Borders ativas, separadores
```

### Glassmorphism (Obrigatório em novos componentes de Input, Header e Modais)
O glassmorphism é o padrão visual para **todos os elementos interativos e de entrada** do sistema. Ele cria profundidade e sofisticação sem pesar a interface.

**Receita padrão:**
```css
background: rgba(24, 24, 27, 0.6);   /* zinc-900 com 60% opacidade */
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 0.75rem;
```

**Aplicação em Tailwind:**
```
bg-zinc-900/60 backdrop-blur-md border border-white/8 rounded-xl
```

### Componentes que DEVEM usar Glassmorphism
- `<SearchBar />` (barra de pesquisa do header)
- `<Select />` e `<Input />` em todo o sistema
- Modais e Dialogs
- Dropdowns de usuário
- Tooltips de gráficos
- Cards de destaque no Dashboard

---

## 4. Header Redesign — Especificação Completa

O Header é a identidade visual mais imediata do produto. Deve transmitir **poder e controle** ao usuário.

### Layout do Header
```
[Logo/Sidebar Toggle] ---- [SearchBar Centralizada] ---- [Sino | Engrenagem | UserBadge]
```

### Barra de Pesquisa
- **Posição:** Centralizada no header, largura máxima de `max-w-md`.
- **Estilo:** Glassmorphism (bg-zinc-900/60 backdrop-blur-md), ícone de lupa à esquerda, atalho `⌘K` exibido à direita como badge `kbd`.
- **Placeholder:** `"Buscar ativos, relatórios ou robôs..."`
- **Comportamento:** Ao focar (`focus`), a borda acende com `ring-1 ring-emerald-500/50` e um leve glow.
- **Atalho:** Ao pressionar `Cmd+K` ou `Ctrl+K`, o input recebe foco automaticamente.

### Ícones de Ação (Notificação e Configurações)
- **Componentes:** `<Bell />` e `<Settings />` do Lucide React.
- **Tamanho:** `h-5 w-5`, cor `text-zinc-400`.
- **Hover:** fundo circular `hover:bg-white/5 rounded-full p-2`, ícone muda para `text-zinc-100`.
- **Badge de notificação:** Um ponto emerald `bg-emerald-500` de 6px posicionado em `top-0 right-0` do sino quando há notificações pendentes.
- **Transição:** `transition-all duration-150`.

### Badge de Nível do Usuário (UserBadge)
Este é o elemento de maior impacto premium do header. Inspira-se em sistemas de gamificação de plataformas financeiras profissionais.

**Estrutura do componente `<UserBadge />`:**
```
[Avatar circular] [nome_completo (bold)] [badge PREMIUM ELITE]
```

- **Avatar:** `h-8 w-8`, circular, com borda `ring-1 ring-emerald-500/40`.
- **Nome:** `text-sm font-semibold text-zinc-100`.
- **Badge:** Texto `PREMIUM ELITE`, fundo com gradiente `from-cyan-500 to-emerald-500`, texto branco, `text-xs font-semibold tracking-widest uppercase`, border-radius `rounded-full`, padding `px-2 py-0.5`.
- **Localização no banco:** O campo `nivel` deve ser adicionado na tabela `profiles` (VARCHAR, default: `'PREMIUM ELITE'`). Futuramente pode evoluir para um sistema de níveis (STARTER → PRO → PREMIUM ELITE → INSTITUTIONAL).
- **Dados:** Virão do `useUser()` (Context), nunca chamando Supabase diretamente no client.

---

## 5. Componentes de Input & Select — Padrão Glassmorphism

Todos os `<Input />`, `<Select />`, `<Textarea />` e `<Combobox />` do sistema devem adotar o seguinte padrão visual.

### Padrão de Select
```
bg-zinc-900/60 backdrop-blur-md
border border-white/8
rounded-xl
text-zinc-100 placeholder:text-zinc-500
focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30
transition-all duration-150
```

### Estados
- **Default:** borda `border-white/8`
- **Hover:** borda `border-white/15`
- **Focus:** ring emerald sutil + borda levemente mais brilhante
- **Error:** borda `border-red-500/50` + texto auxiliar `text-red-400`
- **Disabled:** `opacity-50 cursor-not-allowed`

---

## 6. Gráficos — Especificação Visual

Todos os gráficos usam **Recharts** com o tema Dark Mode Neon. Nenhum gráfico deve ter fundo branco ou cores pastéis.

### Paleta de Séries Temporais (Comparativo de Performance)
| Série | Cor | Efeito |
|---|---|---|
| Minha Carteira | `emerald-500` (#10b981) | `drop-shadow: 0 0 8px rgba(16,185,129,0.4)` |
| Carteira Ideal | `indigo-400` (#818cf8) | `drop-shadow: 0 0 8px rgba(129,140,248,0.4)` |
| CDI | `cyan-400` (#22d3ee) | `drop-shadow: 0 0 8px rgba(34,211,238,0.4)` |

### Padrão de Área (AreaChart)
- Usar `<AreaChart>` com `<defs>` para gradientes verticais.
- Cada série: `fillOpacity` de `0.15` na base, `0.4` no topo.
- Grid: `stroke="rgba(255,255,255,0.05)"`, sem bordas externas.
- Tooltip: glassmorphism (`bg-zinc-900/90 backdrop-blur-sm border border-white/10`), valores formatados em BRL.
- Eixo X: datas formatadas (`Geist Mono`, `text-zinc-500`, `text-xs`).
- Eixo Y: valores em K/M para compactar (ex: `R$ 25K`, `R$ 1,2M`).

### Filtros de Período
Os botões de filtro de tempo (1A, 2A, 5A, Máx) devem ter o estilo de **Tab Pills**:
- Inativo: `bg-transparent text-zinc-500 hover:text-zinc-300`
- Ativo: `bg-zinc-800 text-zinc-100 rounded-lg`
- Container: `bg-zinc-900/60 backdrop-blur-sm rounded-xl p-1`

---

## 7. Movimento e Interatividade

- **Transições Suaves:** Colapsar/Expandir sidebar usa 300ms `ease-in-out`.
- **Micro-interações:** Botões e nav items com `active:scale-95` e cor de hover.
- **Animações de Entrada:** Cards e tabelas com `animate-in fade-in slide-in-from-bottom-4 duration-300`.
- **Glow on Hover:** Elementos com cores neon (badges, CTAs) ganham um `box-shadow` de glow ao hover.

---

## 8. Iconografia

Biblioteca exclusiva: **Lucide React**. Stroke width padrão: `2`. Nunca usar ícones filled.

- Dashboard → `LayoutDashboard`
- Carteira → `Briefcase`
- Lançamentos → `Receipt`
- Proventos → `Coins`
- Histórico → `History`
- Configurações → `Settings`
- Notificações → `Bell`
- IA/Análise → `BrainCircuit`
- Busca → `Search`
