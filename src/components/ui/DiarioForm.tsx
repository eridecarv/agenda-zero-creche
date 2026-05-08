/**
 * DiarioForm — formulário de registro diário de uma criança.
 *
 * Reutilizável por adm e professor. Recebe crianca_id e data,
 * carrega o registro existente (se houver) e permite registrar
 * ou atualizar presença, humor, sono, alimentação, higiene e recado.
 *
 * Estrutura em acordeão — cada seção expande ao clicar.
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type {
  Humor,
  Sono,
  Refeicao,
  Aceitacao,
} from '@/types'

// ── Helpers ──────────────────────────────────────────────

const HUMOR_OPTIONS: { value: Humor; label: string; emoji: string }[] = [
  { value: 'contente',   label: 'Contente',   emoji: '😄' },
  { value: 'tranquilo',  label: 'Tranquilo',  emoji: '😌' },
  { value: 'agitado',    label: 'Agitado',    emoji: '😤' },
  { value: 'choroso',    label: 'Choroso',    emoji: '😢' },
]

const SONO_OPTIONS: { value: Sono; label: string; emoji: string }[] = [
  { value: 'bom',        label: 'Bom',        emoji: '😴' },
  { value: 'regular',    label: 'Regular',    emoji: '😐' },
  { value: 'ruim',       label: 'Ruim',       emoji: '😩' },
  { value: 'nao_dormiu', label: 'Não dormiu', emoji: '👀' },
]

const REFEICAO_OPTIONS: { value: Refeicao; label: string; emoji: string }[] = [
  { value: 'cafe',         label: 'Café da manhã', emoji: '☕' },
  { value: 'lanche_manha', label: 'Lanche manhã',  emoji: '🍎' },
  { value: 'almoco',       label: 'Almoço',        emoji: '🍽️' },
  { value: 'lanche_tarde', label: 'Lanche tarde',  emoji: '🧃' },
  { value: 'jantar',       label: 'Jantar',        emoji: '🌙' },
]

const ACEITACAO_OPTIONS: { value: Aceitacao; label: string; color: string }[] = [
  { value: 'boa',     label: 'Boa',     color: '#72AA78' },
  { value: 'regular', label: 'Regular', color: '#F5C632' },
  { value: 'recusou', label: 'Recusou', color: '#E86C88' },
]

// ── Subcomponentes ────────────────────────────────────────

function Secao({
  titulo,
  emoji,
  aberta,
  onToggle,
  children,
  completa,
}: {
  titulo: string
  emoji: string
  aberta: boolean
  onToggle: () => void
  children: React.ReactNode
  completa?: boolean
}) {
  return (
    <Card padding="lg" className="overflow-hidden !p-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{emoji}</span>
          <span className="text-sm font-semibold text-[#3A2E24]">{titulo}</span>
          {completa && (
            <span className="text-xs text-[#72AA78] font-medium">✓</span>
          )}
        </div>
        <span className={`text-[#C8B8A8] transition-transform duration-200 ${aberta ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {aberta && (
        <div className="px-5 pb-5 border-t border-[#F0E8E0] pt-5">
          {children}
        </div>
      )}
    </Card>
  )
}

function OpcaoPill({
  label,
  emoji,
  selecionado,
  onClick,
  cor,
}: {
  label: string
  emoji?: string
  selecionado: boolean
  onClick: () => void
  cor?: string
}) {
  return (
    <Button
      variant="pill"
      fullWidth={false}
      onClick={onClick}
      customColor={selecionado ? (cor ?? '#FF8C66') : undefined}
      customTextColor={selecionado ? '#ffffff' : '#8C7060'}
      style={!selecionado ? { backgroundColor: '#F5EFE8' } : undefined}
    >
      {emoji && <span className="mr-1">{emoji}</span>}
      {label}
    </Button>
  )
}

function CampoObservacao({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="mt-3">
      <p className="text-xs text-[#B0A090] mb-1">Observação opcional</p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="
          w-full rounded-[14px] bg-[#F5EFE8] px-4 py-3
          text-sm text-[#3A2E24] placeholder-[#C8B8A8]
          focus:outline-none focus:ring-2 focus:ring-[#FF8C66]/30
          resize-none
        "
      />
    </div>
  )
}

// ── Tipos internos ────────────────────────────────────────

type RefeicaoState = {
  aceitacao: Aceitacao | null
  observacao: string
}

type AlimentacaoState = Record<Refeicao, RefeicaoState>

type HigieneState = {
  banho: boolean
  escovacao: boolean
  evacuacao: boolean
  observacao: string
}

type Props = {
  criancaId: string
  escolaId: string
  data: string
  registradoPor: string
  onSalvo?: () => void
}

const alimentacaoInicial: AlimentacaoState = {
  cafe:         { aceitacao: null, observacao: '' },
  lanche_manha: { aceitacao: null, observacao: '' },
  almoco:       { aceitacao: null, observacao: '' },
  lanche_tarde: { aceitacao: null, observacao: '' },
  jantar:       { aceitacao: null, observacao: '' },
}

// ── Componente principal ──────────────────────────────────

export function DiarioForm({ criancaId, escolaId, data, registradoPor, onSalvo }: Props) {
  const supabase = createClient()

  const [abertas, setAbertas] = useState<Record<string, boolean>>({
    presenca:    true,
    humor:       false,
    sono:        false,
    alimentacao: false,
    higiene:     false,
    recado:      false,
  })

  const [registroDiarioId, setRegistroDiarioId] = useState<string | null>(null)
  const [presencaId, setPresencaId] = useState<string | null>(null)
  const [higieneId, setHigieneId] = useState<string | null>(null)

  const [presente, setPresente] = useState<boolean | null>(null)
  const [humor, setHumor] = useState<Humor | null>(null)
  const [humorObs, setHumorObs] = useState('')
  const [sono, setSono] = useState<Sono | null>(null)
  const [sonoObs, setSonoObs] = useState('')
  const [recado, setRecado] = useState('')
  const [alimentacao, setAlimentacao] = useState<AlimentacaoState>(alimentacaoInicial)
  const [higiene, setHigiene] = useState<HigieneState>({
    banho: false, escovacao: false, evacuacao: false, observacao: '',
  })

  const [salvando, setSalvando] = useState(false)
  const [salvoEm, setSalvoEm] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      setLoading(true)

      const { data: rd } = await supabase
        .from('registros_diarios')
        .select('*')
        .eq('crianca_id', criancaId)
        .eq('data', data)
        .single()

      if (rd) {
        setRegistroDiarioId(rd.id)
        setHumor(rd.humor)
        setHumorObs(rd.humor_obs ?? '')
        setSono(rd.sono)
        setSonoObs(rd.sono_obs ?? '')

        const { data: rp } = await supabase
          .from('registros_presenca')
          .select('*')
          .eq('registro_diario_id', rd.id)
          .single()

        if (rp) {
          setPresencaId(rp.id)
          setPresente(rp.presente)
        }

        const { data: ras } = await supabase
          .from('registros_alimentacao')
          .select('*')
          .eq('registro_diario_id', rd.id)

        if (ras) {
          const novo = { ...alimentacaoInicial }
          ras.forEach((r: any) => {
            novo[r.refeicao as Refeicao] = {
              aceitacao: r.aceitacao,
              observacao: r.observacao ?? '',
            }
          })
          setAlimentacao(novo)
        }

        const { data: rh } = await supabase
          .from('registros_higiene')
          .select('*')
          .eq('registro_diario_id', rd.id)
          .single()

        if (rh) {
          setHigieneId(rh.id)
          setHigiene({
            banho:      rh.banho,
            escovacao:  rh.escovacao,
            evacuacao:  rh.evacuacao,
            observacao: rh.observacao ?? '',
          })
        }
      }

      setLoading(false)
    }
    carregar()
  }, [criancaId, data])

  function toggleSecao(key: string) {
    setAbertas(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function salvar() {
    setSalvando(true)
    try {
      let rdId = registroDiarioId

      if (rdId) {
        await supabase.from('registros_diarios').update({
          humor,
          humor_obs: humorObs || null,
          sono,
          sono_obs: sonoObs || null,
          registrado_por: registradoPor,
          atualizado_em: new Date().toISOString(),
        }).eq('id', rdId)
      } else {
        const { data: rd } = await supabase.from('registros_diarios').insert({
          escola_id: escolaId,
          crianca_id: criancaId,
          data,
          humor,
          humor_obs: humorObs || null,
          sono,
          sono_obs: sonoObs || null,
          registrado_por: registradoPor,
          atualizado_em: new Date().toISOString(),
        }).select('id').single()
        rdId = rd?.id ?? null
        setRegistroDiarioId(rdId)
      }

      if (!rdId) throw new Error('Falha ao criar registro diário')

      if (presente !== null) {
        if (presencaId) {
          await supabase.from('registros_presenca')
            .update({ presente }).eq('id', presencaId)
        } else {
          const { data: rp } = await supabase.from('registros_presenca').insert({
            registro_diario_id: rdId,
            presente,
          }).select('id').single()
          setPresencaId(rp?.id ?? null)
        }
      }

      const refeicoesRegistradas = (Object.entries(alimentacao) as [Refeicao, RefeicaoState][])
        .filter(([, v]) => v.aceitacao !== null)

      if (refeicoesRegistradas.length > 0) {
        await supabase.from('registros_alimentacao')
          .delete().eq('registro_diario_id', rdId)

        await supabase.from('registros_alimentacao').insert(
          refeicoesRegistradas.map(([refeicao, v]) => ({
            registro_diario_id: rdId,
            refeicao,
            aceitacao: v.aceitacao,
            observacao: v.observacao || null,
          }))
        )
      }

      if (higieneId) {
        await supabase.from('registros_higiene').update({
          banho:      higiene.banho,
          escovacao:  higiene.escovacao,
          evacuacao:  higiene.evacuacao,
          observacao: higiene.observacao || null,
        }).eq('id', higieneId)
      } else {
        const { data: rh } = await supabase.from('registros_higiene').insert({
          registro_diario_id: rdId,
          banho:      higiene.banho,
          escovacao:  higiene.escovacao,
          evacuacao:  higiene.evacuacao,
          observacao: higiene.observacao || null,
        }).select('id').single()
        setHigieneId(rh?.id ?? null)
      }

      if (recado.trim()) {
        await supabase.from('recados').insert({
          escola_id:   escolaId,
          crianca_id:  criancaId,
          enviado_por: registradoPor,
          mensagem:    recado.trim(),
        })
        setRecado('')
      }

      setSalvoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      onSalvo?.()

    } catch (e) {
      console.error('Erro ao salvar diário:', e)
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-sm text-[#8C7060]">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Presença */}
      <Secao
        titulo="Presença"
        emoji="✅"
        aberta={abertas.presenca}
        onToggle={() => toggleSecao('presenca')}
        completa={presente !== null}
      >
        <div className="flex gap-3">
          <OpcaoPill
            label="Presente"
            emoji="✅"
            selecionado={presente === true}
            onClick={() => setPresente(true)}
            cor="#72AA78"
          />
          <OpcaoPill
            label="Ausente"
            emoji="❌"
            selecionado={presente === false}
            onClick={() => setPresente(false)}
            cor="#E86C88"
          />
        </div>
      </Secao>

      {/* Humor */}
      <Secao
        titulo="Humor"
        emoji="😊"
        aberta={abertas.humor}
        onToggle={() => toggleSecao('humor')}
        completa={humor !== null}
      >
        <div className="flex flex-wrap gap-2">
          {HUMOR_OPTIONS.map(o => (
            <OpcaoPill
              key={o.value}
              label={o.label}
              emoji={o.emoji}
              selecionado={humor === o.value}
              onClick={() => setHumor(o.value)}
            />
          ))}
        </div>
        <CampoObservacao
          value={humorObs}
          onChange={setHumorObs}
          placeholder="Ex: ficou mais quieta depois do almoço..."
        />
      </Secao>

      {/* Sono */}
      <Secao
        titulo="Sono"
        emoji="😴"
        aberta={abertas.sono}
        onToggle={() => toggleSecao('sono')}
        completa={sono !== null}
      >
        <div className="flex flex-wrap gap-2">
          {SONO_OPTIONS.map(o => (
            <OpcaoPill
              key={o.value}
              label={o.label}
              emoji={o.emoji}
              selecionado={sono === o.value}
              onClick={() => setSono(o.value)}
            />
          ))}
        </div>
        <CampoObservacao
          value={sonoObs}
          onChange={setSonoObs}
          placeholder="Ex: demorou para pegar no sono mas acordou bem..."
        />
      </Secao>

      {/* Alimentação */}
      <Secao
        titulo="Alimentação"
        emoji="🍽️"
        aberta={abertas.alimentacao}
        onToggle={() => toggleSecao('alimentacao')}
        completa={Object.values(alimentacao).some(v => v.aceitacao !== null)}
      >
        <div className="flex flex-col gap-5">
          {REFEICAO_OPTIONS.map(r => (
            <div key={r.value}>
              <p className="text-xs font-semibold text-[#8C7060] mb-2">
                {r.emoji} {r.label}
              </p>
              <div className="flex gap-2">
                {ACEITACAO_OPTIONS.map(a => (
                  <OpcaoPill
                    key={a.value}
                    label={a.label}
                    selecionado={alimentacao[r.value].aceitacao === a.value}
                    onClick={() => setAlimentacao(prev => ({
                      ...prev,
                      [r.value]: { ...prev[r.value], aceitacao: a.value },
                    }))}
                    cor={a.color}
                  />
                ))}
              </div>
              <CampoObservacao
                value={alimentacao[r.value].observacao}
                onChange={v => setAlimentacao(prev => ({
                  ...prev,
                  [r.value]: { ...prev[r.value], observacao: v },
                }))}
                placeholder="Ex: comeu bem, pediu mais frango..."
              />
            </div>
          ))}
        </div>
      </Secao>

      {/* Higiene */}
      <Secao
        titulo="Higiene"
        emoji="🚿"
        aberta={abertas.higiene}
        onToggle={() => toggleSecao('higiene')}
        completa={higiene.banho || higiene.escovacao || higiene.evacuacao}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {[
              { key: 'banho',     label: 'Banho',     emoji: '🚿' },
              { key: 'escovacao', label: 'Escovação', emoji: '🪥' },
              { key: 'evacuacao', label: 'Evacuação', emoji: '🚽' },
            ].map(item => (
              <Button
                key={item.key}
                fullWidth
                variant="ghost"
                customColor={higiene[item.key as 'banho' | 'escovacao' | 'evacuacao'] ? '#EAF3DE' : '#F5EFE8'}
                customTextColor={higiene[item.key as 'banho' | 'escovacao' | 'evacuacao'] ? '#3A7A42' : '#8C7060'}
                onClick={() => setHigiene(prev => ({
                  ...prev,
                  [item.key]: !prev[item.key as keyof HigieneState],
                }))}
              >
                <span className="flex items-center gap-3 w-full">
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                  {higiene[item.key as 'banho' | 'escovacao' | 'evacuacao'] && (
                    <span className="ml-auto text-[#72AA78]">✓</span>
                  )}
                </span>
              </Button>
            ))}
          </div>
          <CampoObservacao
            value={higiene.observacao}
            onChange={v => setHigiene(prev => ({ ...prev, observacao: v }))}
            placeholder="Ex: evacuou bem mas chorou um pouco..."
          />
        </div>
      </Secao>

      {/* Recado */}
      <Secao
        titulo="Recado para os responsáveis"
        emoji="💬"
        aberta={abertas.recado}
        onToggle={() => toggleSecao('recado')}
        completa={recado.trim().length > 0}
      >
        <textarea
          value={recado}
          onChange={e => setRecado(e.target.value)}
          placeholder="Ex: o xampu da Natália está quase no fim..."
          rows={3}
          className="
            w-full rounded-[14px] bg-[#F5EFE8] px-4 py-3
            text-sm text-[#3A2E24] placeholder-[#C8B8A8]
            focus:outline-none focus:ring-2 focus:ring-[#FF8C66]/30
            resize-none
          "
        />
        <p className="text-xs text-[#B0A090] mt-2">
          O recado será enviado assim que você salvar.
        </p>
      </Secao>

      {/* Botão salvar */}
      <Button
        variant="primary"
        fullWidth
        loading={salvando}
        onClick={salvar}
        style={{ borderRadius: '20px', marginTop: '8px', padding: '16px' }}
      >
        Salvar diário
      </Button>

      {salvoEm && (
        <p className="text-center text-xs text-[#72AA78]">
          ✓ Salvo às {salvoEm}
        </p>
      )}

    </div>
  )
}