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
  motion:
    duration:
      fast: 150ms
      normal: 300ms
      slow: 700ms
    easing:
      standard: cubic-bezier(0.4, 0, 0.2, 1)
      standard: ease-in-out
---

# Design System: Robô Investidor

Este documento descreve a identidade visual e as decisões de design do **Robô Investidor**. O sistema foi projetado para transmitir confiança, precisão e modernidade, características essenciais para uma ferramenta de análise financeira quantitativa.

## Visão Geral Estética

A estética do Robô Investidor é definida como **"Premium Financial Dashboard"**. Ela utiliza uma base de cores neutras profundas (Zinc) para focar a atenção do usuário nos dados e nos insights gerados por IA, que são destacados com gradientes vibrantes e cores de destaque.

### 1. Paleta de Cores e Hierarquia

O sistema opera principalmente em **Modo Escuro (Dark Mode)**, utilizando a escala OKLCH para garantir percepção de brilho uniforme e cores vibrantes.

*   **Emerald (Sucesso/Estrutura):** Utilizado para o logotipo, indicadores de rentabilidade positiva e estados ativos de navegação. Representa crescimento e estabilidade.
*   **Indigo (Ação/Foco):** A cor de destaque para chamadas para ação (CTAs) e identificação de ativos (tickers). É uma cor "séria" mas moderna.
*   **Cyan (Tecnologia/IA):** Utilizada em conjunto com o Indigo em gradientes para sinalizar recursos inteligentes e processamento de dados.

### 2. Tipografia

Utilizamos a família de fontes **Geist**, desenvolvida pela Vercel. 
*   **Geist Sans:** Proporciona uma legibilidade excepcional para dados numéricos e tabelas complexas, mantendo um ar tecnológico.
*   **Geist Mono:** Utilizada pontualmente para valores técnicos que requerem alinhamento tabular perfeito.

As manchetes utilizam um peso `extrabold` com `tracking-tight` para um visual impactante e profissional.

### 3. Superfícies e Profundidade

O design utiliza uma abordagem de camadas sutis:
*   **Background (Zinc-950):** A base infinita.
*   **Cards (Zinc-900):** Superfícies que agrupam informações relacionadas, com bordas finas (Zinc-800) e sombras suaves.
*   **Glassmorphism Lite:** Em placeholders e cards de IA, utilizamos fundos levemente translúcidos com `backdrop-blur` para criar uma sensação de profundidade e sofisticação.

### 4. Movimento e Interatividade

O movimento é usado para guiar o olhar e confirmar ações:
*   **Transições Suaves:** Colapsar/Expandir a barra lateral utiliza uma duração de 300ms com `ease-in-out` para uma sensação mecânica porém fluida.
*   **Micro-interações:** Botões e itens de navegação possuem estados de hover com mudanças sutis de escala (`active:scale-95`) e cor, proporcionando feedback tátil imediato.
*   **Animações de Entrada:** Cards e tabelas utilizam `animate-in fade-in slide-in-from-bottom` para suavizar o carregamento de dados e dar uma sensação de "montagem" da interface.

### 5. Iconografia

Utilizamos a biblioteca **Lucide React**. Os ícones são desenhados com espessura fina (stroke width 2) e são usados principalmente para reforçar a semântica visual das seções (ex: Foguete para Análise, Carteira para Ativos, Bot para IA).

## Refinamento Premium (Vibe: Cyber-Financial)

### 1. Efeitos de Brilho (Glow)
- Gráficos e indicadores de sucesso devem usar `drop-shadow`. Ex: `drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]` para elementos Emerald.
- Cards devem ter um gradiente de borda sutil ou um reflexo superior para simular vidro.

### 2. Tipografia & Hierarquia
- Títulos: Geist Sans Extrabold com tracking-tighter.
- Subtítulos e Labels: Geist Mono Medium para um ar técnico/preciso.
- Status do Usuário: Usar fonte Gold/Cyan para "Premium Elite" para criar senso de exclusividade.

### 3. Componentes de Input & Header
- Barra de Pesquisa: Fundo `zinc-900/50`, `backdrop-blur-md`, bordas `zinc-800`.
- Ícones de Ação: (Sino, Engrenagem) devem ter um hover suave com fundo circular translúcido.