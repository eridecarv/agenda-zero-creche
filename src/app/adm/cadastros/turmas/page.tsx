/**
 * TurmasPage — listagem e gerenciamento de turmas da escola.
 *
 * Exibe as turmas ativas da escola e permite criar, editar
 * e desativar turmas via TurmaModal (bottom sheet).
 *
 * Autenticação e escola_id delegados ao hook useEscola.
 * Toda ação de escrita (criar/editar/desativar) acontece dentro
 * do TurmaModal — esta página só controla a lista e o estado do modal.
 *
 * Rota: /adm/cadastros/turmas
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TurmaModal } from '@/components/ui/TurmaModal'
import { createClient } from '@/lib/supabase'
import { useEscola } from '@/hooks/useEscola'
import type { Turma, Turno } from '@/types'

const turnoLabels: Record<Turno, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
}

export default function TurmasPage() {
  const router = useRouter()
  const supabase = createClient()
  const { escolaId, loading } = useEscola()

  const [turmas, setTurmas] = useState<Turma[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | undefined>(undefined)

  useEffect(() => {
    if (escolaId) carregarTurmas(escolaId)
  }, [escolaId])

  async function carregarTurmas(eid: string) {
    const { data } = await supabase
      .from('turmas')
      .select('*')
      .eq('escola_id', eid)
      .eq('ativo', true)
      .order('nome')

    if (data) setTurmas(data)
  }

  function abrirNova() {
    setTurmaSelecionada(undefined)
    setModalAberto(true)
  }

  function abrirEdicao(turma: Turma) {
    setTurmaSelecionada(turma)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setTurmaSelecionada(undefined)
  }

  function aoSalvar() {
    if (escolaId) carregarTurmas(escolaId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <span className="text-sm text-[#8C7060]">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">

      {/* Header */}
      <div className="bg-[#FFFDF9] px-5 pt-12 pb-5 shadow-[0_2px_8px_rgba(180,140,120,0.08)]">
        <button
          onClick={() => router.back()}
          className="text-sm text-[#8C7060] mb-3 flex items-center gap-1"
        >
          ← Voltar
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#3A2E24]">Turmas</h1>
            <p className="text-sm text-[#8C7060] mt-0.5">
              {turmas.length} {turmas.length === 1 ? 'turma ativa' : 'turmas ativas'}
            </p>
          </div>
          <Button variant="pill" fullWidth={false} onClick={abrirNova}>
            + Nova turma
          </Button>
        </div>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-3 max-w-lg mx-auto">

        {turmas.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-[#B0A090] mb-4">Nenhuma turma cadastrada ainda.</p>
            <Button variant="primary" fullWidth={false} onClick={abrirNova}>
              Criar primeira turma
            </Button>
          </div>
        )}

        {turmas.map((turma) => (
          <Card key={turma.id} onClick={() => abrirEdicao(turma)}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-[#3A2E24]">{turma.nome}</span>
                <span className="text-xs text-[#8C7060]">
                  {[
                    turma.nivel,
                    turma.turno ? turnoLabels[turma.turno as Turno] : null,
                    turma.ano,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              <span className="text-xs text-[#8C7060]">›</span>
            </div>
          </Card>
        ))}

      </div>

      {modalAberto && escolaId && (
        <TurmaModal
          escolaId={escolaId}
          turma={turmaSelecionada}
          onClose={fecharModal}
          onSaved={aoSalvar}
        />
      )}

    </div>
  )
}