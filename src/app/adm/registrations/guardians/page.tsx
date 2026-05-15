/**
 * ResponsaveisPage — listagem de responsáveis cadastrados.
 *
 * Exibe os responsáveis ativos da escola com suas crianças vinculadas.
 * Permite cadastrar novo responsável ou vincular existente via modal.
 *
 * Rota: /adm/cadastros/responsaveis
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ResponsavelModal } from '@/components/ui/ResponsavelModal'
import { createClient } from '@/lib/supabase'
import { useEscola } from '@/hooks/useEscola'

type ResponsavelComCriancas = {
  id: string
  nome: string
  telefone: string | null
  criancas: string[]    // nomes das crianças vinculadas
  temConvitePendente: boolean
}

export default function ResponsaveisPage() {
  const router = useRouter()
  const supabase = createClient()
  const { escolaId, usuarioId, loading } = useEscola()

  const [responsaveis, setResponsaveis] = useState<ResponsavelComCriancas[]>([])
  const [modalAberto, setModalAberto] = useState(false)

  useEffect(() => {
    if (escolaId) carregarResponsaveis(escolaId)
  }, [escolaId])

  async function carregarResponsaveis(eid: string) {
    const { data } = await supabase
      .from('usuarios')
      .select(`
        id, nome, telefone,
        vinculos (
          crianca_id,
          data_fim,
          criancas ( nome )
        ),
        convites (
          usado_em,
          expira_em
        )
      `)
      .eq('escola_id', eid)
      .eq('role', 'responsavel')
      .eq('ativo', true)
      .order('nome')

    if (data) {
      const formatados: ResponsavelComCriancas[] = data.map((r: any) => {
        const criancas = r.vinculos
          ?.filter((v: any) => v.data_fim === null)
          .map((v: any) => v.criancas?.nome)
          .filter(Boolean) ?? []

        const temConvitePendente = r.convites?.some(
          (c: any) => !c.usado_em && new Date(c.expira_em) > new Date()
        ) ?? false

        return {
          id: r.id,
          nome: r.nome,
          telefone: r.telefone,
          criancas,
          temConvitePendente,
        }
      })
      setResponsaveis(formatados)
    }
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
            <h1 className="font-display text-2xl font-bold text-[#3A2E24]">Responsáveis</h1>
            <p className="text-sm text-[#8C7060] mt-0.5">
              {responsaveis.length} {responsaveis.length === 1 ? 'responsável ativo' : 'responsáveis ativos'}
            </p>
          </div>
          <Button variant="pill" fullWidth={false} onClick={() => setModalAberto(true)}>
            + Novo
          </Button>
        </div>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-3 max-w-lg mx-auto">

        {responsaveis.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-[#B0A090] mb-4">Nenhum responsável cadastrado ainda.</p>
            <Button variant="primary" fullWidth={false} onClick={() => setModalAberto(true)}>
              Cadastrar primeiro responsável
            </Button>
          </div>
        )}

        {responsaveis.map((r) => (
          <Card key={r.id}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-[#3A2E24]">{r.nome}</span>
                <span className="text-xs text-[#8C7060]">
                  {r.criancas.length > 0
                    ? r.criancas.join(', ')
                    : 'Sem criança vinculada'
                  }
                </span>
                {r.temConvitePendente && (
                  <span className="text-xs text-[#F5C632] mt-0.5">⏳ Convite pendente</span>
                )}
              </div>
            </div>
          </Card>
        ))}

      </div>

      {modalAberto && escolaId && usuarioId && (
        <ResponsavelModal
          escolaId={escolaId}
          usuarioId={usuarioId}
          onClose={() => setModalAberto(false)}
          onSaved={() => carregarResponsaveis(escolaId)}
        />
      )}

    </div>
  )
}