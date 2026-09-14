# Agenda Zero — Fase 2: Tasks

> Reconstrução feature a feature do front-end. Cada feature migrada vira PR `dev` → `main`, substituindo a page em produção. O banco segue mockado; remodelagem no fim.

---

## Decisões que governam esta fase

- **Entrega por feature/page.** Cada feature, ao fechar, é mergeada na `main` e substitui a tela legada em produção. O estado misto (telas novas e velhas coexistindo) é aceito.
- **Banco mockado.** `requireAuthContext()` devolve `schoolId`/`role` mockados. Toda action usa o guard e age sobre `ctx`, mas a query real contra o schema definitivo só chega na remodelagem. Cada ponto de integração leva `TODO(#UMBRELLA)` referenciando a issue guarda-chuva.
- **Storybook só para primitivos base.** Componentes de feature não ganham stories — só testes colocados e mocks.
- **Mocks em dois níveis.** Dados de domínio compartilhado (Child, School, Guardian) em `src/__mocks__/`. Dados de contrato de operação (CreateIncidentInput, etc.) em `features/{nome}/__mocks__/`.
- **Segurança embutida.** Os 7 achados críticos são aplicados dentro da feature dona, não em passo separado.
- **Limpeza incremental.** Arquivos velhos só são deletados quando confirmado via `tsc --noEmit` que nada os importa. `.examples.tsx` órfãos são limpos no bloco de preparação.

---

## Bloco 0 — Preparação

### 0.1 — Merge da fundação (Fase 1) na `main`
PR `dev` → `main` com toda a Fase 1. Varredura visual das telas que consomem primitivos alterados antes de abrir o PR. Rollback via Vercel Instant Rollback se necessário.

### 0.2 — Atualização de documentação
`MIGRATION_KICKOFF.md`: refletir decisão de Storybook (seção 5.2 diz "No Storybook", revertido na #41); remover referências a `.examples.tsx` como padrão vigente; registrar decisões novas da Fase 2 (merge por feature, mock do banco, mocks em dois níveis).
`README.md`: Next.js 16 (não 14), `PUBLISHABLE_KEY` (não `ANON_KEY`).

### 0.3 — Mocks de domínio compartilhado
Criar `src/__mocks__/` com dados base: School, Class, Child, Guardian, Staff, User. Barrel export em `index.ts`. Tipados contra `src/types/`.

### 0.4 — Limpeza de `.examples.tsx` órfãos
Deletar: `ActionButton.examples.tsx`, `AlertItem.examples.tsx`, `BottomNav.examples.tsx`, `ExpandableText.examples.tsx`, `MetricCard.examples.tsx`, `NarrativeCard.examples.tsx`. Confirmar via `tsc --noEmit` que nenhum import aponta pra eles.

### 0.5 — Issue guarda-chuva: remodelagem do banco
Issue de tracking (sem código). Existe só para que os `TODO(#N)` de cada feature apontem pra um número real. Corpo descreve o escopo: redesenho do schema, migração dos services de mock para query real, testes de integração.

---

## Bloco 1 — Login / Auth

### 1.1 — Page de login (`/login`)
Pages: `/login`, `/` (redirect).
Componentes: formulário de telefone + senha, sem modal pesado.
A tela de login já recebeu limpeza parcial de tokens na #25 (hex trocados por variáveis, radius/shadow por classes). Resta: mover lógica para `features/auth/`, criar service layer, aplicar estrutura de pastas padrão, testes.
Nota: `#FFF0E8` (gradiente) ficou sem token na #25 — resolver ou documentar como TODO.

### 1.2 — Page de convite (`/invite/[token]`)
Page standalone. Responsável recebe link, cria conta. Usa `GuardianModal.tsx` parcialmente (confirmar escopo real do componente — se ele é só do convite ou se é compartilhado com `/adm/registrations/guardians`).
Nota: `NEXT_PUBLIC_APP_URL` com fallback silencioso para `localhost:3000` (achado documentado na #23). Confirmar se está configurada no Vercel.

---

## Bloco 2 — Dashboard administrativo

### 2.1 — Dashboard adm (`/adm`)
Page provavelmente leve (menu/navegação para as sub-rotas). Migrar para `features/dashboard/` se houver lógica, ou deixar como page simples com imports de primitivos se for só layout.

---

## Bloco 3 — Cadastros

Hub: `/adm/registrations` (provavelmente navegação pura, absorvido na primeira PR do bloco).

### 3.1 — Turmas (`/adm/registrations/classrooms`)
God file: `ClassModal.tsx` (647 linhas).
Destino: `features/registrations/components/ClassModal.tsx` + hooks + service.
Componentes relacionados: `AssignmentList.tsx` (vincular professores/auxiliares a turmas — confirmar se é exclusivo daqui).
Débito conhecido: `any` nas queries do Supabase (lint travou na #27).
**Esta é a primeira feature migrada — serve como template de referência para todas as seguintes.**

### 3.2 — Crianças (`/adm/registrations/children`)
God file: `ChildModal.tsx` (547 linhas).
Destino: `features/registrations/components/ChildModal.tsx` + hooks + service.
Débito conhecido: `any` nas queries do Supabase.

### 3.3 — Responsáveis (`/adm/registrations/guardians`)
Componente: `GuardianModal.tsx`.
Destino: `features/registrations/components/GuardianModal.tsx` + hooks + service.
**Achados de segurança (3):**
- 🔴 `registerGuardian` — `ctx.schoolId`/`userId`; require admin/coordenador.
- 🔴 `verifyCpf` — aceitar `schoolId` só se `= ctx`; considerar SQL rpc.
- 🟢 `registerGuardian` — rollback completo, ou 3 inserts em 1 SQL fn via rpc.

### 3.4 — Colaboradores (`/adm/registrations/staff`)
Componente: `StaffModal.tsx`.
Destino: `features/registrations/components/StaffModal.tsx` + hooks + service.

---

## Bloco 4 — Comunicados

### 4.1 — Comunicados (`/adm/announcements` + `/guardian/child/[id]/announcements`)
God file: `announcements/page.tsx` (506 linhas).
Destino: `features/announcements/` com service layer e componentes separados.
Duas pages (adm envia, responsável lê) — mesmo feature folder, services distintos ou compartilhados conforme a lógica.
Bug real já documentado no ESLint da #18: componente recriado a cada render.
**Achado de segurança (1):**
- 🔴 `createAnnouncement` — check publisher role; usar `ctx`.

---

## Bloco 5 — Portal do responsável

### 5.1 — Portal (`/guardian`, `/guardian/child/[id]`, `/guardian/child/[id]/perfil`)
3 pages que consomem dados das features já migradas (cadastros, comunicados).
Componentes relacionados: `BottomNav.tsx` (navegação do portal — avaliar se vira primitivo compartilhado em `components/ui/` ou fica em `features/guardian/`).
`NarrativeCard.tsx` e `MetricCard.tsx` podem pertencer aqui ou ao diário (confirmar imports reais).
**Achado de segurança (médio):**
- 🟡 `guardian/child/[id]` — audit RLS; explicit guardianship check on load.

---

## Bloco 6 — Diário

### 6.1 — Diário lado adm (`/adm/dailylogs`, `/[classId]`, `/[classId]/[childId]`)
God file: `DailyLogForm.tsx` (889 linhas) — o maior do projeto.
Destino: `features/daily-logs/` com o formulário decomposto em seções (sono, alimentação, higiene, humor, observações), cada uma como componente próprio.
Issue #15 (`storage.ts` — extrair upload) é absorvida aqui se o upload de fotos pertencer ao diário.

### 6.2 — Diário lado responsável (`/guardian/child/[id]/dailylog`, `/[date]`)
Componentes: `NarrativeCard.tsx`, `TimelineItem.tsx`, `MetricCard.tsx` (se não foram absorvidos no portal).
Destino: `features/daily-logs/components/` (mesma feature, componentes de visualização).
Pendência da #27: par soft/strong para `--color-health` (Lavender) entra aqui, quando `NarrativeCard` for reconstruído para humor.

---

## Bloco 7 — Ocorrências

### 7.1 — Ocorrências (`/adm/incidents`)
God file: `incidents/page.tsx` (726 linhas).
Destino: `features/incidents/` com service layer, componentes de formulário, listagem, workflow de envio.
Bug real do ESLint (#18): funções usadas antes de declaradas dentro de efeitos (`ClassModal.tsx` — confirmar se é aqui ou em cadastros).
Issue #15 (`storage.ts`): se o upload pertencer a incidents e não ao diário, é absorvido aqui.
**Achados de segurança (4):**
- 🔴 `createIncident` — write com `ctx.schoolId`; `recordedBy = ctx.userId`.
- 🔴 `sendIncident` — fetch by id **AND** `school_id`; usar `ctx.userId`.
- 🔴 `updateIncident` — same fetch guard; `editedBy = ctx.userId`.
- 🔴 `markIncidentRead` — `ctx.userId`; validar guardianship ativa.

---

## Bloco 8 — Fechamento

### 8.1 — Varredura final
Confirmar que nenhum arquivo legado sobrou em `components/ui/` que deveria ter sido absorvido por feature. `tsc --noEmit` limpo. `npx eslint .` sem erros novos (os 62 pré-existentes da #18 devem estar resolvidos a essa altura).

### 8.2 — Primitivos remanescentes
`ActionButton.tsx`, `AlertItem.tsx`, `ExpandableText.tsx` — avaliar ao final se ainda são usados e se merecem promoção a primitivo com pasta própria + story + teste, ou se foram absorvidos/substituídos.

---

## Definition of Done — por feature migrada

- [ ] Tela reconstruída com primitivos e tokens; nenhum hex hardcoded.
- [ ] Lógica em `features/{nome}/` — `page.tsx` é orquestradora fina.
- [ ] Supabase isolado em `services/`; nenhum acesso direto em componentes.
- [ ] Toda Server Action guarded com `requireAuthContext()`; valores client-sent removidos.
- [ ] `__mocks__/` com dados tipados; domínio importado de `src/__mocks__/`.
- [ ] Testes colocados ao lado dos arquivos que testam.
- [ ] Arquivos velhos deletados só após `tsc --noEmit` confirmar zero imports.
- [ ] PR `feature/x` → `dev`; depois PR `dev` → `main` quando a page fecha.
- [ ] Pontos de integração com o banco marcados com `TODO(#UMBRELLA)`.

---

*Agenda Zero · Fase 2 Tasks · documento de planejamento — substituído pelo backlog de issues após execução do script.*
