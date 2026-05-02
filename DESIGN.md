# Design & UI Patterns
_Última atualização: 2026-05-01_

## Visão Geral do Design System

O Robô Investidor utiliza um design system baseado em **Dark Mode nativo** com acentos neon, construído sobre Tailwind CSS e Shadcn UI. O padrão visual prioriza densidade de informação, legibilidade em telas de dados financeiros e feedback visual imediato.

## Paleta de Cores

| Token | Uso | Exemplo |
|---|---|---|
| Verde neon (`#00FF87`, `#10B981`) | Alta, lucro, positivo | Variação % positiva, saldo positivo |
| Vermelho (`#EF4444`, `#FF4757`) | Baixa, perda, negativo | Variação % negativa, stop loss |
| Azul (`#3B82F6`) | Neutro, informação | Links, badges informativos |
| Cinza escuro (`#1a1a2e`, `#16213e`) | Superfícies, backgrounds | Cards, Sidebar, Header |
| Branco/Cinza claro | Texto primário/secundário | Conteúdo, labels |

## Tipografia

* **Font Principal:** Inter (sistema) — legibilidade em tabelas e dados
* **Números financeiros:** `font-mono` (tabular-nums) — alinhamento em colunas
* **Hierarquia:** `text-2xl font-bold` (KPIs), `text-lg font-semibold` (seções), `text-sm` (labels), `text-xs text-muted-foreground` (metadados)

## Padrões de Componentes

### Cards de KPI
```tsx
<Card className="bg-card border-border">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">Label</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-green-400">R$ 12.450,00</div>
    <p className="text-xs text-muted-foreground">+2.3% hoje</p>
  </CardContent>
</Card>
```

### Variação Percentual (obrigatório em dados de mercado)
```tsx
const VariacaoPercent = ({ value }: { value: number }) => (
  <span className={cn(
    "font-mono text-sm font-medium",
    value >= 0 ? "text-green-400" : "text-red-400"
  )}>
    {value >= 0 ? "+" : ""}{value.toFixed(2)}%
  </span>
)
```

### Tabelas de Dados Financeiros
* Usar `font-mono` para colunas numéricas (preço, quantidade, variação)
* Linhas alternadas: `hover:bg-muted/50`
* Sticky header em tabelas longas
* Ordenação por coluna (ícone de sort no header)

### Skeleton Loading (obrigatório)
```tsx
// Sempre implementar skeleton que espelha o layout real do componente
<Skeleton className="h-8 w-24" />  // número/KPI
<Skeleton className="h-4 w-full" /> // linha de texto
<Skeleton className="h-[200px] w-full" /> // gráfico
```

### Indicador de Dado Stale (brapi)
```tsx
// Exibir quando isStale === true nos hooks brapi
<span className="text-xs text-yellow-500/70 flex items-center gap-1">
  <span>⚡</span>
  <span>dados de {minutesAgo}min atrás</span>
</span>
```

## Gráficos (Recharts)

* **Biblioteca:** Recharts (padrão) ou Chart.js para casos específicos
* **Background:** `transparent` (herdado do card)
* **Grid:** `stroke="#374151"` (cinza escuro sutil)
* **Tooltip:** dark custom com `bg-gray-900 border-gray-700`
* **Cores de linha:** verde neon para performance positiva, vermelho para negativa, azul para referência (Ibovespa)
* **Responsividade:** `<ResponsiveContainer width="100%" height={200}>`

### Padrão de Gráfico de Evolução
```tsx
<ResponsiveContainer width="100%" height={200}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
    <XAxis dataKey="date" stroke="#6B7280" tick={{ fontSize: 11 }} />
    <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} tickFormatter={formatCurrency} />
    <Tooltip content={<CustomTooltip />} />
    <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
  </LineChart>
</ResponsiveContainer>
```

## Layout e Navegação

### Sidebar
* Colapsável: ícone-only (64px) ↔ ícone+texto (240px)
* Transição: `transition-all duration-300`
* Estado persistido via Context (`AppLayoutClient`)
* Mobile: overlay com backdrop

### Header
* Top bar fixa (`sticky top-0 z-50`)
* Contém: botão de menu mobile, título da página, `UserDropdown`
* `MacroWidget` (USD/BRL, EUR/BRL, SELIC) planejado para o lado direito (ROB-58)

### Páginas Protegidas
Todas as páginas em `app/(app)/` seguem o padrão:
1. **Loading state:** Skeleton que espelha o layout real (nunca spinner genérico)
2. **Error state:** Mensagem contextual + botão de retry
3. **Empty state:** Mensagem amigável + CTA para primeira ação

## Componentes de Mercado (próxima fase — Service Layer)

Componentes que serão criados durante a integração das API Routes brapi à UI:

| Componente | Consome | Localização | Descrição |
|---|---|---|---|
| `<AssetSearchInput>` | `/api/assets/search` | `components/ui/AssetSearchInput.tsx` | Autocomplete com debounce 300ms para seleção de ativo. Exibir ticker + nome. |
| `<PriceChart>` | `/api/history/[ticker]` | `components/charts/PriceChart.tsx` | Gráfico OHLCV com range selector (1M / 3M / 6M / 1A / MAX). Recharts `CandlestickChart` ou `LineChart`. |
| `<DividendTimeline>` | `/api/dividends/[ticker]` | `components/dividends/DividendTimeline.tsx` | Timeline de proventos com badge "sugerido" para dividendos não lançados (via `dividendMatcher`). |
| `<FundamentalsPanel>` | `/api/fundamentals/[ticker]` | `components/fundamentals/FundamentalsPanel.tsx` | Grid com P/L, P/VP, DY, consenso de analistas (targetMeanPrice, recommendationKey). |
| `<MacroWidget>` | `/api/macro` | `components/layout/MacroWidget.tsx` | Barra no Header: USD/BRL, EUR/BRL, SELIC. Atualização a cada 1h. |
| `<QuoteBadge>` | `/api/quotes` | `components/ui/QuoteBadge.tsx` | Preço atual + variação % colorida. Polling a cada 5min. |

### Estados obrigatórios para todos os componentes de mercado

Todo componente que consome dados brapi **deve** implementar os 4 estados:

```tsx
// 1. Loading — skeleton que espelha o layout real
if (isLoading) return <ComponentSkeleton />

// 2. Error — inline com retry
if (error) return (
  <ErrorState message="Erro ao carregar dados" onRetry={refetch} />
)

// 3. Empty — com ação clara
if (!data || data.length === 0) return (
  <EmptyState message="Nenhum dado disponível" />
)

// 4. Stale — badge sutil no canto
{isStale && <StaleBadge />}
```

## Acessibilidade e UX

* **Foco visível:** `focus-visible:ring-2 focus-visible:ring-ring` em todos os interativos
* **ARIA labels:** obrigatório em botões ícone-only e charts
* **Contraste:** mínimo WCAG AA — texto principal vs. fundo dark
* **Touch targets:** mínimo 44×44px em mobile
* **Animações:** respeitar `prefers-reduced-motion`
