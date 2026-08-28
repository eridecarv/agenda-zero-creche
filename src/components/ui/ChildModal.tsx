/**
 * ChildModal — bottom sheet para visualização e edição de criança.
 *
 * Modos:
 * - Visualização: dados da criança + responsável principal + botões separados
 * - Edição: só campos da criança — sem responsáveis (fricção intencional)
 * - Criação: campos vazios
 *
 * Botões no modo visualização:
 * - "Editar criança" → modo edição (só dados da criança)
 * - "Editar responsáveis" → abre GuardianModal por cima
 * - "Desativar criança"
 *
 * Responsável principal:
 * - Buscado via guardianships onde type = 'principal' e end_date is null
 * - Mostra nome, relação e status do acesso
 */

'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { GuardianModal } from '@/components/ui/GuardianModal'
import { createClient } from '@/lib/supabase'
import type { Child, Class, Shift, GuardianRelation } from '@/types'

const shiftLabels: Record<Shift, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
}

const relationLabels: Record<GuardianRelation, string> = {
  mae: 'Mãe',
  pai: 'Pai',
  avo: 'Avô',
  ava: 'Avó',
  tio: 'Tio',
  tia: 'Tia',
  outro: 'Outro',
}

// ── Tipo local de responsável principal ───────────────────────
type PrimaryGuardian = {
  guardianshipId: string
  userId: string
  name: string
  relation: GuardianRelation | null
  hasActiveAccess: boolean
  hasPendingInvite: boolean
}

// ── Props ─────────────────────────────────────────────────────
type ChildModalProps = {
  schoolId: string
  userId: string
  child?: Child
  onClose: () => void
  onSaved: () => void
}

// ── Linha de detalhe ──────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-[#F0EAE3] last:border-0">
      <span className="text-xs text-[#8C7060]">{label}</span>
      <span className="text-sm font-medium text-[#3A2E24]">{value ?? '—'}</span>
    </div>
  )
}

// ── Calcula idade ─────────────────────────────────────────────
function calcularIdade(birthDate: string | null): string {
  if (!birthDate) return ''
  const nasc = new Date(birthDate)
  const hoje = new Date()
  const meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth())
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(meses / 12)
  const mesesRest = meses % 12
  return mesesRest > 0
    ? `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${mesesRest}m`
    : `${anos} ${anos === 1 ? 'ano' : 'anos'}`
}

// ── Modal ─────────────────────────────────────────────────────
export function ChildModal({ schoolId, userId, child, onClose, onSaved }: ChildModalProps) {
  const supabase = createClient()

  const [mode, setMode] = useState<'view' | 'edit' | 'create'>(child ? 'view' : 'create')

  // Form
  const [name, setName] = useState(child?.name ?? '')
  const [birthDate, setBirthDate] = useState(child?.birth_date ?? '')
  const [notes, setNotes] = useState(child?.notes ?? '')
  const [classId, setClassId] = useState<string | null>(null)
  const [currentClassId, setCurrentClassId] = useState<string | null>(null)

  // Dados
  const [classes, setClasses] = useState<Class[]>([])
  const [currentClass, setCurrentClass] = useState<Class | null>(null)
  const [primaryGuardian, setPrimaryGuardian] = useState<PrimaryGuardian | null>(null)

  // Controle do GuardianModal
  const [guardianModalOpen, setGuardianModalOpen] = useState(false)

  // Estado
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  useEffect(() => {
    loadClasses()
    if (child) {
      loadCurrentClass(child.id)
      loadPrimaryGuardian(child.id)
    }
  }, [])

  async function loadClasses() {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('school_id', schoolId)
      .eq('active', true)
      .eq('type', 'regular')
      .order('name')
    if (data) setClasses(data)
  }

  async function loadCurrentClass(childId: string) {
    const { data } = await supabase
      .from('child_class')
      .select('class_id, classes(*)')
      .eq('child_id', childId)
      .is('end_date', null)
      .single()

    if (data) {
      const cls = data.classes as unknown as Class
      setCurrentClass(cls)
      setCurrentClassId(data.class_id)
      setClassId(data.class_id)
    }
  }

  async function loadPrimaryGuardian(childId: string) {
    // Query 1: busca o vínculo e o usuário
    const { data } = await supabase
      .from('guardianships')
      .select('id, user_id, relation, users(id, name)')
      .eq('child_id', childId)
      .eq('type', 'principal')
      .eq('active', true)
      .is('end_date', null)
      .single()

    if (!data) return

    const user = data.users as any

    // Query 2: busca o convite do responsável
    const { data: invites } = await supabase
      .from('invites')
      .select('used_at, expires_at')
      .eq('user_id', data.user_id)

    const hasActiveAccess = invites?.some((i: any) => !!i.used_at) ?? false
    const hasPendingInvite =
      invites?.some((i: any) => !i.used_at && new Date(i.expires_at) > new Date()) ?? false

    setPrimaryGuardian({
      guardianshipId: data.id,
      userId: data.user_id,
      name: user?.name ?? '—',
      relation: data.relation as GuardianRelation | null,
      hasActiveAccess,
      hasPendingInvite,
    })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome é obrigatório'
    if (!birthDate) e.birthDate = 'Data de nascimento é obrigatória'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)

    const payload = {
      school_id: schoolId,
      name: name.trim(),
      birth_date: birthDate || null,
      notes: notes.trim() || null,
    }

    if (mode === 'edit' && child) {
      const { error } = await supabase
        .from('children')
        .update(payload)
        .eq('id', child.id)
        .eq('school_id', schoolId)

      if (error) {
        setErrors({ general: 'Erro ao salvar. Tente novamente.' })
        setSaving(false)
        return
      }

      if (classId !== currentClassId) {
        if (currentClassId) {
          await supabase
            .from('child_class')
            .update({ end_date: new Date().toISOString().split('T')[0] })
            .eq('child_id', child.id)
            .is('end_date', null)
        }
        if (classId) {
          await supabase.from('child_class').insert({
            school_id: schoolId,
            child_id: child.id,
            class_id: classId,
            start_date: new Date().toISOString().split('T')[0],
          })
        }
      }
    } else {
      const { data: newChild, error } = await supabase
        .from('children')
        .insert({ ...payload, active: true })
        .select('id')
        .single()

      if (error || !newChild) {
        setErrors({ general: 'Erro ao salvar. Tente novamente.' })
        setSaving(false)
        return
      }

      if (classId) {
        await supabase.from('child_class').insert({
          school_id: schoolId,
          child_id: newChild.id,
          class_id: classId,
          start_date: new Date().toISOString().split('T')[0],
        })
      }
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  async function handleDeactivate() {
    if (!child) return
    setDeactivating(true)

    const { error } = await supabase
      .from('children')
      .update({ active: false, deactivated_at: new Date().toISOString() })
      .eq('id', child.id)
      .eq('school_id', schoolId)

    if (error) {
      setErrors({ general: 'Erro ao desativar. Tente novamente.' })
      setDeactivating(false)
      return
    }

    setDeactivating(false)
    onSaved()
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div
        className="
        fixed bottom-0 left-0 right-0 z-50
        bg-[#FFFDF9] rounded-t-[28px]
        shadow-[0_-4px_24px_rgba(180,140,120,0.18)]
        px-5 pt-5 pb-10
        max-w-lg mx-auto
        max-h-[90vh] overflow-y-auto
      "
      >
        <div className="w-10 h-1 bg-[#E8E0D8] rounded-full mx-auto mb-5" />

        <h2 className="font-display text-lg font-bold text-[#3A2E24] mb-5">
          {mode === 'create' ? 'Nova criança' : child?.name.split(' ')[0]}
        </h2>

        {/* ── Visualização ── */}
        {mode === 'view' && child && (
          <div className="flex flex-col">
            <DetailRow label="Nome completo" value={child.name} />
            <DetailRow label="Idade" value={calcularIdade(child.birth_date)} />
            <DetailRow
              label="Data de nascimento"
              value={
                child.birth_date
                  ? new Date(child.birth_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                  : null
              }
            />
            <DetailRow
              label="Turma"
              value={
                currentClass
                  ? `${currentClass.name}${currentClass.shift ? ` · ${shiftLabels[currentClass.shift]}` : ''}`
                  : null
              }
            />
            {child.notes && (
              <div className="flex flex-col gap-0.5 py-3 border-b border-[#F0EAE3]">
                <span className="text-xs text-[#8C7060]">Observações</span>
                <span className="text-sm text-[#E86C88] font-medium">⚠ {child.notes}</span>
              </div>
            )}

            {/* Responsável principal */}
            <div className="py-3 border-b border-[#F0EAE3]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#8C7060]">Responsável principal</span>
                {primaryGuardian && (
                  <span
                    className={`
                    text-xs font-medium px-2 py-0.5 rounded-full
                    ${
                      primaryGuardian.hasActiveAccess
                        ? 'bg-[#EDF7ED] text-[#72AA78]'
                        : primaryGuardian.hasPendingInvite
                          ? 'bg-[#FFF9E6] text-[#C49A00]'
                          : 'bg-[#F5F5F5] text-[#B0A090]'
                    }
                  `}
                  >
                    {primaryGuardian.hasActiveAccess
                      ? '✓ Acesso ativo'
                      : primaryGuardian.hasPendingInvite
                        ? '⏳ Convite pendente'
                        : 'Sem acesso'}
                  </span>
                )}
              </div>

              {primaryGuardian ? (
                <div>
                  <span className="text-sm font-semibold text-[#3A2E24]">
                    {primaryGuardian.name}
                  </span>
                  {primaryGuardian.relation && (
                    <span className="text-xs text-[#8C7060] ml-2">
                      {relationLabels[primaryGuardian.relation]}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-[#B0A090]">Nenhum responsável vinculado</span>
              )}
            </div>

            {/* Botões */}
            <div className="flex flex-col gap-2 mt-5">
              <Button variant="primary" onClick={() => setMode('edit')}>
                Editar criança
              </Button>

              <Button variant="secondary" onClick={() => setGuardianModalOpen(true)}>
                Editar responsáveis
              </Button>

              {!confirmDeactivate ? (
                <Button variant="ghost" onClick={() => setConfirmDeactivate(true)}>
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
                      onClick={() => setConfirmDeactivate(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      fullWidth={false}
                      loading={deactivating}
                      customColor="#E86C88"
                      customTextColor="#fff"
                      onClick={handleDeactivate}
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

        {/* ── Edição / Criação ── */}
        {(mode === 'edit' || mode === 'create') && (
          <div className="flex flex-col gap-4">
            <Input
              label="Nome completo"
              placeholder="Nome da criança"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />

            <Input
              label="Data de nascimento"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              error={errors.birthDate}
            />

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#3A2E24]">Turma</span>
              {classes.length === 0 ? (
                <p className="text-xs text-[#B0A090]">Nenhuma turma ativa cadastrada.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setClassId(null)}
                    className={`
                      w-full text-left px-4 py-3 rounded-[14px] text-sm transition-all border
                      ${
                        classId === null
                          ? 'border-[#FF8C66] bg-[#FFF5F0] text-[#FF8C66] font-medium'
                          : 'border-[#E8E0D8] text-[#8C7060] hover:border-[#FF8C66]'
                      }
                    `}
                  >
                    Sem turma por enquanto
                  </button>
                  {classes.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setClassId(c.id)}
                      className={`
                        w-full text-left px-4 py-3 rounded-[14px] text-sm transition-all border
                        ${
                          classId === c.id
                            ? 'border-[#FF8C66] bg-[#FFF5F0] font-medium text-[#3A2E24]'
                            : 'border-[#E8E0D8] text-[#3A2E24] hover:border-[#FF8C66]'
                        }
                      `}
                    >
                      <span className="font-medium">{c.name}</span>
                      {(c.level || c.shift) && (
                        <span className="text-xs text-[#8C7060] ml-2">
                          {[c.level, c.shift ? shiftLabels[c.shift] : null]
                            .filter(Boolean)
                            .join(' · ')}
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {errors.general && <span className="text-xs text-[#E86C88]">{errors.general}</span>}

            <Button variant="primary" loading={saving} onClick={handleSave}>
              {mode === 'edit' ? 'Salvar alterações' : 'Cadastrar criança'}
            </Button>

            <Button variant="ghost" onClick={() => (mode === 'edit' ? setMode('view') : onClose())}>
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {/* GuardianModal abre por cima */}
      {guardianModalOpen && child && (
        <GuardianModal
          schoolId={schoolId}
          userId={userId}
          childId={child.id}
          onClose={() => setGuardianModalOpen(false)}
          onSaved={() => {
            loadPrimaryGuardian(child.id)
            onSaved()
          }}
        />
      )}
    </>
  )
}
