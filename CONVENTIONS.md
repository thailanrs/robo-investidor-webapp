# Padrões de Código (Code Conventions)

1. **Requisições:** Use sempre o `fetch` nativo do Next.js.
2. **Validação:** Use `Zod` para validar formulários e payloads de API.
3. **Estilos:** Use Tailwind CSS. Para componentes complexos, crie na pasta `/components/ui`.
4. **Banco de Dados:** Sempre use o cliente instanciado em `utils/supabase/server.ts` (Server Components/Actions) ou `utils/supabase/client.ts` (Client Components para operações de dados). Não instancie novos clientes soltos.
5. **Autenticação:** Use `useUser()` do Context (`contexts/UserContext.tsx`) para acessar dados do usuário autenticado em componentes client. **Nunca** chame `supabase.auth.getUser()` no lado do cliente — isso causa deadlocks da Web Locks API. O usuário é obtido server-side no layout e injetado via `UserProvider`.
6. **Idioma:** Variáveis, funções e comentários em Português-BR ou Inglês, mas mantenha a consistência no mesmo arquivo.
7. **Desenvolvimento Modular (Regra de Ouro):** Pense sempre em reaproveitamento. Componentes visuais devem ser isolados em `/components`. Componentes de UI globais (como Sidebar, Header e Layouts) devem ficar estritamente isolados em `/components/layout`. Regras de negócio e chamadas de banco de dados devem ser abstraídas em funções puras dentro de `/lib` ou Custom Hooks em `/hooks`. Evite escrever lógicas complexas e queries diretamente dentro dos arquivos de página (`page.tsx`).
8. **Versionamento (Git):** Após a conclusão de cada Ticket ou História de Usuário (HU), realize um commit automático (`git add .` e `git commit -m "feat/fix: descricao"`) contendo as mudanças antes de prosseguir.
9. **Gestão de Tarefas:** Ao iniciar o atendimento de uma task (ex: tickets do Linear), o agente deve sempre mover o seu status para "In progress" antes de começar o desenvolvimento, criar uma branch com o ID da issue (`rob-XX-nome`), e ao finalizar abrir um PR para a main.

---

## 🗂️ Convenção de Migrations (CRÍTICO)

> ⚠️ **Padronização (29/04/2026):** Para permitir a integração com o GitHub Actions e a CLI do Supabase, o caminho das migrations foi padronizado para a raiz do projeto. O problema anterior de "pasta não reconhecida" foi resolvido com a inclusão do `config.toml` na raiz e a configuração do workflow de CI/CD.

### Regra Absoluta
**Todo arquivo de migration SQL deve ser criado em:**
```
./supabase/migrations/
```
**Nunca** em `./utils/supabase/migrations/`, `./db/`, `./sql/` ou qualquer outro caminho.

### Nomenclatura
```
YYYYMMDDHHMMSS_descricao_em_snake_case.sql
```
Exemplo: `20260429120000_create_dividends.sql`

### Checklist obrigatório antes de abrir PR com DDL
- [ ] Arquivo `.sql` está em `./supabase/migrations/`
- [ ] SQL é idempotente (`IF NOT EXISTS` onde aplicável)
- [ ] RLS habilitado na tabela (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Política RLS criada com `auth.uid() = user_id`
- [ ] Índices de performance criados para as colunas de filtro mais usadas
- [ ] Tabela registrada no `STATE.md`

### Checklist pós-merge (responsabilidade do PM/Dev)
- [ ] Migration executada manualmente no Supabase de produção
- [ ] Smoke test da funcionalidade em produção (`robo-investidor-webapp.vercel.app`)
- [ ] Confirmar no PR que a migration foi aplicada em produção

10. **TypeScript Strict:** Sempre tratar casos de `null` em callbacks de componentes Radix UI (ex: `onValueChange` do `<Select>`). O tipo do handler deve aceitar `null` ou filtrar com guard `if (v !== null)`.
11. **APIs Externas e Scraping (CRÍTICO):** Toda chamada a fontes externas com risco de bloqueio por IP de datacenter (Fundamentus, B3, etc.) deve passar OBRIGATORIAMENTE pela camada de Edge Functions do Supabase. Nunca realize scraping ou fetch direto para essas fontes a partir da API Routes da Vercel (`app/api/*`).

---

## 🌐 Convenções da Camada Brapi (CRÍTICO)
_Adicionado em 2026-05-01_

### Padrão de API Route

Toda route que consome a brapi segue este contrato obrigatório:

```typescript
import { getCached } from '@/lib/brapiCache'
import { handleBrapiError } from '@/lib/brapiErrors'
import { logBrapiRequest } from '@/lib/brapiLogger'
import { brapiClient } from '@/lib/brapiClient'

export async function GET(req: Request) {
  try {
    // 1. Extrair params
    const { searchParams } = new URL(req.url)
    const ticker = searchParams.get('ticker') ?? ''

    // 2. Montar cacheKey (incluir TODOS os params variáveis)
    const cacheKey = `resource:${ticker}:${param1}:${param2}`

    // 3. Registrar início
    const start = Date.now()

    // 4. Buscar com cache
    const { data, stale } = await getCached(cacheKey, () => brapiClient.method(), TTL_MS)

    // 5. Logar
    await logBrapiRequest({
      endpoint: '/api/resource',
      ticker,
      latencyMs: Date.now() - start,
      cacheHit: !stale,
      stale
    })

    // 6. Responder
    return NextResponse.json({ ...data, stale })

  } catch (error) {
    // 7. Catch sempre via handleBrapiError
    return handleBrapiError(error, ticker)
  }
}
```

### Regras de Tipagem (`types/brapi.ts`)

* **Sempre fazer APPEND** ao final do arquivo — nunca sobrescrever interfaces existentes
* Campos ausentes na resposta brapi retornam `null`, nunca `undefined` ou `NaN`
* Timestamps Unix (segundos) → converter para `string 'YYYY-MM-DD'` antes de retornar
* Interfaces exportadas: `QuoteResult`, `AssetListItem`, `OHLCVDataPoint`, `HistoryResponse`, `DividendRecord`, `FundamentalsData`, `CurrencyRate`, `MacroPrimeRate`, `MacroOverview`

### TTLs Padrão por Tipo de Dado

| Tipo de Dado | TTL | Constante |
|---|---|---|
| Cotações em tempo real | 5 min | `BRAPI_TTL_QUOTES` |
| Câmbio + Macro | 1h | `BRAPI_TTL_MACRO` |
| Histórico OHLCV | 1h | `BRAPI_TTL_HISTORY` |
| Dividendos e JCP | 12h | `BRAPI_TTL_DIVIDENDS` |
| Dados fundamentalistas | 24h | `BRAPI_TTL_FUNDAMENTALS` |
| Lista de ativos | 24h | `BRAPI_TTL_ASSETS` |

### Convenção de Hooks React Query (próxima fase)

Hooks que consomem as API Routes brapi seguem o padrão:
* **Localização:** `hooks/brapi/use{Resource}.ts`
* **Nomes:** `useQuotes`, `useHistory`, `useDividends`, `useFundamentals`, `useMacro`, `useAssetSearch`
* **Interface de retorno obrigatória:**
  ```typescript
  {
    data: T | undefined
    isLoading: boolean
    isStale: boolean       // reflete o campo stale da API
    error: Error | null
    refetch: () => void
  }
  ```
* **staleTime React Query:** deve ser ligeiramente menor que o TTL do cache da API (ex: cotações → `staleTime: 4 * 60 * 1000`)
* **Nunca** chamar `brapiClient` diretamente de hooks ou componentes — sempre via fetch para a API Route

### Exibição de Dados Stale na UI

Todo componente que exibe dados brapi deve:
1. Mostrar skeleton durante `isLoading`
2. Exibir badge/tooltip sutil quando `isStale === true` (ex: `⚡ dados de Xmin atrás`)
3. Ter estado de erro com botão "Tentar novamente"
4. Ter estado vazio com ação clara (não apenas "Sem dados")
