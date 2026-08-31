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
- **Sempre conferir `base: dev` antes de criar ou mesclar qualquer PR.** O GitHub sugere `main` como padrão; aconteceu duas vezes nesta fase (o PR inicial do kickoff e o PR #29 do ESLint).
- **BOM invisível quebra scripts.** Ao criar arquivos de configuração lidos por shell ou parser JSON no PowerShell, preferir `[System.IO.File]::WriteAllText(...)` a `Out-File -Encoding utf8`.
- **Legado não é corrigido em tasks de infraestrutura.** Ligar uma ferramenta (ESLint, tipos, etc.) e corrigir o que ela encontra no código existente são tarefas diferentes — a segunda foi deliberadamente adiada para a Fase 2, quando os arquivos afetados serão reescritos de qualquer forma.
- **Branch criada antes do bloco anterior fechar pode ficar desatualizada.** Se uma branch (`feature/x`) for criada com antecedência e ficar parada enquanto outras PRs mergeiam em `dev`, ela pode conter conteúdo obsoleto (um rascunho antigo do mesmo arquivo, por exemplo) e gerar conflito na hora de trazer trabalho novo pra ela. Rodar `git log --oneline <branch>..origin/dev` antes de abrir o PR mostra se ela está atrasada.

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

### Pendentes
- **#21** — tipografia (Nunito + DM Sans), depende de #20 (liberada agora).
- **#22** — helper `requireAuthContext()`.
- **#23** — `.env.example`.
- **#24–#27** — primitivos (Button, Input, Card, Badge/Avatar/Chip), dependem de #20 e #21.

Ao final da Fase 1, quase nenhuma tela do sistema terá mudado (exceto o fundo/texto base já aplicado pela #20) — a Fase 2 é quando essas peças passam a ser efetivamente usadas, feature por feature, começando pela mais simples.
