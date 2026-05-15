// src/app/responsavel/crianca/[id]/perfil/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Crianca } from '@/types/crianca'
import type { Turma } from '@/types/turma'

type Responsavel = {
  nome: string
  relacao: string
  tipo: string
}

type Colaborador = {
  nome: string
  role: string
}

const RELACAO_LABEL: Record<string, string> = {
  mae: 'Mãe', pai: 'Pai', avo: 'Avô', ava: 'Avó',
  tio: 'Tio', tia: 'Tia', outro: 'Responsável',
}

const ROLE_LABEL: Record<string, string> = {
  coordenador: 'Coordenação',
  professor: 'Professor',
  auxiliar: 'Auxiliar',
}

const ROLE_EMOJI: Record<string, string> = {
  coordenador: '👩‍💼',
  professor: '👩‍🏫',
  auxiliar: '🧑‍🤝‍🧑',
}

const NIVEL_LABEL: Record<string, string> = {
  bercario_1: 'Berçário I', bercario_2: 'Berçário II',
  maternal_1: 'Maternal I', maternal_2: 'Maternal II',
}

const TURNO_LABEL: Record<string, string> = {
  manha: 'Manhã', tarde: 'Tarde', integral: 'Integral', noite: 'Noite',
}

function calcularIdade(dataNasc: string | null): string {
  if (!dataNasc) return ''
  const nasc = new Date(dataNasc)
  const hoje = new Date()
  const meses =
    (hoje.getFullYear() - nasc.getFullYear()) * 12 +
    (hoje.getMonth() - nasc.getMonth())
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(meses / 12)
  const mesesRest = meses % 12
  if (mesesRest === 0) return `${anos} ${anos === 1 ? 'ano' : 'anos'}`
  return `${anos}a ${mesesRest}m`
}

type InfoRowProps = {
  emoji: string
  label: string
  valor: string
}

function InfoRow({ emoji, label, valor }: InfoRowProps) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-[#F0E8E0] last:border-0">
      <div className="w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center text-base bg-[#FFF0E8]">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#B0A090] mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-[#3A2E24] leading-snug">
          {valor}
        </p>
      </div>
    </div>
  )
}

export default function PerfilPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [crianca, setCrianca] = useState<Crianca | null>(null)
  const [turma, setTurma] = useState<Turma | null>(null)
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Criança
      const { data: c } = await supabase
        .from('criancas')
        .select('*')
        .eq('id', id)
        .single()

      if (!c) { router.push('/responsavel'); return }
      setCrianca(c)

      // Turma atual
      const { data: ct } = await supabase
        .from('crianca_turma')
        .select('turma_id, turmas(*)')
        .eq('crianca_id', id)
        .is('data_fim', null)
        .single()

      const turmaAtual = ct ? (ct as any).turmas as Turma : null
      if (turmaAtual) setTurma(turmaAtual)

      // Responsáveis — busca separada para evitar bloqueio de RLS no join
      const { data: vinculos } = await supabase
        .from('vinculos')
        .select('tipo, relacao, usuario_id')
        .eq('crianca_id', id)
        .eq('ativo', true)
        .is('data_fim', null)

      if (vinculos && vinculos.length > 0) {
        const ids = vinculos.map((v: any) => v.usuario_id)
        const { data: usuarios } = await supabase
          .from('usuarios')
          .select('id, nome')
          .in('id', ids)

        if (usuarios) {
          setResponsaveis(vinculos.map((v: any) => {
            const u = usuarios.find((u: any) => u.id === v.usuario_id)
            return {
              nome: u?.nome ?? '—',
              relacao: v.relacao ?? 'outro',
              tipo: v.tipo,
            }
          }))
        }
      }

      // Equipe da turma
      if (ct?.turma_id) {
        const { data: equipe } = await supabase
          .from('turma_colaborador')
          .select('usuario_id, usuarios(nome, role)')
          .eq('turma_id', ct.turma_id)
          .is('removido_em', null)

        if (equipe) {
          setColaboradores(equipe.map((e: any) => ({
            nome: e.usuarios?.nome ?? '—',
            role: e.usuarios?.role ?? '',
          })))
        }
      }

      setLoading(false)
    }
    init()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <span className="text-sm text-[#8C7060]">Carregando...</span>
      </div>
    )
  }

  if (!crianca) return null

  const descTurma = turma
    ? [turma.nome, turma.nivel ? NIVEL_LABEL[turma.nivel] ?? turma.nivel : null]
        .filter(Boolean).join(' · ')
    : 'Sem turma'

  const descTurno = turma?.turno ? TURNO_LABEL[turma.turno] : '—'

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-8">

      {/* Header */}
      <div className="px-5 pt-12 pb-8 bg-gradient-to-br from-[#FFF0E8] to-[#EAF3DE]">
        <div className="flex flex-col items-center gap-3 max-w-lg mx-auto">
          <Avatar nome={crianca.nome} tamanho="lg" />
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-[#3A2E24]">
              {crianca.nome}
            </h1>
            {crianca.data_nascimento && (
              <p className="text-sm text-[#8C7060] mt-0.5">
                {calcularIdade(crianca.data_nascimento)}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {turma && (
              <Badge label={turma.nome} color="#EAF3DE" textColor="#3A7A42" />
            )}
            {turma?.nivel && (
              <Badge
                label={NIVEL_LABEL[turma.nivel] ?? turma.nivel}
                color="#FFF0E8"
                textColor="#C05A2A"
              />
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-5 pt-6 max-w-lg mx-auto flex flex-col gap-4">

        {/* Turma */}
        <Card padding="lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#B0A090] mb-1">
            Turma
          </p>
          <InfoRow emoji="🏫" label="Turma" valor={descTurma} />
          <InfoRow emoji="🕐" label="Turno" valor={descTurno} />
        </Card>

        {/* Família */}
        <Card padding="lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#B0A090] mb-1">
            Família
          </p>
          {responsaveis.length === 0 ? (
            <InfoRow emoji="👨‍👩‍👧" label="Responsáveis" valor="—" />
          ) : (
            responsaveis.map((r, i) => (
              <InfoRow
                key={i}
                emoji={r.tipo === 'principal' ? '👩‍👧' : '👤'}
                label={RELACAO_LABEL[r.relacao] ?? 'Responsável'}
                valor={r.nome}
              />
            ))
          )}
        </Card>

        {/* Equipe */}
        {colaboradores.length > 0 && (
          <Card padding="lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#B0A090] mb-1">
              Equipe
            </p>
            {colaboradores.map((c, i) => (
              <InfoRow
                key={i}
                emoji={ROLE_EMOJI[c.role] ?? '👤'}
                label={ROLE_LABEL[c.role] ?? c.role}
                valor={c.nome}
              />
            ))}
          </Card>
        )}

        {/* Saúde */}
        <Card padding="lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#B0A090] mb-1">
            Saúde
          </p>
          <InfoRow
            emoji="💊"
            label="Observações"
            valor={crianca.observacoes || 'Nenhuma restrição registrada'}
          />
        </Card>

      </div>
    </div>
  )
}