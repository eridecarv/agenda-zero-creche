# =====================================================================
#  Agenda Zero - Fase 1 (Fundacao)
#  Cria labels e as 12 issues da Fase 1 via GitHub CLI.
#
#  COMO USAR:
#  1. Abra o PowerShell na pasta do projeto (agenda-zero-creche)
#  2. Rode:  .\create-phase1-issues.ps1
#
#  Se der erro de "execution policy", rode antes (so nesta sessao):
#     Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#
#  Requer: gh instalado e autenticado (gh auth login).
# =====================================================================

Write-Host "==> Criando labels..." -ForegroundColor Cyan

# --force evita erro se a label ja existir (ela e atualizada)
gh label create "fase-1"        --color "0E8A16" --description "Fundacao da migracao" --force
gh label create "fase-2"        --color "5319E7" --description "Reconstrucao feature a feature" --force
gh label create "infra"         --color "C5DEF5" --description "Ferramentas e configuracao" --force
gh label create "design-system" --color "FF8C66" --description "Tokens, tipografia, primitivos" --force
gh label create "security"      --color "B60205" --description "Revisao de seguranca" --force

Write-Host "==> Criando issues da Fase 1..." -ForegroundColor Cyan

# ---- 1 ----
gh issue create `
  --title "chore: higiene inicial do repositorio" `
  --label "fase-1,infra" `
  --body @"
Passos de configuracao e verificacao (sem codigo) que travam a seguranca do fluxo antes de a Fase 1 comecar.

**Criterio de aceite:**
- [ ] No Vercel, confirmar que a Production Branch e ``main`` (subir ``dev`` gera so preview).
- [ ] (Opcional) Proteger ``main`` no GitHub (Settings -> Branches): exigir PR, bloquear push direto.
- [ ] Confirmar que NAO existe nenhum ``middleware.ts`` orfao. No Next 16 ele seria ignorado silenciosamente e a protecao de rota pararia sem avisar. So o ``proxy.ts`` deve existir.
"@

# ---- 2 ----
gh issue create `
  --title "chore: setup de formatacao automatica (Prettier + Husky + lint-staged)" `
  --label "fase-1,infra" `
  --body @"
Formatacao consistente em todo commit. Prettier formata; Husky engata no commit; lint-staged roda so nos arquivos do commit.

**Importante:** rodar o Prettier no projeto inteiro UMA vez, num commit dedicado, ANTES de ligar o Husky. Assim a reformatacao em massa fica isolada e nao polui os diffs das proximas tasks.

**Criterio de aceite:**
- [ ] ``prettier`` instalado; ``.prettierrc`` e ``.prettierignore`` criados.
- [ ] Commit de baseline aplicando Prettier em todo o projeto (isolado, so formatacao).
- [ ] ``husky`` e ``lint-staged`` instalados e configurados.
- [ ] Hook de ``pre-commit`` roda o lint-staged.
- [ ] Teste real: commitar arquivo mal-formatado e ver ele sair formatado sozinho.
"@

# ---- 3 ----
gh issue create `
  --title "chore: ESLint com regras reais" `
  --label "fase-1,infra" `
  --body @"
Sair da configuracao minima do Next e ligar regras que pegam problemas de React Hooks e acessibilidade.

Depende de: setup de formatacao.

**Criterio de aceite:**
- [ ] Plugin de React Hooks ativo (``react-hooks``).
- [ ] Regras de acessibilidade ativas (``jsx-a11y``).
- [ ] (Opcional) lint-staged roda o ESLint junto do Prettier.
- [ ] Teste real: o lint acusa um erro proposital de hook e um de a11y.
"@

# ---- 4 ----
gh issue create `
  --title "chore: scripts npm auxiliares" `
  --label "fase-1,infra" `
  --body @"
Scripts de verificacao usados no dia a dia e como Definition of Done das features.

**Criterio de aceite:**
- [ ] ``typecheck``: ``tsc --noEmit``.
- [ ] ``test:coverage``: roda os testes com cobertura.
- [ ] ``test:watch``: roda os testes em modo watch.
- [ ] Os tres rodam sem erro.
"@

# ---- 5 ----
gh issue create `
  --title "feat: tokens de design em globals.css" `
  --label "fase-1,design-system" `
  --body @"
Implementar todo token do Design Guidelines v1.0 como CSS custom property. Base visual sobre a qual primitivos e telas serao reconstruidos. A partir daqui, nenhum hex hardcoded.

**Criterio de aceite:**
- [ ] Cores semanticas: ``--primary``, ``--success``, ``--warning``, ``--info``, ``--danger``.
- [ ] Superficies e texto: ``--bg``, ``--surface``, ``--fg1``, ``--fg2``.
- [ ] Radius: ``--radius-md`` (14px), ``--radius-lg`` (20px), ``--radius-xl`` (28px).
- [ ] Sombras usando ``rgba(180,140,120, ...)`` - nunca ``rgba(0,0,0, ...)``.
- [ ] Escala de espacamento (base 4px) disponivel.
- [ ] Nenhuma cor hex nova hardcoded a partir daqui.
"@

# ---- 6 ----
gh issue create `
  --title "feat: tipografia (Nunito + DM Sans)" `
  --label "fase-1,design-system" `
  --body @"
Aplicar as duas familias do design system. Nunito para display/headings (700, 800); DM Sans para UI/body (400, 500, 600).

Depende de: tokens de design.

**Criterio de aceite:**
- [ ] Nunito e DM Sans carregadas (via ``next/font/google``, recomendado no Next 16).
- [ ] Fontes ligadas aos tokens/escala tipografica do guia.
- [ ] Headings usam Nunito; corpo/UI usa DM Sans.
"@

# ---- 7 ----
gh issue create `
  --title "feat: helper requireAuthContext" `
  --label "fase-1,security" `
  --body @"
Criar ``src/lib/auth-context.ts`` com ``requireAuthContext()``. Peca compartilhada que resolve os 7 achados criticos da revisao de seguranca: deriva ``userId``/``schoolId``/``role`` do cookie do chamador, para que as actions parem de confiar em valores enviados pelo client. Nao e usado por ninguem ainda - fica pronto pra primeira feature da Fase 2 consumir.

**Criterio de aceite:**
- [ ] ``src/lib/auth-context.ts`` criado, exportando ``requireAuthContext()``.
- [ ] Retorna ``{ userId, schoolId, role }`` para sessao valida.
- [ ] Retorna ``null`` quando nao ha sessao ou usuario nao encontrado.
- [ ] Nao altera nenhuma action existente nesta task (so cria o helper).
"@

# ---- 8 ----
gh issue create `
  --title "chore: adicionar .env.example" `
  --label "fase-1,infra" `
  --body @"
Criar o arquivo na raiz que o README referencia mas nao existe no repo. Documenta as variaveis necessarias.

**Criterio de aceite:**
- [ ] ``.env.example`` na raiz com ``NEXT_PUBLIC_SUPABASE_URL``, ``NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`` e ``SUPABASE_SERVICE_ROLE_KEY``.
- [ ] Sem valores reais - so os nomes das chaves.
- [ ] Bate com o que o README menciona.
"@

# ---- 9 ----
gh issue create `
  --title "refactor: Button com tokens" `
  --label "fase-1,design-system" `
  --body @"
Reescrever o primitivo ``Button`` consumindo os tokens, com variantes e estados do guia.

Depende de: tokens de design + tipografia.

**Criterio de aceite:**
- [ ] Variantes: Primary, Secondary, Ghost, Pill.
- [ ] Estado disabled.
- [ ] Nenhum hex hardcoded (so ``var(--...)``).
- [ ] ``Button.examples.tsx`` atualizado como catalogo visual.
- [ ] Acessibilidade: foco visivel, ``aria`` adequado.
"@

# ---- 10 ----
gh issue create `
  --title "refactor: Input com tokens" `
  --label "fase-1,design-system" `
  --body @"
Reescrever o primitivo ``Input`` com os tokens e os estados do guia.

Depende de: tokens de design + tipografia.

**Criterio de aceite:**
- [ ] Estados: default, foco/ativo, erro.
- [ ] Mensagem de erro no padrao do guia.
- [ ] Nenhum hex hardcoded.
- [ ] ``Input.examples.tsx`` atualizado.
- [ ] Acessibilidade: label associada, ``aria-invalid`` no erro.
"@

# ---- 11 ----
gh issue create `
  --title "refactor: Card com tokens" `
  --label "fase-1,design-system" `
  --body @"
Reescrever o primitivo ``Card`` com tokens (superficie, radius-lg, shadow-sm).

Depende de: tokens de design + tipografia.

**Criterio de aceite:**
- [ ] Usa ``--surface``, ``--radius-lg``, ``--shadow-sm``.
- [ ] Nenhum hex hardcoded.
- [ ] ``Card.examples.tsx`` atualizado.
"@

# ---- 12 ----
gh issue create `
  --title "refactor: Badge, Avatar e Chip com tokens" `
  --label "fase-1,design-system" `
  --body @"
Reescrever os primitivos menores num so PR (simples e relacionados). Se algum crescer muito, quebrar em issue propria.

Depende de: tokens de design + tipografia.

**Criterio de aceite:**
- [ ] ``Badge`` com tokens e variantes do guia.
- [ ] ``Avatar`` com radius circle e tamanhos.
- [ ] ``Chip`` (categoria/status/filtro) com tokens.
- [ ] Nenhum hex hardcoded nos tres.
- [ ] ``.examples.tsx`` de cada um atualizado.
"@

Write-Host "==> Pronto. 12 issues da Fase 1 criadas." -ForegroundColor Green
Write-Host "Confira com: gh issue list --label fase-1" -ForegroundColor Green
