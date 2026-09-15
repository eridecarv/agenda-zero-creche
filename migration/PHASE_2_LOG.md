# Agenda Zero — Log da Fase 2

> Registro cronológico do trabalho realizado desde o planejamento da Fase 2 (`PHASE_2_TASKS.md`) até o fechamento de cada bloco. Segue o mesmo formato do `PHASE_1_LOG.md`.

---

## 1. Bloco 0 — Preparação (#50 – #54)

### #50 — Merge da fundação (Fase 1) na `main` (concluída)

- Varredura visual feita antes do PR: login, dashboard adm, cadastro de crianças e diário do responsável conferidos — Button, Input, Card, Chip consistentes com o Design Guidelines v1.0.
- `npm run typecheck` limpo.
- `npm run test:coverage`: 110 testes, 17 arquivos, todos passando (mesmo número do fechamento da #27).
- PR #68 aberto (`dev` → `main`, 32 commits). Merge exigiu bypass da proteção de branch — nenhum reviewer disponível num repositório solo — via "Merge without waiting for requirements to be met (bypass rules)".
- **Aprendizado técnico — merge via "bypass rules" não disparou deploy automático no Vercel.** Depois do merge, o commit `bc56492` não apareceu na lista de Deployments (nem como Ready, nem Building, nem Error) mesmo com a integração GitHub↔Vercel íntegra (GitHub App instalado, permissões corretas, `deployment_status` habilitado, nenhum Ignored Build Step customizado). Um push trivial subsequente, direto na `main` (sem PR), disparou o deploy normalmente. Causa raiz não confirmada — hipótese: o evento de merge via bypass não é emitido da mesma forma que um merge normal para o webhook do GitHub App. **Contorno adotado:** após qualquer merge que exija bypass, checar a aba Deployments do Vercel; se o deploy não aparecer em ~1 minuto, um push pequeno e trivial na mesma branch força o disparo. Revisitar se o padrão se repetir nos merges de feature da Fase 2.
- Deploy de produção confirmado ativo (`Ready` / `Production`) após o push de contorno.

---

*Agenda Zero · Fase 2 Log · documento vivo — atualizado ao final de cada issue.*
