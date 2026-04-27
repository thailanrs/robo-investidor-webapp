# Padrões de Código (Code Conventions)

1. **Requisições:** Use sempre o `fetch` nativo do Next.js.
2. **Validação:** Use `Zod` para validar formulários e payloads de API.
3. **Estilos:** Use Tailwind CSS. Para componentes complexos, crie na pasta `/components/ui`.
4. **Banco de Dados:** Sempre use o cliente instanciado em `lib/supabase.ts` (ou equivalente no server/client). Não instancie novos clientes soltos.
5. **Idioma:** Variáveis, funções e comentários em Português-BR ou Inglês, mas mantenha a consistência no mesmo arquivo.
6. **Desenvolvimento Modular (Regra de Ouro):** Pense sempre em reaproveitamento. Componentes visuais devem ser isolados em `/components`. Regras de negócio e chamadas de banco de dados devem ser abstraídas em funções puras dentro de `/lib` ou Custom Hooks em `/hooks`. Evite escrever lógicas complexas e queries diretamente dentro dos arquivos de página (`page.tsx`).