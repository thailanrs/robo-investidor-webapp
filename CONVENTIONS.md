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

> ⚠️ **Lição aprendida (ROB-13):** O agente Jules criou migrations em `./supabase/migrations/` — pasta **não reconhecida** pelo pipeline de deploy. A migration não foi executada automaticamente, causando erro de runtime em produção (`dividends` table not found).

### Regra Absoluta
**Todo arquivo de migration SQL deve ser criado em:**
```
./utils/supabase/migrations/
```
**Nunca** em `./supabase/migrations/`, `./db/`, `./sql/` ou qualquer outro caminho.

### Nomenclatura
```
YYYYMMDDHHMMSS_descricao_em_snake_case.sql
```
Exemplo: `20260429120000_create_dividends.sql`

### Checklist obrigatório antes de abrir PR com DDL
- [ ] Arquivo `.sql` está em `./utils/supabase/migrations/`
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