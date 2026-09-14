# =====================================================================
#  Agenda Zero - Fase 2 (Feature a feature)
#  Cria labels e as issues da Fase 2 via GitHub CLI.
#
#  COMO USAR:
#  1. Abra o PowerShell na pasta do projeto (agenda-zero-creche)
#  2. Rode:  .\create-phase2-issues.ps1
#
#  Se der erro de "execution policy", rode antes (so nesta sessao):
#     Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#
#  Requer: gh instalado e autenticado (gh auth login).
#  Labels fase-2, security e infra ja existem da Fase 1.
# =====================================================================

Write-Host "==> Criando labels novas..." -ForegroundColor Cyan

gh label create "bloco-0"      --color "EDEDED" --description "Preparacao da Fase 2" --force
gh label create "login"        --color "FFC078" --description "Feature: login e autenticacao" --force
gh label create "dashboard"    --color "FFC078" --description "Feature: dashboard administrativo" --force
gh label create "cadastros"    --color "FFC078" --description "Feature: cadastros (turmas, criancas, responsaveis, staff)" --force
gh label create "comunicados"  --color "FFC078" --description "Feature: comunicados" --force
gh label create "portal"       --color "FFC078" --description "Feature: portal do responsavel" --force
gh label create "diario"       --color "FFC078" --description "Feature: diario de rotina" --force
gh label create "ocorrencias"  --color "FFC078" --description "Feature: ocorrencias/incidents" --force

Write-Host "==> Criando issues do Bloco 0 (Preparacao)..." -ForegroundColor Cyan

# ---- 0.1 ----
gh issue create `
  --title "chore: merge da fundacao (Fase 1) na main" `
  --label "fase-2,bloco-0" `
  --body @"
PR ``dev`` -> ``main`` com todo o trabalho da Fase 1. Prerequisito de toda feature da Fase 2, ja que as pages novas dependem dos tokens e primitivos.

**Criterio de aceite:**
- [ ] Varredura visual das telas que consomem primitivos alterados (Button: 13 importadores, Input: 8, Badge: API mudou).
- [ ] PR aberto, revisado, mergeado.
- [ ] Deploy em producao via Vercel verificado (telas existentes continuam funcionais).
- [ ] Plano de rollback confirmado: Vercel Instant Rollback pro deployment anterior se algo quebrar.
"@

# ---- 0.2 ----
gh issue create `
  --title "chore: atualizacao de documentacao (KICKOFF + README)" `
  --label "fase-2,bloco-0,infra" `
  --body @"
Documentos defasados em relacao as decisoes tomadas na Fase 1 e no planejamento da Fase 2.

**MIGRATION_KICKOFF.md:**
- [ ] Secao 5.2: remover ``No Storybook`` — Storybook foi adotado na #41, substituindo ``.examples.tsx``.
- [ ] Remover referencias a ``.examples.tsx`` como padrao vigente.
- [ ] Registrar decisoes da Fase 2: merge por feature na main, banco mockado, mocks em dois niveis, Storybook so pra primitivos.

**README.md:**
- [ ] Next.js 14 -> 16.
- [ ] ``ANON_KEY`` -> ``PUBLISHABLE_KEY`` (parcialmente corrigido na #22, confirmar se ficou limpo).
"@

# ---- 0.3 ----
gh issue create `
  --title "feat: mocks de dominio compartilhado (src/__mocks__/)" `
  --label "fase-2,bloco-0" `
  --body @"
Dados base reutilizaveis por todas as features. Cada feature importa daqui e acrescenta seus dados de contrato (input/output de operacao) no proprio ``__mocks__/``.

**Criterio de aceite:**
- [ ] ``src/__mocks__/`` criado com mocks tipados de: School, Class, Child, Guardian, Staff, User.
- [ ] ``index.ts`` como barrel export.
- [ ] Tipos importados de ``@/types`` — nenhum tipo duplicado.
- [ ] Mocks reaproveitaveis em Storybook (primitivos) e Vitest (features).
"@

# ---- 0.4 ----
gh issue create `
  --title "chore: limpeza de .examples.tsx orfaos" `
  --label "fase-2,bloco-0" `
  --body @"
Fase 1 substituiu ``.examples.tsx`` por Storybook para os 6 primitivos migrados. Os ``.examples.tsx`` dos componentes que NAO foram migrados (ficaram soltos em ``components/ui/``) continuam no disco sem utilidade.

**Criterio de aceite:**
- [ ] Deletados: ``ActionButton.examples.tsx``, ``AlertItem.examples.tsx``, ``BottomNav.examples.tsx``, ``ExpandableText.examples.tsx``, ``MetricCard.examples.tsx``, ``NarrativeCard.examples.tsx``.
- [ ] ``tsc --noEmit`` limpo apos a remocao.
- [ ] Nenhum import apontava pra eles (confirmar ANTES de deletar).
"@

# ---- 0.5 ----
gh issue create `
  --title "chore(tracking): remodelagem do banco de dados" `
  --label "fase-2" `
  --body @"
Issue guarda-chuva. Nao contem codigo — existe para que os ``TODO(#N)`` de cada feature da Fase 2 apontem pra um numero real.

**Escopo futuro (pos-Fase 2):**
- Redesenho do schema (tabelas, relacoes, naming).
- Migracao dos services de mock para queries reais.
- ``requireAuthContext()`` consultando tabela real em vez de retornar mock.
- Testes de integracao contra Supabase.

**Nao fechar esta issue ate que todos os TODO(#N) estejam resolvidos.**
"@

Write-Host "==> Criando issues do Bloco 1 (Login/Auth)..." -ForegroundColor Cyan

# ---- 1.1 ----
gh issue create `
  --title "refactor: page de login" `
  --label "fase-2,login" `
  --body @"
Pages: ``/login``, ``/`` (redirect).
A tela de login ja recebeu limpeza parcial de tokens na #25 (hex -> variaveis, radius/shadow -> classes).

**Resta:**
- [ ] Mover logica para ``features/auth/`` (components, hooks, service).
- [ ] ``page.tsx`` vira orquestradora fina.
- [ ] Service layer isolando acesso ao Supabase.
- [ ] Testes colocados.
- [ ] Resolver ou documentar ``#FFF0E8`` (gradiente sem token, pendencia da #25).
- [ ] ``/`` (root) tratada: redirect simples para ``/login`` ou ``/adm`` conforme sessao.
- [ ] Arquivos velhos deletados (``tsc --noEmit`` limpo).
- [ ] PR ``dev`` -> ``main``.
"@

# ---- 1.2 ----
gh issue create `
  --title "refactor: page de convite (/invite/[token])" `
  --label "fase-2,login" `
  --body @"
Page standalone. Responsavel recebe link, cria conta.

**Pontos de atencao:**
- Confirmar se ``GuardianModal.tsx`` e usado aqui, em ``/adm/registrations/guardians``, ou em ambos — define se o componente fica em ``features/auth/`` ou ``features/registrations/`` (ou compartilhado).
- ``NEXT_PUBLIC_APP_URL`` com fallback silencioso para ``localhost:3000`` (achado da #23). Confirmar configuracao no Vercel.

**Criterio de aceite:**
- [ ] Logica em ``features/auth/`` (ou onde a investigacao acima apontar).
- [ ] Service layer.
- [ ] Testes colocados.
- [ ] ``TODO(#UMBRELLA)`` nos pontos de integracao com o banco.
- [ ] PR ``dev`` -> ``main``.
"@

Write-Host "==> Criando issues do Bloco 2 (Dashboard)..." -ForegroundColor Cyan

# ---- 2.1 ----
gh issue create `
  --title "refactor: dashboard administrativo (/adm)" `
  --label "fase-2,dashboard" `
  --body @"
Page de entrada do lado adm. Provavelmente leve (menu/navegacao para sub-rotas).

**Criterio de aceite:**
- [ ] Se houver logica: mover para ``features/dashboard/``.
- [ ] Se for so layout/navegacao: manter como page simples com imports de primitivos.
- [ ] Tokens aplicados, nenhum hex hardcoded.
- [ ] Testes colocados (se houver logica).
- [ ] PR ``dev`` -> ``main``.
"@

Write-Host "==> Criando issues do Bloco 3 (Cadastros)..." -ForegroundColor Cyan

# ---- 3.1 ----
gh issue create `
  --title "refactor: cadastro de turmas (classrooms + ClassModal)" `
  --label "fase-2,cadastros" `
  --body @"
God file: ``ClassModal.tsx`` (647 linhas). **Primeira feature migrada — serve como template de referencia.**

Pages: ``/adm/registrations/classrooms`` (+ hub ``/adm/registrations`` absorvido aqui se for so navegacao).
Componentes: ``ClassModal``, ``AssignmentList.tsx`` (confirmar se e exclusivo daqui).
Debito: ``any`` nas queries do Supabase (lint travou na #27).

**Criterio de aceite:**
- [ ] ``features/registrations/`` criado com estrutura padrao (components, hooks, services, __mocks__, types.ts, index.ts).
- [ ] ``ClassModal`` decomposto: JSX, estado local, validacao em components/hooks; queries em service.
- [ ] Primitivos novos consumidos (Button, Input, Card, etc.) — nenhum hex hardcoded.
- [ ] ``requireAuthContext()`` em toda Server Action.
- [ ] ``TODO(#UMBRELLA)`` nos pontos de integracao.
- [ ] Mocks de contrato em ``features/registrations/__mocks__/``; dominio importado de ``src/__mocks__/``.
- [ ] Testes colocados.
- [ ] Hub de cadastros (``/adm/registrations``) incluso se for page de navegacao pura.
- [ ] Arquivos velhos deletados (``tsc --noEmit`` limpo).
- [ ] PR ``dev`` -> ``main``.
"@

# ---- 3.2 ----
gh issue create `
  --title "refactor: cadastro de criancas (children + ChildModal)" `
  --label "fase-2,cadastros" `
  --body @"
God file: ``ChildModal.tsx`` (547 linhas).

Page: ``/adm/registrations/children``.
Debito: ``any`` nas queries do Supabase.

**Criterio de aceite:**
- [ ] ``ChildModal`` decomposto em ``features/registrations/components/`` + hooks + service.
- [ ] Primitivos e tokens aplicados.
- [ ] ``requireAuthContext()`` em toda Server Action.
- [ ] ``TODO(#UMBRELLA)`` nos pontos de integracao.
- [ ] Mocks + testes colocados.
- [ ] Arquivos velhos deletados (``tsc --noEmit``).
- [ ] PR ``dev`` -> ``main``.
"@

# ---- 3.3 ----
gh issue create `
  --title "refactor: cadastro de responsaveis (guardians + GuardianModal)" `
  --label "fase-2,cadastros,security" `
  --body @"
Componente: ``GuardianModal.tsx``.
Page: ``/adm/registrations/guardians``.

**Achados de seguranca (3):**
- ``registerGuardian``: ``ctx.schoolId``/``userId``; exigir role admin/coordenador.
- ``verifyCpf``: aceitar ``schoolId`` so se ``== ctx.schoolId``; considerar SQL rpc.
- ``registerGuardian``: rollback completo (3 inserts atomicos via rpc).

**Criterio de aceite:**
- [ ] ``GuardianModal`` decomposto em ``features/registrations/`` + hooks + service.
- [ ] Os 3 achados de seguranca aplicados (guard + ctx em todas as actions).
- [ ] Primitivos e tokens aplicados.
- [ ] ``TODO(#UMBRELLA)`` nos pontos de integracao.
- [ ] Mocks + testes colocados.
- [ ] Arquivos velhos deletados (``tsc --noEmit``).
- [ ] PR ``dev`` -> ``main``.
"@

# ---- 3.4 ----
gh issue create `
  --title "refactor: cadastro de colaboradores (staff + StaffModal)" `
  --label "fase-2,cadastros" `
  --body @"
Componente: ``StaffModal.tsx``.
Page: ``/adm/registrations/staff``.

**Criterio de aceite:**
- [ ] ``StaffModal`` decomposto em ``features/registrations/`` + hooks + service.
- [ ] Primitivos e tokens aplicados.
- [ ] ``requireAuthContext()`` em toda Server Action.
- [ ] ``TODO(#UMBRELLA)`` nos pontos de integracao.
- [ ] Mocks + testes colocados.
- [ ] Arquivos velhos deletados (``tsc --noEmit``).
- [ ] PR ``dev`` -> ``main``.
"@

Write-Host "==> Criando issues do Bloco 4 (Comunicados)..." -ForegroundColor Cyan

# ---- 4.1 ----
gh issue create `
  --title "refactor: comunicados (adm + guardian)" `
  --label "fase-2,comunicados,security" `
  --body @"
God file: ``announcements/page.tsx`` (506 linhas).
Pages: ``/adm/announcements`` (envia) + ``/guardian/child/[id]/announcements`` (le).
Bug real do ESLint (#18): componente recriado a cada render.

**Achado de seguranca (1):**
- ``createAnnouncement``: check publisher role; usar ``ctx``.

**Criterio de aceite:**
- [ ] ``features/announcements/`` criado (components, hooks, services, __mocks__, types.ts).
- [ ] Page adm e page guardian usando o mesmo feature folder.
- [ ] Bug do ESLint corrigido (componente recriado a cada render).
- [ ] Achado de seguranca aplicado.
- [ ] Primitivos e tokens aplicados.
- [ ] ``TODO(#UMBRELLA)`` nos pontos de integracao.
- [ ] Mocks + testes colocados.
- [ ] Arquivos velhos deletados (``tsc --noEmit``).
- [ ] PR ``dev`` -> ``main``.
"@

Write-Host "==> Criando issues do Bloco 5 (Portal do Responsavel)..." -ForegroundColor Cyan

# ---- 5.1 ----
gh issue create `
  --title "refactor: portal do responsavel (home + perfil)" `
  --label "fase-2,portal,security" `
  --body @"
Pages: ``/guardian``, ``/guardian/child/[id]``, ``/guardian/child/[id]/perfil``.
Consome dados das features ja migradas (cadastros, comunicados).
Componentes: ``BottomNav.tsx`` — avaliar se vira primitivo em ``components/ui/`` ou fica em ``features/guardian/``.

**Achado de seguranca (medio):**
- ``guardian/child/[id]``: audit RLS; explicit guardianship check no carregamento.

Pendencias visuais de ``perfil/page.tsx``: gradiente do header e placeholder do Avatar (decisoes registradas na #27, revisitar aqui).

**Criterio de aceite:**
- [ ] ``features/guardian/`` criado (ou logica minima mantida nas pages, se nao justificar feature folder).
- [ ] ``BottomNav`` decidido: primitivo compartilhado ou componente de feature.
- [ ] Achado de seguranca medio aplicado (guardianship check).
- [ ] Primitivos e tokens aplicados.
- [ ] ``TODO(#UMBRELLA)`` nos pontos de integracao.
- [ ] Mocks + testes colocados.
- [ ] Arquivos velhos deletados (``tsc --noEmit``).
- [ ] PR ``dev`` -> ``main``.
"@

Write-Host "==> Criando issues do Bloco 6 (Diario)..." -ForegroundColor Cyan

# ---- 6.1 ----
gh issue create `
  --title "refactor: diario lado adm (dailylogs + DailyLogForm)" `
  --label "fase-2,diario" `
  --body @"
God file: ``DailyLogForm.tsx`` (889 linhas) — maior do projeto.
Pages: ``/adm/dailylogs``, ``/adm/dailylogs/[classId]``, ``/adm/dailylogs/[classId]/[childId]``.

Decomposicao sugerida do DailyLogForm: cada secao (sono, alimentacao, higiene, humor, observacoes) vira componente proprio dentro de ``features/daily-logs/components/``.

Issue #15 (``storage.ts`` — extrair upload) absorvida aqui se o upload de fotos pertencer ao diario.

**Criterio de aceite:**
- [ ] ``features/daily-logs/`` criado com estrutura padrao.
- [ ] ``DailyLogForm`` decomposto em componentes de secao.
- [ ] Service layer isolando Supabase.
- [ ] ``requireAuthContext()`` em toda Server Action.
- [ ] Primitivos e tokens aplicados.
- [ ] ``TODO(#UMBRELLA)`` nos pontos de integracao.
- [ ] Mocks + testes colocados.
- [ ] Arquivos velhos deletados (``tsc --noEmit``).
- [ ] PR ``dev`` -> ``main``.
"@

# ---- 6.2 ----
gh issue create `
  --title "refactor: diario lado responsavel (dailylog + NarrativeCard)" `
  --label "fase-2,diario" `
  --body @"
Pages: ``/guardian/child/[id]/dailylog``, ``/guardian/child/[id]/dailylog/[date]``.
Componentes: ``NarrativeCard.tsx``, ``TimelineItem.tsx``, ``MetricCard.tsx``.
Destino: ``features/daily-logs/components/`` (mesma feature do lado adm, componentes de visualizacao).

Pendencia da #27: par soft/strong para ``--color-health`` (Lavender) — entra aqui quando ``NarrativeCard`` for reconstruido para exibir humor.
Hex sem token: ``#F0EAE4``/``#C4B5A8`` (bordas/texto de ``NarrativeCard.tsx``, pendencia documentada).

**Criterio de aceite:**
- [ ] Componentes de visualizacao em ``features/daily-logs/components/``.
- [ ] ``--color-health-soft``/``--color-health-strong`` criados (extrair do Figma, nao estimar).
- [ ] Hex pendentes resolvidos ou formalmente documentados como TODO.
- [ ] Primitivos e tokens aplicados.
- [ ] ``TODO(#UMBRELLA)`` nos pontos de integracao.
- [ ] Mocks + testes colocados.
- [ ] Arquivos velhos deletados (``tsc --noEmit``).
- [ ] PR ``dev`` -> ``main``.
"@

Write-Host "==> Criando issues do Bloco 7 (Ocorrencias)..." -ForegroundColor Cyan

# ---- 7.1 ----
gh issue create `
  --title "refactor: ocorrencias (incidents)" `
  --label "fase-2,ocorrencias,security" `
  --body @"
God file: ``incidents/page.tsx`` (726 linhas).
Page: ``/adm/incidents``.
Issue #15 (``storage.ts``): absorvida aqui se o upload pertencer a incidents (e nao ao diario).

**Achados de seguranca (4 criticos):**
- ``createIncident``: write com ``ctx.schoolId``; ``recordedBy = ctx.userId``.
- ``sendIncident``: fetch by id **AND** ``school_id``; usar ``ctx.userId``.
- ``updateIncident``: mesmo fetch guard; ``editedBy = ctx.userId``.
- ``markIncidentRead``: ``ctx.userId``; validar guardianship ativa.

**Criterio de aceite:**
- [ ] ``features/incidents/`` criado com estrutura padrao.
- [ ] ``incidents/page.tsx`` decomposto (formulario, listagem, workflow de envio como componentes/hooks separados).
- [ ] Os 4 achados de seguranca aplicados.
- [ ] Service layer isolando Supabase.
- [ ] Upload isolado (``storage.ts`` ou equivalente no service).
- [ ] Primitivos e tokens aplicados.
- [ ] ``TODO(#UMBRELLA)`` nos pontos de integracao.
- [ ] Mocks + testes colocados.
- [ ] Arquivos velhos deletados (``tsc --noEmit``).
- [ ] PR ``dev`` -> ``main``.
"@

Write-Host "==> Criando issues do Bloco 8 (Fechamento)..." -ForegroundColor Cyan

# ---- 8.1 ----
gh issue create `
  --title "chore: varredura final e limpeza de legado" `
  --label "fase-2,infra" `
  --body @"
Validacao pos-migracao. Todas as features devem estar mergeadas na ``main`` antes desta issue.

**Criterio de aceite:**
- [ ] Nenhum arquivo legado restante em ``components/ui/`` que deveria ter sido absorvido.
- [ ] ``tsc --noEmit`` limpo.
- [ ] ``npx eslint .`` — os 62 erros pre-existentes da #18 devem estar resolvidos.
- [ ] ``npx vitest run`` — suite completa passando.
- [ ] Primitivos remanescentes avaliados (``ActionButton``, ``AlertItem``, ``ExpandableText``): promover a primitivo, absorver em feature, ou deletar.
- [ ] Nenhum hex hardcoded restante (busca: ``grep -rn '#[0-9A-Fa-f]\{6\}' src/``).
- [ ] PHASE_2_LOG.md fechado com estado final.
"@

Write-Host ""
Write-Host "==> Pronto. 19 issues da Fase 2 criadas." -ForegroundColor Green
Write-Host "Bloco 0 (Preparacao): 5 issues" -ForegroundColor Green
Write-Host "Bloco 1 (Login/Auth): 2 issues" -ForegroundColor Green
Write-Host "Bloco 2 (Dashboard): 1 issue" -ForegroundColor Green
Write-Host "Bloco 3 (Cadastros): 4 issues" -ForegroundColor Green
Write-Host "Bloco 4 (Comunicados): 1 issue" -ForegroundColor Green
Write-Host "Bloco 5 (Portal): 1 issue" -ForegroundColor Green
Write-Host "Bloco 6 (Diario): 2 issues" -ForegroundColor Green
Write-Host "Bloco 7 (Ocorrencias): 1 issue" -ForegroundColor Green
Write-Host "Bloco 8 (Fechamento): 2 issues" -ForegroundColor Green
Write-Host ""
Write-Host "Confira com: gh issue list --label fase-2" -ForegroundColor Green
Write-Host "IMPORTANTE: substitua #UMBRELLA pelo numero real da issue 0.5 nos corpos das issues, ou nos TODOs do codigo." -ForegroundColor Yellow
