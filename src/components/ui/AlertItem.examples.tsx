/**
 * AlertItem — exemplos de uso
 *
 * Este arquivo documenta todos os casos de uso do componente AlertItem.
 * Não é importado em nenhuma página — serve como referência para
 * quem for usar ou manter o componente.
 */

import { AlertItem } from './AlertItem'

export function AlertItemExamples() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 24 }}>
      {/* ── Ocorrências pendentes ── */}
      <AlertItem title="Ocorrências pendentes" subtitle="2 aguardando validação" color="#E86C88">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>Sofia — Machucado leve</p>
              <p style={{ margin: 0, fontSize: 11, color: '#8C7060' }}>Profa. Ana · hoje 10:35</p>
            </div>
            <span style={{ fontSize: 12, color: '#5A8ED6', cursor: 'pointer' }}>Revisar →</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>Lucas — Febre</p>
              <p style={{ margin: 0, fontSize: 11, color: '#8C7060' }}>Profa. Bia · hoje 08:50</p>
            </div>
            <span style={{ fontSize: 12, color: '#5A8ED6', cursor: 'pointer' }}>Revisar →</span>
          </div>
        </div>
      </AlertItem>

      {/* ── Justificativas de falta ── */}
      <AlertItem title="Justificativas de falta" subtitle="3 recebidas hoje" color="#F5C632">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 12 }}>Pedro — Turma Borboleta</p>
            <span style={{ fontSize: 11, color: '#8C7060' }}>gripe</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 12 }}>Ana Clara — Turma Sol</p>
            <span style={{ fontSize: 11, color: '#8C7060' }}>consulta</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 12 }}>Theo — Turma Girassol</p>
            <span style={{ fontSize: 11, color: '#8C7060' }}>sem motivo</span>
          </div>
        </div>
      </AlertItem>

      {/* ── Novos responsáveis ── */}
      <AlertItem title="Novos responsáveis" subtitle="1 aguardando acesso" color="#5A8ED6">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 12,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>Carla Mendes</p>
            <p style={{ margin: 0, fontSize: 11, color: '#8C7060' }}>
              resp. de Miguel · convite não enviado
            </p>
          </div>
          <span style={{ fontSize: 12, color: '#5A8ED6', cursor: 'pointer' }}>Enviar →</span>
        </div>
      </AlertItem>

      {/* ── Sem conteúdo expandido ── */}
      <AlertItem title="Sem itens pendentes" subtitle="Tudo em dia ✓" color="#72AA78" />
    </div>
  )
}
