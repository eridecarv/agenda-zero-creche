/**
 * CriancasPage — listagem e gerenciamento de crianças.
 *
 * Exibe as crianças ativas da escola com turma atual e
 * permite criar, editar e desativar via CriancaModal.
 *
 * Autenticação e escola_id delegados ao hook useEscola.
 * Toda ação de escrita acontece dentro do CriancaModal.
 *
 * Rota: /adm/cadastros/criancas
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CriancaModal } from '@/components/ui/CriancaModal'
import { createClient } from '@/lib/supabase'
import { useEscola } from '@/hooks/useEscola'
import type { Crianca } from '@/types'

// ── Tipo local com turma atual ────────────────────────────────
type CriancaComTurma = Crianca & {
  turma_nome: string | null
}

// ── Calcula idade ─────────────────────────────────────────────
function calcularIdade(dataNasc: string | null): string {
  if (!dataNasc) return ''
  const nasc = new Date(dataNasc)
  const hoje = new Date()
  const meses =
    (hoje.getFullYear() - nasc.getFullYear()) * 12 +
    (hoje.getMonth() - nasc.getMonth())
  if (meses < 12) return `${meses}m`
  const anos = Math.floor(meses / 12)
  const mesesRest = meses % 12
  return mesesRest > 0 ? `${anos}a ${mesesRest}m` : `${anos}a`
}

export default function CriancasPage() {
  const router = useRouter()
  const supabase = createClient()
  const { escolaId,usuarioId, loading } = useEscola()

  const [criancas, setCriancas] = useState<CriancaComTurma[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [criancaSelecionada, setCriancaSelecionada] = useState<Crianca | undefined>(undefined)

  useEffect(() => {
    if (escolaId) carregarCriancas(escolaId)
  }, [escolaId])

  async function carregarCriancas(eid: string) {
    const { data } = await supabase
      .from('criancas')
      .select(`
        *,
        crianca_turma!left (
          data_fim,
          turmas ( nome )
        )
      `)
      .eq('escola_id', eid)
      .eq('ativo', true)
      .order('nome')

    if (data) {
      const formatadas: CriancaComTurma[] = data.map((c: any) => {
        const vinculoAtivo = c.crianca_turma?.find((ct: any) => ct.data_fim === null)
        return {
          ...c,
          turma_nome: vinculoAtivo?.turmas?.nome ?? null,
          crianca_turma: undefined,
        }
      })
      setCriancas(formatadas)
    }
  }

  function abrirNova() {
    setCriancaSelecionada(undefined)
    setModalAberto(true)
  }

  function abrirEdicao(crianca: Crianca) {
    setCriancaSelecionada(crianca)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setCriancaSelecionada(undefined)
  }

  function aoSalvar() {
    if (escolaId) carregarCriancas(escolaId)
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
            <h1 className="font-display text-2xl font-bold text-[#3A2E24]">Crianças</h1>
            <p className="text-sm text-[#8C7060] mt-0.5">
              {criancas.length} {criancas.length === 1 ? 'criança ativa' : 'crianças ativas'}
            </p>
          </div>
          <Button variant="pill" fullWidth={false} onClick={abrirNova}>
            + Nova
          </Button>
        </div>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-3 max-w-lg mx-auto">

        {criancas.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-[#B0A090] mb-4">Nenhuma criança cadastrada ainda.</p>
            <Button variant="primary" fullWidth={false} onClick={abrirNova}>
              Cadastrar primeira criança
            </Button>
          </div>
        )}

        {criancas.map((crianca) => (
          <Card key={crianca.id} onClick={() => abrirEdicao(crianca)}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-[#3A2E24]">{crianca.nome}</span>
                <span className="text-xs text-[#8C7060]">
                  {[
                    calcularIdade(crianca.data_nascimento),
                    crianca.turma_nome ?? 'Sem turma',
                  ].filter(Boolean).join(' · ')}
                </span>
                {crianca.observacoes && (
                  <span className="text-xs text-[#E86C88] mt-0.5">⚠ {crianca.observacoes}</span>
                )}
              </div>
              <span className="text-xs text-[#8C7060]">›</span>
            </div>
          </Card>
        ))}

      </div>

      {modalAberto && escolaId && usuarioId && (
        <CriancaModal
          escolaId={escolaId}
          usuarioId={usuarioId}
          crianca={criancaSelecionada}
          onClose={fecharModal}
          onSaved={aoSalvar}
        />
      )}

    </div>
  )
}