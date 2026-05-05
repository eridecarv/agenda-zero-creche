/**
 * CriancaModal — bottom sheet para visualização e edição de criança.
 *
 * Modos:
 * - Visualização: dados da criança + responsável principal + botões separados
 * - Edição: só campos da criança — sem responsáveis (fricção intencional)
 * - Criação: campos vazios
 *
 * Botões no modo visualização:
 * - "Editar criança" → modo edição (só dados da criança)
 * - "Editar responsáveis" → abre ResponsavelModal por cima
 * - "Desativar criança"
 *
 * Responsável principal:
 * - Buscado via vinculos onde tipo = 'principal' e data_fim is null
 * - Mostra nome, relação e status do acesso
 */

'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ResponsavelModal } from '@/components/ui/ResponsavelModal'
import { createClient } from '@/lib/supabase'
import type { Crianca, Turma, Turno, RelacaoVinculo } from '@/types'

const turnoLabels: Record<Turno, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
}

const relacaoLabels: Record<RelacaoVinculo, string> = {
  mae: 'Mãe',
  pai: 'Pai',
  avo: 'Avô',
  ava: 'Avó',
  tio: 'Tio',
  tia: 'Tia',
  outro: 'Outro',
}

// ── Tipo local de responsável principal ───────────────────────
type ResponsavelPrincipal = {
  vinculoId: string
  usuarioId: string
  nome: string
  relacao: RelacaoVinculo | null
  temAcessoAtivo: boolean
  temConvitePendente: boolean
}

// ── Props ─────────────────────────────────────────────────────
type CriancaModalProps = {
  escolaId: string
  usuarioId: string
  crianca?: Crianca
  onClose: () => void
  onSaved: () => void
}

// ── Linha de detalhe ──────────────────────────────────────────
function DetalheRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-[#F0EAE3] last:border-0">
      <span className="text-xs text-[#8C7060]">{label}</span>
      <span className="text-sm font-medium text-[#3A2E24]">{value ?? '—'}</span>
    </div>
  )
}

// ── Calcula idade ─────────────────────────────────────────────
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
  return mesesRest > 0
    ? `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${mesesRest}m`
    : `${anos} ${anos === 1 ? 'ano' : 'anos'}`
}

// ── Modal ─────────────────────────────────────────────────────
export function CriancaModal({
  escolaId,
  usuarioId,
  crianca,
  onClose,
  onSaved,
}: CriancaModalProps) {
  const supabase = createClient()

  const [modo, setModo] = useState<'visualizacao' | 'edicao' | 'criacao'>(
    crianca ? 'visualizacao' : 'criacao'
  )

  // Form
  const [nome, setNome] = useState(crianca?.nome ?? '')
  const [dataNascimento, setDataNascimento] = useState(crianca?.data_nascimento ?? '')
  const [observacoes, setObservacoes] = useState(crianca?.observacoes ?? '')
  const [turmaId, setTurmaId] = useState<string | null>(null)
  const [turmaAtualId, setTurmaAtualId] = useState<string | null>(null)

  // Dados
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [turmaAtual, setTurmaAtual] = useState<Turma | null>(null)
  const [responsavelPrincipal, setResponsavelPrincipal] = useState<ResponsavelPrincipal | null>(null)

  // Controle do ResponsavelModal
  const [responsavelModalAberto, setResponsavelModalAberto] = useState(false)

  // Estado
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [desativando, setDesativando] = useState(false)
  const [confirmarDesativar, setConfirmarDesativar] = useState(false)

  useEffect(() => {
    carregarTurmas()
    if (crianca) {
      carregarTurmaAtual(crianca.id)
      carregarResponsavelPrincipal(crianca.id)
    }
  }, [])

  async function carregarTurmas() {
    const { data } = await supabase
      .from('turmas')
      .select('*')
      .eq('escola_id', escolaId)
      .eq('ativo', true)
      .eq('tipo', 'regular')
      .order('nome')
    if (data) setTurmas(data)
  }

  async function carregarTurmaAtual(criancaId: string) {
    const { data } = await supabase
      .from('crianca_turma')
      .select('turma_id, turmas(*)')
      .eq('crianca_id', criancaId)
      .is('data_fim', null)
      .single()

    if (data) {
      const turma = data.turmas as unknown as Turma
      setTurmaAtual(turma)
      setTurmaAtualId(data.turma_id)
      setTurmaId(data.turma_id)
    }
  }

  async function carregarResponsavelPrincipal(criancaId: string) {
    // Query 1: busca o vínculo e o usuário
    const { data } = await supabase
      .from('vinculos')
      .select('id, usuario_id, relacao, usuarios(id, nome)')
      .eq('crianca_id', criancaId)
      .eq('tipo', 'principal')
      .eq('ativo', true)
      .is('data_fim', null)
      .single()

    if (!data) return

    const usuario = data.usuarios as any

    // Query 2: busca o convite do responsável
    const { data: convites } = await supabase
      .from('convites')
      .select('usado_em, expira_em')
      .eq('usuario_id', data.usuario_id)

    const temAcessoAtivo = convites?.some((c: any) => !!c.usado_em) ?? false
    const temConvitePendente = convites?.some(
      (c: any) => !c.usado_em && new Date(c.expira_em) > new Date()
    ) ?? false

    setResponsavelPrincipal({
      vinculoId: data.id,
      usuarioId: data.usuario_id,
      nome: usuario?.nome ?? '—',
      relacao: data.relacao as RelacaoVinculo | null,
      temAcessoAtivo,
      temConvitePendente,
    })
  }

  function validar() {
    const e: Record<string, string> = {}
    if (!nome.trim()) e.nome = 'Nome é obrigatório'
    if (!dataNascimento) e.dataNascimento = 'Data de nascimento é obrigatória'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSalvar() {
    if (!validar()) return
    setSalvando(true)

    const payload = {
      escola_id: escolaId,
      nome: nome.trim(),
      data_nascimento: dataNascimento || null,
      observacoes: observacoes.trim() || null,
    }

    if (modo === 'edicao' && crianca) {
      const { error } = await supabase
        .from('criancas')
        .update(payload)
        .eq('id', crianca.id)
        .eq('escola_id', escolaId)

      if (error) {
        setErrors({ geral: 'Erro ao salvar. Tente novamente.' })
        setSalvando(false)
        return
      }

      if (turmaId !== turmaAtualId) {
        if (turmaAtualId) {
          await supabase
            .from('crianca_turma')
            .update({ data_fim: new Date().toISOString().split('T')[0] })
            .eq('crianca_id', crianca.id)
            .is('data_fim', null)
        }
        if (turmaId) {
          await supabase.from('crianca_turma').insert({
            escola_id: escolaId,
            crianca_id: crianca.id,
            turma_id: turmaId,
            data_inicio: new Date().toISOString().split('T')[0],
          })
        }
      }
    } else {
      const { data: novaCrianca, error } = await supabase
        .from('criancas')
        .insert({ ...payload, ativo: true })
        .select('id')
        .single()

      if (error || !novaCrianca) {
        setErrors({ geral: 'Erro ao salvar. Tente novamente.' })
        setSalvando(false)
        return
      }

      if (turmaId) {
        await supabase.from('crianca_turma').insert({
          escola_id: escolaId,
          crianca_id: novaCrianca.id,
          turma_id: turmaId,
          data_inicio: new Date().toISOString().split('T')[0],
        })
      }
    }

    setSalvando(false)
    onSaved()
    onClose()
  }

  async function handleDesativar() {
    if (!crianca) return
    setDesativando(true)

    const { error } = await supabase
      .from('criancas')
      .update({ ativo: false, desativado_em: new Date().toISOString() })
      .eq('id', crianca.id)
      .eq('escola_id', escolaId)

    if (error) {
      setErrors({ geral: 'Erro ao desativar. Tente novamente.' })
      setDesativando(false)
      return
    }

    setDesativando(false)
    onSaved()
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="
        fixed bottom-0 left-0 right-0 z-50
        bg-[#FFFDF9] rounded-t-[28px]
        shadow-[0_-4px_24px_rgba(180,140,120,0.18)]
        px-5 pt-5 pb-10
        max-w-lg mx-auto
        max-h-[90vh] overflow-y-auto
      ">
        <div className="w-10 h-1 bg-[#E8E0D8] rounded-full mx-auto mb-5" />

        <h2 className="font-display text-lg font-bold text-[#3A2E24] mb-5">
          {modo === 'criacao' ? 'Nova criança' : crianca?.nome.split(' ')[0]}
        </h2>

        {/* ── Visualização ── */}
        {modo === 'visualizacao' && crianca && (
          <div className="flex flex-col">

            <DetalheRow label="Nome completo" value={crianca.nome} />
            <DetalheRow
              label="Idade"
              value={calcularIdade(crianca.data_nascimento)}
            />
            <DetalheRow
              label="Data de nascimento"
              value={crianca.data_nascimento
                ? new Date(crianca.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                : null
              }
            />
            <DetalheRow
              label="Turma"
              value={turmaAtual
                ? `${turmaAtual.nome}${turmaAtual.turno ? ` · ${turnoLabels[turmaAtual.turno]}` : ''}`
                : null
              }
            />
            {crianca.observacoes && (
              <div className="flex flex-col gap-0.5 py-3 border-b border-[#F0EAE3]">
                <span className="text-xs text-[#8C7060]">Observações</span>
                <span className="text-sm text-[#E86C88] font-medium">⚠ {crianca.observacoes}</span>
              </div>
            )}

            {/* Responsável principal */}
            <div className="py-3 border-b border-[#F0EAE3]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#8C7060]">Responsável principal</span>
                {responsavelPrincipal && (
                  <span className={`
                    text-xs font-medium px-2 py-0.5 rounded-full
                    ${responsavelPrincipal.temAcessoAtivo
                      ? 'bg-[#EDF7ED] text-[#72AA78]'
                      : responsavelPrincipal.temConvitePendente
                        ? 'bg-[#FFF9E6] text-[#C49A00]'
                        : 'bg-[#F5F5F5] text-[#B0A090]'
                    }
                  `}>
                    {responsavelPrincipal.temAcessoAtivo
                      ? '✓ Acesso ativo'
                      : responsavelPrincipal.temConvitePendente
                        ? '⏳ Convite pendente'
                        : 'Sem acesso'
                    }
                  </span>
                )}
              </div>

              {responsavelPrincipal ? (
                <div>
                  <span className="text-sm font-semibold text-[#3A2E24]">
                    {responsavelPrincipal.nome}
                  </span>
                  {responsavelPrincipal.relacao && (
                    <span className="text-xs text-[#8C7060] ml-2">
                      {relacaoLabels[responsavelPrincipal.relacao]}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-[#B0A090]">Nenhum responsável vinculado</span>
              )}
            </div>

            {/* Botões */}
            <div className="flex flex-col gap-2 mt-5">
              <Button variant="primary" onClick={() => setModo('edicao')}>
                Editar criança
              </Button>

              <Button
                variant="secondary"
                onClick={() => setResponsavelModalAberto(true)}
              >
                Editar responsáveis
              </Button>

              {!confirmarDesativar ? (
                <Button variant="ghost" onClick={() => setConfirmarDesativar(true)}>
                  Desativar criança
                </Button>
              ) : (
                <div className="flex flex-col gap-2 p-4 rounded-[14px] bg-[#FFF5F7] border border-[#E86C88]/20">
                  <p className="text-sm text-[#3A2E24]">
                    Tem certeza? Os dados serão preservados mas a criança ficará inativa.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      fullWidth={false}
                      onClick={() => setConfirmarDesativar(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      fullWidth={false}
                      loading={desativando}
                      customColor="#E86C88"
                      customTextColor="#fff"
                      onClick={handleDesativar}
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              )}

              <Button variant="ghost" onClick={onClose}>Fechar</Button>
            </div>
          </div>
        )}

        {/* ── Edição / Criação ── */}
        {(modo === 'edicao' || modo === 'criacao') && (
          <div className="flex flex-col gap-4">

            <Input
              label="Nome completo"
              placeholder="Nome da criança"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              error={errors.nome}
            />

            <Input
              label="Data de nascimento"
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              error={errors.dataNascimento}
            />

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#3A2E24]">Turma</span>
              {turmas.length === 0 ? (
                <p className="text-xs text-[#B0A090]">Nenhuma turma ativa cadastrada.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setTurmaId(null)}
                    className={`
                      w-full text-left px-4 py-3 rounded-[14px] text-sm transition-all border
                      ${turmaId === null
                        ? 'border-[#FF8C66] bg-[#FFF5F0] text-[#FF8C66] font-medium'
                        : 'border-[#E8E0D8] text-[#8C7060] hover:border-[#FF8C66]'
                      }
                    `}
                  >
                    Sem turma por enquanto
                  </button>
                  {turmas.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTurmaId(t.id)}
                      className={`
                        w-full text-left px-4 py-3 rounded-[14px] text-sm transition-all border
                        ${turmaId === t.id
                          ? 'border-[#FF8C66] bg-[#FFF5F0] font-medium text-[#3A2E24]'
                          : 'border-[#E8E0D8] text-[#3A2E24] hover:border-[#FF8C66]'
                        }
                      `}
                    >
                      <span className="font-medium">{t.nome}</span>
                      {(t.nivel || t.turno) && (
                        <span className="text-xs text-[#8C7060] ml-2">
                          {[t.nivel, t.turno ? turnoLabels[t.turno] : null].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#3A2E24]">
                Observações{' '}
                <span className="text-[#B0A090] font-normal">(alergias, medicações, cuidados)</span>
              </label>
              <textarea
                className="
                  w-full rounded-[14px] border border-[#E8E0D8] px-4 py-3 text-sm
                  bg-[#FFFDF9] text-[#3A2E24] placeholder:text-[#C4B5A8]
                  outline-none transition-all duration-200 resize-none
                  focus:border-[#FF8C66] focus:ring-2 focus:ring-[#FF8C66]/20
                "
                rows={3}
                placeholder="Ex: Alergia a amendoim. Usa fralda tamanho G."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>

            {errors.geral && (
              <span className="text-xs text-[#E86C88]">{errors.geral}</span>
            )}

            <Button variant="primary" loading={salvando} onClick={handleSalvar}>
              {modo === 'edicao' ? 'Salvar alterações' : 'Cadastrar criança'}
            </Button>

            <Button
              variant="ghost"
              onClick={() => modo === 'edicao' ? setModo('visualizacao') : onClose()}
            >
              Cancelar
            </Button>

          </div>
        )}

      </div>

      {/* ResponsavelModal abre por cima */}
      {responsavelModalAberto && crianca && (
        <ResponsavelModal
          escolaId={escolaId}
          usuarioId={usuarioId}
          criancaId={crianca.id}
          onClose={() => setResponsavelModalAberto(false)}
          onSaved={() => {
            carregarResponsavelPrincipal(crianca.id)
            onSaved()
          }}
        />
      )}
    </>
  )
}