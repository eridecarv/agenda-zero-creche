// src/app/responsavel/crianca/[id]/diario/[data]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ExpandableText } from '@/components/ui/ExpandableText'
import { Card } from '@/components/ui/Card'
import type { Humor, Sono, Refeicao, Aceitacao } from '@/types'

// ── Templates (mesmos da home) ────────────────────────────

const HUMOR_TEMPLATES: Record<Humor, string[]> = {
  contente: ['ficou contente o dia todo', 'estava bem-humorada'],
  tranquilo: ['passou o dia tranquila', 'ficou calma e serena'],
  agitado: ['ficou um pouco agitada hoje', 'teve um dia mais agitado'],
  choroso: ['teve um dia mais difícil', 'ficou chorosa durante o dia'],
}

const SONO_TEMPLATES: Record<Sono, string[]> = {
  bom: ['descansou bem no horário', 'dormiu direitinho'],
  regular: ['dormiu um pouco', 'o soninho foi tranquilo'],
  ruim: ['teve dificuldade para dormir', 'dormiu mal hoje'],
  nao_dormiu: ['não conseguiu dormir hoje', 'ficou sem dormir'],
}

const ACEITACAO_TEMPLATES: Record<Aceitacao, string[]> = {
  boa: ['comeu bem', 'aceitou bem as refeições'],
  regular: ['comeu razoavelmente', 'aceitou parcialmente as refeições'],
  recusou: ['não quis comer muito hoje', 'teve pouco apetite'],
}

const REFEICAO_LABEL: Record<Refeicao, string> = {
  cafe: 'Café da manhã',
  lanche_manha: 'Lanche da manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da tarde',
  jantar: 'Jantar',
}

const ACEITACAO_ESTILO: Record<Aceitacao, { bg: string; text: string; label: string }> = {
  boa:     { bg: '#EAF3DE', text: '#4A7A3A', label: 'Comeu bem' },
  regular: { bg: '#FEF6E4', text: '#9A6F2A', label: 'Razoável' },
  recusou: { bg: '#FDE8EC', text: '#A03050', label: 'Recusou' },
}

function sorteia<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ── Tipos ─────────────────────────────────────────────────

type RegistroDia = {
  id: string
  humor: Humor | null
  humor_obs: string | null
  sono: Sono | null
  sono_obs: string | null
  presente: boolean | null
  saida: string | null
  buscou_nome: string | null
  alimentacao: { refeicao: Refeicao; aceitacao: Aceitacao; observacao: string | null }[]
  higiene: { banho: boolean; escovacao: boolean; evacuacao: boolean; observacao: string | null } | null
}

// ── Subcomponentes ────────────────────────────────────────

function Chip({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span
      style={{ backgroundColor: bg, color: text }}
      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium"
    >
      {label}
    </span>
  )
}

function SecaoTitulo({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#C4A882' }} className="text-xs font-medium mb-3">{children}</p>
}

function Divisor() {
  return <div style={{ height: '0.5px', backgroundColor: '#C4A882', opacity: 0.25, margin: '10px 0' }} />
}

function TextoPrincipal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p style={{ color: '#A08060' }} className={`text-sm leading-relaxed ${className}`}>{children}</p>
  )
}

function TextoSecundario({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p style={{ color: '#C4A882' }} className={`text-xs leading-relaxed ${className}`}>{children}</p>
  )
}

function fraseHigiene(h: RegistroDia['higiene']): string {
  if (!h) return ''
  const feitos: string[] = []
  if (h.banho) feitos.push('tomou banho')
  if (h.escovacao) feitos.push('escovou os dentinhos')
  if (h.evacuacao) feitos.push('fez xixi e cocô')
  if (feitos.length === 0) return 'Nenhum cuidado registrado.'
  const primeiro = feitos[0].charAt(0).toUpperCase() + feitos[0].slice(1)
  if (feitos.length === 1) return `${primeiro}.`
  const resto = feitos.slice(1)
  const ultimo = resto.pop()
  return resto.length > 0
    ? `${primeiro}, ${resto.join(', ')} e ${ultimo}.`
    : `${primeiro} e ${ultimo}.`
}

function formatarDataLonga(dataStr: string): string {
  const [ano, mes, dia] = dataStr.split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Componente principal ──────────────────────────────────

export default function DiarioDetalheDataPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const data = params.data as string  // 'YYYY-MM-DD'
  const supabase = createClient()

  const [nomeCrianca, setNomeCrianca] = useState('')
  const [registro, setRegistro] = useState<RegistroDia | null>(null)
  const [loading, setLoading] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: c } = await supabase
        .from('criancas').select('nome').eq('id', id).single()
      if (c) setNomeCrianca(c.nome.split(' ')[0])

      const { data: rd } = await supabase
        .from('registros_diarios')
        .select('id, humor, humor_obs, sono, sono_obs')
        .eq('crianca_id', id)
        .eq('data', data)
        .single()

      if (!rd) { setNaoEncontrado(true); setLoading(false); return }

      const { data: rp } = await supabase
        .from('registros_presenca')
        .select('presente, saida, buscou_id')
        .eq('registro_diario_id', rd.id)
        .single()

      const { data: ras } = await supabase
        .from('registros_alimentacao')
        .select('refeicao, aceitacao, observacao')
        .eq('registro_diario_id', rd.id)

      const { data: rh } = await supabase
        .from('registros_higiene')
        .select('banho, escovacao, evacuacao, observacao')
        .eq('registro_diario_id', rd.id)
        .single()

      let buscouNome: string | null = null
      if (rp?.buscou_id) {
        const { data: vinculo } = await supabase
          .from('vinculos')
          .select('apelido, usuarios(nome)')
          .eq('crianca_id', id)
          .eq('usuario_id', rp.buscou_id)
          .single()
        buscouNome = vinculo?.apelido ?? (vinculo as any)?.usuarios?.nome ?? null
      }

      setRegistro({
        id: rd.id,
        humor: rd.humor,
        humor_obs: rd.humor_obs,
        sono: rd.sono,
        sono_obs: rd.sono_obs,
        presente: rp?.presente ?? null,
        saida: rp?.saida ?? null,
        buscou_nome: buscouNome,
        alimentacao: ras ?? [],
        higiene: rh ?? null,
      })

      setLoading(false)
    }
    carregar()
  }, [id, data])

  function montarNarrativa(): React.ReactNode {
    if (!registro) return null
    const nome = nomeCrianca
    const partes: React.ReactNode[] = []

    if (registro.humor) {
      const template = sorteia(HUMOR_TEMPLATES[registro.humor])
      partes.push(
        registro.humor_obs
          ? <ExpandableText key="humor" texto={template} detalhe={registro.humor_obs} />
          : <span key="humor">{template}</span>
      )
    }

    const almoco = registro.alimentacao.find(r => r.refeicao === 'almoco')
    const refPrincipal = almoco ?? registro.alimentacao[0]
    if (refPrincipal) {
      const template = sorteia(ACEITACAO_TEMPLATES[refPrincipal.aceitacao])
      partes.push(
        refPrincipal.observacao
          ? <ExpandableText key="alimentacao" texto={template} detalhe={refPrincipal.observacao} />
          : <span key="alimentacao">{template}</span>
      )
    }

    if (registro.sono) {
      const template = sorteia(SONO_TEMPLATES[registro.sono])
      partes.push(
        registro.sono_obs
          ? <ExpandableText key="sono" texto={template} detalhe={registro.sono_obs} />
          : <span key="sono">{template}</span>
      )
    }

    if (partes.length === 0) return `${nome} teve seu dia registrado.`

    return (
      <>
        {nome}{' '}
        {partes.map((p, i) => (
          <span key={i}>
            {p}
            {i < partes.length - 2 ? ', ' : i === partes.length - 2 ? ' e ' : '.'}
          </span>
        ))}
      </>
    )
  }

  function montarChips() {
    if (!registro) return []
    const chips: { label: string; bg: string; text: string }[] = []

    if (registro.presente === false) {
      chips.push({ label: 'Faltou', bg: '#FDE8EC', text: '#A03050' })
    } else if (registro.presente === true) {
      chips.push({ label: 'Presente', bg: '#EAF3DE', text: '#4A7A3A' })
    }

    if (registro.sono) {
      const sonoLabel: Record<Sono, string> = {
        bom: 'Dormiu bem', regular: 'Dormiu um pouco',
        ruim: 'Dormiu mal', nao_dormiu: 'Não dormiu',
      }
      const sonoCor: Record<Sono, { bg: string; text: string }> = {
        bom:        { bg: '#EEF0FE', text: '#4A4AAA' },
        regular:    { bg: '#FEF6E4', text: '#9A6F2A' },
        ruim:       { bg: '#FDE8EC', text: '#A03050' },
        nao_dormiu: { bg: '#F5EFE8', text: '#8C7060' },
      }
      chips.push({ label: sonoLabel[registro.sono], ...sonoCor[registro.sono] })
    }

    if (registro.higiene) {
      const feitos = [registro.higiene.banho, registro.higiene.escovacao, registro.higiene.evacuacao]
        .filter(Boolean).length
      if (feitos > 0) chips.push({ label: 'Cuidados feitos', bg: '#FEF0E8', text: '#9A5A2A' })
    }

    return chips
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <span style={{ color: '#C4A882' }} className="text-sm">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-8">
      {/* Header com botão voltar */}
      <div className="bg-[#FFFDF9] px-5 pt-12 pb-6 shadow-[0_2px_8px_rgba(180,140,120,0.06)]">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 mb-3"
          style={{ color: '#C4A882' }}
        >
          <span className="text-sm">‹</span>
          <span className="text-xs">Voltar</span>
        </button>
        <p style={{ color: '#C4A882' }} className="text-xs capitalize mb-1">
          {formatarDataLonga(data)}
        </p>
        <h1 style={{ color: '#A08060' }} className="font-display text-2xl font-bold">
          O dia de {nomeCrianca}
        </h1>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto flex flex-col gap-4">

        {/* Sem registro */}
        {naoEncontrado && (
          <Card padding="lg">
            <div className="flex flex-col items-center text-center py-8 gap-3">
              <div className="w-16 h-16 rounded-full bg-[#F5EFE8] flex items-center justify-center text-3xl">📋</div>
              <p style={{ color: '#A08060' }} className="text-base font-semibold">
                Nenhum registro encontrado
              </p>
              <p style={{ color: '#C4A882' }} className="text-sm leading-relaxed">
                Não há informações registradas para este dia.
              </p>
            </div>
          </Card>
        )}

        {/* Narrativa + chips */}
        {registro && (
          <Card padding="lg">
            <TextoPrincipal className="mb-4">{montarNarrativa()}</TextoPrincipal>

            {/* Saída — sempre encerrado no histórico */}
            {registro.saida && (
              <div
                className="flex items-center gap-2 rounded-[12px] px-3 py-2 mb-4"
                style={{ backgroundColor: '#F5EFE8' }}
              >
                <span className="text-base">👋</span>
                <TextoSecundario>
                  Saiu às{' '}
                  {new Date(registro.saida).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Recife',
                  })}
                  {registro.buscou_nome ? ` com ${registro.buscou_nome}` : ''}
                </TextoSecundario>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {montarChips().map((chip, i) => <Chip key={i} {...chip} />)}
            </div>
          </Card>
        )}

        {/* Alimentação */}
        {registro && registro.alimentacao.length > 0 && (
          <Card padding="lg">
            <SecaoTitulo>O que comeu</SecaoTitulo>
            <div className="flex flex-col">
              {registro.alimentacao.map((r, i) => {
                const estilo = ACEITACAO_ESTILO[r.aceitacao]
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between py-1">
                      <TextoPrincipal>{REFEICAO_LABEL[r.refeicao]}</TextoPrincipal>
                      <span
                        style={{ backgroundColor: estilo.bg, color: estilo.text }}
                        className="text-xs font-medium px-3 py-1 rounded-full"
                      >
                        {estilo.label}
                      </span>
                    </div>
                    {r.observacao && <TextoSecundario className="pb-1">{r.observacao}</TextoSecundario>}
                    {i < registro.alimentacao.length - 1 && <Divisor />}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Higiene */}
        {registro?.higiene && (registro.higiene.banho || registro.higiene.escovacao || registro.higiene.evacuacao) && (
          <Card padding="lg">
            <SecaoTitulo>Cuidados do dia</SecaoTitulo>
            <TextoPrincipal>{fraseHigiene(registro.higiene)}</TextoPrincipal>
            {registro.higiene.observacao && (
              <><Divisor /><TextoSecundario>{registro.higiene.observacao}</TextoSecundario></>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}