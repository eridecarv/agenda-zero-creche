/**
 * ColaboradoresPage — listagem e gerenciamento de colaboradores.
 *
 * Exibe os colaboradores ativos da escola e permite criar, editar
 * e desativar via ColaboradorModal (bottom sheet).
 *
 * Autenticação e escola_id delegados ao hook useEscola.
 * Toda ação de escrita acontece dentro do ColaboradorModal.
 *
 * Rota: /adm/cadastros/colaboradores
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ColaboradorModal } from '@/components/ui/ColaboradorModal'
import { createClient } from '@/lib/supabase'
import { useEscola } from '@/hooks/useEscola'
import type { Usuario, Role } from '@/types'

const roleLabels: Record<Role, string> = {
  adm: 'Administrador',
  coordenador: 'Coordenador(a)',
  professor: 'Professor(a)',
  auxiliar: 'Assistente',
  responsavel: 'Responsável',
}

export default function ColaboradoresPage() {
  const router = useRouter()
  const supabase = createClient()
  const { escolaId, loading } = useEscola()

  const [colaboradores, setColaboradores] = useState<Usuario[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<Usuario | undefined>(undefined)

  useEffect(() => {
    if (escolaId) carregarColaboradores(escolaId)
  }, [escolaId])

  async function carregarColaboradores(eid: string) {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('escola_id', eid)
      .eq('ativo', true)
      .in('role', ['coordenador', 'professor', 'auxiliar'])
      .order('nome')

    if (data) setColaboradores(data)
  }

  function abrirNovo() {
    setColaboradorSelecionado(undefined)
    setModalAberto(true)
  }

  function abrirEdicao(colaborador: Usuario) {
    setColaboradorSelecionado(colaborador)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setColaboradorSelecionado(undefined)
  }

  function aoSalvar() {
    if (escolaId) carregarColaboradores(escolaId)
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
            <h1 className="font-display text-2xl font-bold text-[#3A2E24]">Colaboradores</h1>
            <p className="text-sm text-[#8C7060] mt-0.5">
              {colaboradores.length} {colaboradores.length === 1 ? 'colaborador ativo' : 'colaboradores ativos'}
            </p>
          </div>
          <Button variant="pill" fullWidth={false} onClick={abrirNovo}>
            + Novo
          </Button>
        </div>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-3 max-w-lg mx-auto">

        {colaboradores.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-[#B0A090] mb-4">Nenhum colaborador cadastrado ainda.</p>
            <Button variant="primary" fullWidth={false} onClick={abrirNovo}>
              Cadastrar primeiro colaborador
            </Button>
          </div>
        )}

        {colaboradores.map((colaborador) => (
          <Card key={colaborador.id} onClick={() => abrirEdicao(colaborador)}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-[#3A2E24]">
                  {colaborador.apelido || colaborador.nome.split(' ')[0]}
                </span>
                <span className="text-xs text-[#8C7060]">
                  {colaborador.nome} · {roleLabels[colaborador.role]}
                </span>
              </div>
              <span className="text-xs text-[#8C7060]">›</span>
            </div>
          </Card>
        ))}

      </div>

      {modalAberto && escolaId && (
        <ColaboradorModal
          escolaId={escolaId}
          colaborador={colaboradorSelecionado}
          onClose={fecharModal}
          onSaved={aoSalvar}
        />
      )}

    </div>
  )
}