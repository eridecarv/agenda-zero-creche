# Agenda Zero — Log da Fase 1

> Registro cronológico do trabalho realizado desde a criação da branch `dev` até o fechamento do bloco de infraestrutura da Fase 1. Serve como histórico de decisões e como referência para retomar o contexto mais tarde.

---

## 1. Setup inicial

- Branch **`dev`** criada a partir da `main`, para que a reestruturação não afete produção até estar pronta.
- `MIGRATION_KICKOFF.md` commitado como primeiro commit da `dev` (documento de convenções da migração).
- **Aprendizado:** um primeiro pull request foi aberto por engano na direção `base: main ← compare: dev` — foi identificado e cancelado antes do merge. Lição fixada: **sempre conferir a direção do PR antes de mesclar**, já que o GitHub sugere `main` como base por padrão.
- **Proteção de branch configurada:** `main` agora exige Pull Request antes de qualquer merge (Settings → Branches → classic protection rule). Push direto na `main` não é mais possível.

## 2. Organização do backlog

- Criado `PHASE_1_TASKS.md` com as 12 tasks da fundação da Fase 1.
- Instalado o **GitHub CLI** (`gh`), autenticado via `gh auth login`.
- Script `create-phase1-issues.ps1` escrito e executado: criou 5 labels (`fase-1`, `fase-2`, `infra`, `design-system`, `security`) e as 12 issues (#16–#27) de uma vez.
- Reconciliação do board antigo (15 issues pré-existentes, #1–#15) feita por leitura via `gh issue list`: identificadas obsoletas (#12, referência a CI que o projeto decidiu não adotar), desatualizadas (#10, mencionava Jest em vez de Vitest), e já resolvidas no código (#8, `useSchool` já retorna `Role` tipado). Board realinhado com as tasks novas da Fase 1.
- Item **#15** (extrair upload para `storage.ts`) estava preso em "In progress" há meses sem trabalho real (confirmado: `storage.ts` não existe, upload segue inline em `createIncident`). Movido de volta para o Backlog, marcado como pertencente à Fase 2 — será absorvido quando a feature de incidents for reconstruída.

## 3. Bloco de infraestrutura (#16 – #19)

### #16 — Higiene inicial do repositório
Sem branch de código; verificação em painéis.
- Confirmado no Vercel: **Production Branch é `main`** (Overview → Production Deployment → Source: main).
- `main` protegida no GitHub (ver seção 1).
- Confirmado, via `Get-ChildItem -Recurse -Filter "middleware.ts"`, que **não existe** `middleware.ts` órfão — só o `proxy.ts` correto (Next.js 16 renomeou middleware → proxy).

### #17 — Setup de formatação (Prettier + Husky + lint-staged)
Branch `chore/setup-formatting` → PR #28 → merge em `dev`.
- Decisão de estilo: sem `;`, aspas simples (`.prettierrc`).
- `.prettierignore` criado excluindo `node_modules`, `.next`, build artifacts, e **`*.md`** (para não reformatar documentação com blocos de código sensíveis).
- Baseline aplicado: **89 arquivos** reformatados num commit único e isolado.
- Husky + lint-staged instalados; hook `pre-commit` configurado para rodar `prettier --write` nos arquivos staged.
- **Aprendizado técnico:** `Out-File -Encoding utf8` no PowerShell insere um BOM (Byte Order Mark) invisível que quebra scripts lidos pelo Git Bash (`$'\357\273\277npx': command not found`). Corrigido usando `[System.IO.File]::WriteAllText(...)` em vez de `Out-File` para arquivos de config lidos por shell/JSON.
- Teste real: arquivo mal formatado commitado → hook rodou → Prettier corrigiu automaticamente → commit passou.
- Todos os commits da branch foram espremidos (`git reset --soft` até o ponto de origem na `dev`) num único commit final, por ser uma branch de escopo fechado.

### #18 — ESLint com regras reais
Branch `chore/eslint-rules` → PR #30 → merge em `dev` (PR #29 foi criada por engano apontando para `main`, identificada e fechada sem merge).
- **Descoberta:** `eslint-config-next` já trazia `eslint-plugin-react-hooks` (v7.0.0) e `eslint-plugin-jsx-a11y` (v6.10.2) empacotados — nada precisou ser instalado.
- Confirmado via `--print-config` que `react-hooks/rules-of-hooks` já roda como **error** (nível 2), não apenas aviso.
- Scan do projeto inteiro (`npx eslint .`) encontrou **62 problemas pré-existentes** (35 erros, 27 avisos) — incluindo bugs reais como um componente recriado a cada render (`announcements/page.tsx`) e funções usadas antes de declaradas dentro de efeitos (`ClassModal.tsx`). **Não corrigidos nesta task** — documentados na issue como referência, já que a maioria está em arquivos que serão reescritos na Fase 2.
- `.lintstagedrc` atualizado para rodar `eslint --fix` (seguido de `prettier --write`) nos arquivos `.ts/.tsx/.js/.jsx` staged — aplicação incremental, sem forçar correção do legado agora.
- Teste real: arquivo com `const x: any` commitado → hook bloqueou o commit com o erro do ESLint (comportamento correto: erro de tipagem não se autocorrige).

### #19 — Scripts npm auxiliares
Branch `chore/npm-scripts` → PR #31 → merge em `dev`.
- Adicionados ao `package.json`: `typecheck` (`tsc --noEmit`), `test:coverage` (`vitest run --coverage`), `test:watch` (`vitest --watch`).
- Todos testados: typecheck limpo (sem erros de tipo no projeto); coverage rodou 5 arquivos de teste / 13 testes, ~30% de cobertura geral (esperado — as Server Actions estão quase sem cobertura hoje, o que é justamente o que a Fase 2 vai mudar); watch mode iniciou e encerrou corretamente.

## 4. Aprendizados fixados para o resto da migração

- **`Closes #N` não fecha nada automaticamente enquanto o fluxo passar por `dev`.** As palavras-chave de fechamento (`Closes`/`Fixes`/`Resolves`) só são interpretadas pelo GitHub quando o PR tem como alvo a branch *padrão* do repositório — que é `main`, não `dev`. Como toda PR desta migração aponta pra `dev` (por desenho: `dev` acumula a reescrita inteira antes do merge final), `Closes #N` nunca aciona fechamento automático em nenhuma dessas PRs, independente do idioma. *(Correção do aprendizado anterior, que atribuía isso ao idioma — provavelmente uma coincidência de timing com fechamento manual.)* Prática adotada a partir da #20: manter `Closes #N` na descrição como documentação/rastreabilidade, mas fechar cada issue manualmente após o merge em `dev`.
- **Sempre conferir `base: dev` antes de criar ou mesclar qualquer PR.** O GitHub sugere `main` como padrão; já aconteceu três vezes nesta fase (o PR inicial do kickoff, o PR #29 do ESLint, e o PR da #23). Na terceira vez ficou clara a consequência prática de errar isso: como `main` exige review aprovado por alguém com permissão de escrita (ver seção 1), e o repositório é solo, um PR apontado pra `main` por engano fica **permanentemente travado** — o GitHub não conta a aprovação do próprio autor do PR. Correção: fechar o PR errado (sem mergear nada, inclusive sem usar "bypass rules") e abrir de novo com a base certa.
- **BOM invisível quebra scripts.** Ao criar arquivos de configuração lidos por shell ou parser JSON no PowerShell, preferir `[System.IO.File]::WriteAllText(...)` a `Out-File -Encoding utf8`.
- **Legado não é corrigido em tasks de infraestrutura.** Ligar uma ferramenta (ESLint, tipos, etc.) e corrigir o que ela encontra no código existente são tarefas diferentes — a segunda foi deliberadamente adiada para a Fase 2, quando os arquivos afetados serão reescritos de qualquer forma.
- **Branch criada antes do bloco anterior fechar pode ficar desatualizada.** Se uma branch (`feature/x`) for criada com antecedência e ficar parada enquanto outras PRs mergeiam em `dev`, ela pode conter conteúdo obsoleto (um rascunho antigo do mesmo arquivo, por exemplo) e gerar conflito na hora de trazer trabalho novo pra ela. Rodar `git log --oneline <branch>..origin/dev` antes de abrir o PR mostra se ela está atrasada.
- **Convenção de TODO comments** formalizada no `MIGRATION_KICKOFF.md` (seção "TODO comments"): `// TODO(#N): descrição` quando existe issue de rastreio, `// TODO: descrição` quando não existe ainda. Buscável via `grep -rn "TODO"`.

## 5. Estado atual

Bloco de infraestrutura da Fase 1 **concluído**: #16, #17, #18 e #19 fechadas e em Done no board.

**Pendente, não bloqueante:** a triagem completa das issues antigas (#1–#15) foi recomendada mas não confirmada como executada em todos os itens (fechar #4 e #12, atualizar #10 de Jest para Vitest). Pode ser feita a qualquer momento sem impacto na Fase 1.

## 6. Bloco de fundação visual e de segurança (#20 – #27)

### #20 — Tokens de design em `globals.css` (concluída)
Branch `feature/design-tokens` (criada antes do bloco de infraestrutura terminar) → PR → merge em `dev`.
- Implementado via `@theme` (Tailwind v4 CSS-first config). Trocado de `@theme inline` (estilo do primeiro rascunho) para `@theme` puro: `inline` existe para quando o valor é uma *referência* a variável que muda em runtime (padrão típico de dark mode via `:root`/`.dark`); aqui os valores são literais fixos, sem indireção.
- Cores semânticas: `primary`, `success`, `warning`, `info`, `danger` — mais **`--color-health`** (`#9E78D8`, Lavender), formalizado como 6º token. Estava na paleta do Design Guidelines v1.0 ("Saúde · destaque") mas fora da lista de "tokens semânticos" do guia — decisão de promovê-lo registrada aqui.
- Radius: implementado o conjunto completo do guia (7 valores: `xs`/`sm`/`md`/`lg`/`xl`/`pill`/`circle`), não só os 3 citados no corpo da issue (`md`/`lg`/`xl`) — evita retrabalho quando #24–27 (Badge/Avatar/Chip) forem implementadas.
- Sombras: só `shadow-sm` tinha valor exato no guia. `shadow-md`/`lg`/`xl` foram **estimados** por progressão linear de offset/blur/opacidade sobre o mesmo `rgba(180,140,120,…)` — sujeitos a ajuste visual quando Card (#26) e futuros modais forem implementados.
- Tipografia (`--font-display`/`--font-body`, regras de heading) deliberadamente **fora** desta issue — entra na #21, que depende desta.
- `body { background-color; color }` aplicado nesta task — telas já refletem `--color-bg`/`--color-fg1` a partir deste merge (decisão consciente de aplicar cedo, sem esperar a Fase 2 — única exceção à regra de "nenhuma tela muda" no bloco de fundação).
- **Aprendizado — escala de espaçamento não precisou de token nenhum.** O Tailwind v4 já usa `--spacing: 0.25rem` (4px) como base; `p-1`...`p-16` já batem 1:1 com a escala do guia (`sp-1` = 4px ... `sp-16` = 64px). Critério de aceite satisfeito sem escrever código.
- **Aprendizado técnico — VSCode acusa `Unknown at rule @theme`.** A extensão Tailwind CSS IntelliSense dá autocomplete mas não desliga o validador nativo de CSS do editor. Resolvido com `.vscode/settings.json` → `"css.lint.unknownAtRules": "ignore"` (versionado no repo, não config pessoal).
- **Aprendizado técnico — commit caiu na branch errada.** Um commit dos tokens foi feito por engano em cima de `chore/npm-scripts` (já mergeada) em vez de `feature/design-tokens`. Resolvido com `git reset HEAD~1` (desfaz o commit, mantém as mudanças) → `git stash push -u` → `git checkout feature/design-tokens` → `git stash pop`. Como a branch de destino já tinha um commit de rascunho antigo do mesmo arquivo, isso gerou conflito, resolvido substituindo o conteúdo manualmente pela versão corrigida. O mesmo tipo de conflito se repetiu no `git rebase origin/dev` antes do PR (branch desatualizada, ver aprendizado da seção 4). Nenhum dado foi perdido nos dois casos.

### #21 — Tipografia (Nunito + DM Sans) (concluída)
Branch `feature/typography` → PR → merge em `dev`.
- `layout.tsx` **não precisou de nenhuma mudança** — já carregava Nunito (600/700/800) e DM Sans (400/500/600) via `next/font/google` com os pesos certos, confirmando que a escala do cheat sheet (não a da página 03) era a pretendida desde o início.
- **O guia tinha duas escalas tipográficas conflitantes** entre páginas diferentes (página "03 — Tipografia", em pt; cheat sheet final, em px) — não eram a mesma escala em unidades diferentes, eram dois rascunhos distintos de momentos diferentes do design. Decisão: seguir o cheat sheet (px, nativo da web), preenchendo duas lacunas que ele não cobria (`--text-label`, `--text-caption`) com valores estimados.
- **Aprendizado técnico — `@theme` vs `@theme inline`, o inverso do caso da #20.** Como `--font-display`/`--font-body` já são variáveis dinâmicas definidas pelo `next/font` no `<html>`, declará-las num `@theme{}` normal faria o Tailwind criar sua própria cópia no `:root` e quebrar a referência. Corrigido usando um bloco `@theme inline{}` separado, só para o mapeamento de fontes — os dois tipos de bloco (`@theme` e `@theme inline`) coexistem no mesmo arquivo, cada um usado onde é apropriado.
- Peso de fonte não precisou de token (`font-semibold`/`font-bold`/`font-extrabold` do Tailwind já cobrem 600/700/800) — mesmo padrão de "o Tailwind já faz de graça" da escala de espaçamento na #20.

### #22 — Helper `requireAuthContext()` (concluída)
Branch `feature/auth-context` → PR (inclui também a correção pontual do README, ver abaixo).
- **Mudança de escopo real durante a implementação:** o snippet de referência do `MIGRATION_KICKOFF.md` (seção 5.3) consultava a tabela `users` de verdade. Decisão tomada em conversa: a modelagem do banco está sendo redesenhada do zero (distinta da migração de nomenclatura pt→en, que já está feita), então `schoolId`/`role` ficam **mockados** (`auth-context.mock.ts`) até o redesenho acontecer. A validação de sessão (`supabase.auth.getUser()`) continua real — não depende da modelagem, é mecanismo padrão do Supabase Auth.
- Critério de aceite da issue **editado** (`gh issue edit 22`) para refletir essa decisão antes da implementação — inclusive removendo a cláusula "retorna null se usuário não encontrado", que não se aplica mais sem consulta à tabela.
- **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` confirmado como nome real** da variável (via `.env.local`) — o `README.md` ainda cita a antiga `ANON_KEY`. Correção incluída neste mesmo PR.
- **`Role` reaproveitado de `@/types`** (`'admin' | 'coordinator' | 'teacher' | 'assistant' | 'guardian'`, definido em `src/types/school.ts`) em vez de `string` genérico — evita duas fontes de verdade pro mesmo conceito.
- **Investigação via Claude Code** confirmou que `useSchool` (hook client-side existente) já usa exatamente os mesmos nomes de campo (`userId`, `schoolId`, `role`) e o mesmo tipo `Role` — nenhuma inconsistência de nomenclatura entre a peça nova (servidor) e a existente (cliente).
- `requireAuthContext()` não substitui nada que já existia — é uma 5ª camada, paralela às quatro que já protegiam a tela (`proxy.ts`, `useSchool`, redirect na página, mais o próprio login). As primeiras quatro decidem o que a tela *mostra*; a nova decide o que a Server Action *executa*, um contexto onde nenhuma das outras roda.

### #23 — `.env.example` (concluída)
Branch `chore/env-example` → PR → merge em `dev`.
- `.env.example` criado na raiz com as três variáveis da issue (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) mais uma quarta, `NEXT_PUBLIC_APP_URL`, que não estava na issue nem no README — confirmada como uso real via `Select-String "APP_URL"` antes de incluir: é usada em `GuardianModal.tsx` pra montar o link absoluto do convite do responsável, com fallback pra `localhost:3000` caso não esteja configurada.
- **`.gitignore` corrigido:** a regra `.env*` (linha ampla, pensada só pra bloquear segredos) sem querer também bloqueava o próprio `.env.example`, que deveria ser versionado. Adicionada exceção `!.env.example` logo depois da regra.
- **Repetição do erro de PR apontando pra `main`** (terceira vez na fase, ver aprendizado atualizado na seção 4) — dessa vez com consequência nova: `main` bloqueou o merge por exigir review, e como o repositório é solo, ninguém podia aprovar. PR fechado sem merge e reaberto com `base: dev` correto.
- **Achado paralelo, não resolvido nesta task:** `NEXT_PUBLIC_APP_URL` tem fallback silencioso pra `localhost:3000` no código (`GuardianModal.tsx`). Se essa variável não estiver configurada nas Environment Variables do Vercel em produção, convites gerados lá viram links quebrados sem nenhum erro visível. Vale conferir isso no painel do Vercel quando houver oportunidade — não é escopo da #23, só uma observação registrada.

### Pendentes
- **#24–#27** — primitivos (Button, Input, Card, Badge/Avatar/Chip), dependem de #20 e #21 (ambas concluídas — liberadas).

Ao final da Fase 1, quase nenhuma tela do sistema terá mudado (exceto o fundo/texto base já aplicado pela #20) — a Fase 2 é quando essas peças passam a ser efetivamente usadas, feature por feature, começando pela mais simples.