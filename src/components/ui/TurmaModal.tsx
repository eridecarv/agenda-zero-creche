/**
 * TurmaModal — bottom sheet para visualização e edição de turma.
 *
 * Tem dois modos:
 * - Visualização: exibe os dados em texto, sem campos editáveis.
 *   Botões de "Editar" e "Desativar" disponíveis.
 * - Edição: campos editáveis. Ativado ao clicar em "Editar"
 *   ou ao abrir para criar uma nova turma.
 *
 * Props:
 * - turma: se vier, abre em visualização. Se não vier, abre em criação.
 * - escolaId: obrigatório para todas as operações no banco.
 * - onClose: fecha o modal.
 * - onSaved: chamado após salvar ou desativar — página recarrega a lista.
 */

'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase'
import type { Turma, Turno, TipoTurma } from '@/types'

// ── Labels ────────────────────────────────────────────────────
const turnoLabels: Record<Turno, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
}

const tipoLabels: Record<TipoTurma, string> = {
  regular: 'Regular',
  extracurricular: 'Extracurricular',
}

// ── Props ─────────────────────────────────────────────────────
type TurmaModalProps = {
  escolaId: string
  turma?: Turma
  onClose: () => void
  onSaved: () => void
}

// ── Chip selector — só usado no modo edição/criação ───────────
function ChipGroup<T extends string>({
  label,
  options,
  labels,
  value,
  onChange,
  error,
}: {
  label: string
  options: T[]
  labels: Record<T, string>
  value: T | null
  onChange: (v: T) => void
  error?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[#3A2E24]">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
              ${value === opt
                ? 'bg-[#FF8C66] text-white shadow-[0_2px_8px_rgba(180,140,120,0.25)]'
                : 'bg-[#FAF7F2] text-[#8C7060] border border-[#E8E0D8] hover:border-[#FF8C66]'
              }
            `}
          >
            {labels[opt]}
          </button>
        ))}
      </div>
      {error && <span className="text-xs text-[#E86C88]">{error}</span>}
    </div>
  )
}

// ── Linha de detalhe — só usado no modo visualização ──────────
function DetalheRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-[#F0EAE3] last:border-0">
      <span className="text-xs text-[#8C7060]">{label}</span>
      <span className="text-sm font-medium text-[#3A2E24]">{value ?? '—'}</span>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────
export function TurmaModal({ escolaId, turma, onClose, onSaved }: TurmaModalProps) {
  const supabase = createClient()

  // Se veio uma turma, começa em visualização. Se não veio, começa em criação.
  const [modo, setModo] = useState<'visualizacao' | 'edicao' | 'criacao'>(
    turma ? 'visualizacao' : 'criacao'
  )

  // Form
  const [nome, setNome] = useState(turma?.nome ?? '')
  const [ano, setAno] = useState(turma?.ano?.toString() ?? new Date().getFullYear().toString())
  const [tipo, setTipo] = useState<TipoTurma>(turma?.tipo ?? 'regular')
  const [nivel, setNivel] = useState(turma?.nivel ?? '')
  const [turno, setTurno] = useState<Turno | null>(turma?.turno ?? null)

  // Estado
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [desativando, setDesativando] = useState(false)
  const [confirmarDesativar, setConfirmarDesativar] = useState(false)

  useEffect(() => {
    if (tipo === 'extracurricular') setNivel('')
  }, [tipo])

  // ── Validação ──
  function validar() {
    const e: Record<string, string> = {}
    if (!nome.trim()) e.nome = 'Nome é obrigatório'
    if (!ano || isNaN(Number(ano)) || Number(ano) < 2020 || Number(ano) > 2099)
      e.ano = 'Ano inválido'
    if (!turno) e.turno = 'Selecione o turno'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Salvar (criar ou editar) ──
  async function handleSalvar() {
    if (!validar()) return
    setSalvando(true)

    const payload = {
      escola_id: escolaId,
      nome: nome.trim(),
      ano: Number(ano),
      tipo,
      nivel: nivel.trim() || null,
      turno,
    }

    if (modo === 'edicao' && turma) {
      const { error } = await supabase
        .from('turmas')
        .update(payload)
        .eq('id', turma.id)
        .eq('escola_id', escolaId)

      if (error) {
        setErrors({ geral: 'Erro ao salvar. Tente novamente.' })
        setSalvando(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('turmas')
        .insert({ ...payload, ativo: true })

      if (error) {
        setErrors({ geral: 'Erro ao salvar. Tente novamente.' })
        setSalvando(false)
        return
      }
    }

    setSalvando(false)
    onSaved()
    onClose()
  }

  // ── Desativar ──
  async function handleDesativar() {
    if (!turma) return
    setDesativando(true)

    const { error } = await supabase
      .from('turmas')
      .update({
        ativo: false,
        desativado_em: new Date().toISOString(),
      })
      .eq('id', turma.id)
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
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Modal — bottom sheet */}
      <div className="
        fixed bottom-0 left-0 right-0 z-50
        bg-[#FFFDF9] rounded-t-[28px]
        shadow-[0_-4px_24px_rgba(180,140,120,0.18)]
        px-5 pt-5 pb-10
        max-w-lg mx-auto
      ">

        {/* Alça visual */}
        <div className="w-10 h-1 bg-[#E8E0D8] rounded-full mx-auto mb-5" />

        {/* Título */}
        <h2 className="font-display text-lg font-bold text-[#3A2E24] mb-5">
          {modo === 'criacao' ? 'Nova turma' : turma?.nome}
        </h2>

        {/* ── Modo visualização ── */}
        {modo === 'visualizacao' && turma && (
          <div className="flex flex-col">

            <DetalheRow label="Nome" value={turma.nome} />
            <DetalheRow label="Ano letivo" value={turma.ano.toString()} />
            <DetalheRow label="Tipo" value={tipoLabels[turma.tipo]} />
            <DetalheRow label="Nível" value={turma.nivel} />
            <DetalheRow
              label="Turno"
              value={turma.turno ? turnoLabels[turma.turno] : null}
            />

            <div className="flex flex-col gap-2 mt-5">
              <Button variant="primary" onClick={() => setModo('edicao')}>
                Editar
              </Button>

              {!confirmarDesativar ? (
                <Button variant="ghost" onClick={() => setConfirmarDesativar(true)}>
                  Desativar turma
                </Button>
              ) : (
                <div className="flex flex-col gap-2 p-4 rounded-[14px] bg-[#FFF5F7] border border-[#E86C88]/20">
                  <p className="text-sm text-[#3A2E24]">
                    Tem certeza? A turma ficará inativa mas os dados serão preservados.
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

              <Button variant="ghost" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        )}

        {/* ── Modo edição / criação ── */}
        {(modo === 'edicao' || modo === 'criacao') && (
          <div className="flex flex-col gap-4">

            <Input
              label="Nome da turma"
              placeholder="Ex: Maternal 1 A"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              error={errors.nome}
            />

            <Input
              label="Ano letivo"
              type="number"
              placeholder={new Date().getFullYear().toString()}
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              error={errors.ano}
            />

            <ChipGroup
              label="Tipo"
              options={['regular', 'extracurricular'] as TipoTurma[]}
              labels={tipoLabels}
              value={tipo}
              onChange={setTipo}
            />

            {tipo === 'regular' && (
              <Input
                label="Nível"
                placeholder="Ex: Berçário 1, Maternal A..."
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
              />
            )}

            <ChipGroup
              label="Turno"
              options={['manha', 'tarde', 'noite', 'integral'] as Turno[]}
              labels={turnoLabels}
              value={turno}
              onChange={setTurno}
              error={errors.turno}
            />

            {errors.geral && (
              <span className="text-xs text-[#E86C88]">{errors.geral}</span>
            )}

            <Button variant="primary" loading={salvando} onClick={handleSalvar}>
              {modo === 'edicao' ? 'Salvar alterações' : 'Criar turma'}
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
    </>
  )
}