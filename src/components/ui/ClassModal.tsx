/**
 * ClassModal — bottom sheet para visualização e edição de turma.
 *
 * Modos:
 * - Visualização: dados da turma + equipe atribuída.
 * - Edição: campos editáveis + seleção de equipe por cargo.
 * - Criação: campos vazios.
 *
 * Equipe:
 * - Coordenação: uma pessoa
 * - Professora: uma pessoa
 * - Assistentes: múltiplos, com "+" para adicionar e "×" para remover
 *
 * Cada campo de pessoa é um input com busca em tempo real,
 * filtrado pelo role correspondente.
 *
 * Ao salvar, sincroniza a tabela `class_staff`:
 * removidos recebem `removed_at`, novos são inseridos.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase'
import type { Class, Shift, ClassType, User } from '@/types'

// ── Labels ────────────────────────────────────────────────────
const shiftLabels: Record<Shift, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
}

const classTypeLabels: Record<ClassType, string> = {
  regular: 'Regular',
  extracurricular: 'Extracurricular',
}

// ── Props ─────────────────────────────────────────────────────
type ClassModalProps = {
  schoolId: string
  class?: Class
  onClose: () => void
  onSaved: () => void
}

// ── Tipo interno de atribuição ─────────────────────────────────
type SavedAssignment = {
  recordId: string    // id na tabela class_staff
  user: User
}

// ── Chip selector ─────────────────────────────────────────────
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

// ── Linha de detalhe ──────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-[#F0EAE3] last:border-0">
      <span className="text-xs text-[#8C7060]">{label}</span>
      <span className="text-sm font-medium text-[#3A2E24]">{value ?? '—'}</span>
    </div>
  )
}

// ── Campo de busca de pessoa ──────────────────────────────────
function PersonSearch({
  label,
  staffMembers,
  value,
  onChange,
  onClear,
  showClear,
}: {
  label?: string
  staffMembers: User[]
  value: User | null
  onChange: (u: User) => void
  onClear?: () => void
  showClear?: boolean
}) {
  const [search, setSearch] = useState(
    value?.nickname || value?.name.split(' ')[0] || ''
  )
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSearch(value?.nickname || value?.name.split(' ')[0] || '')
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = staffMembers.filter((s) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(term) ||
      (s.nickname?.toLowerCase().includes(term) ?? false)
    )
  })

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1" ref={ref}>
        {label && (
          <span className="text-xs text-[#8C7060] mb-1 block">{label}</span>
        )}
        <input
          type="text"
          placeholder="Buscar pelo nome..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="
            w-full rounded-[10px] border border-[#E8E0D8] px-3 py-2.5 text-sm
            bg-[#FFFDF9] text-[#3A2E24] placeholder:text-[#C4B5A8]
            outline-none transition-all duration-200
            focus:border-[#FF8C66] focus:ring-2 focus:ring-[#FF8C66]/20
          "
        />

        {open && filtered.length > 0 && (
          <div className="
            absolute top-full left-0 right-0 z-20 mt-1
            bg-[#FFFDF9] rounded-[10px] border border-[#E8E0D8]
            shadow-[0_4px_16px_rgba(180,140,120,0.16)]
            overflow-hidden
          ">
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChange(s)
                  setSearch(s.nickname || s.name.split(' ')[0])
                  setOpen(false)
                }}
                className="
                  w-full text-left px-3 py-2.5 text-sm
                  hover:bg-[#FAF7F2] transition-colors
                  border-b border-[#F0EAE3] last:border-0
                "
              >
                <span className="font-medium text-[#3A2E24]">
                  {s.nickname || s.name.split(' ')[0]}
                </span>
                {s.nickname && (
                  <span className="text-xs text-[#8C7060] ml-1">{s.name}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {open && search.trim() && filtered.length === 0 && (
          <div className="
            absolute top-full left-0 right-0 z-20 mt-1
            bg-[#FFFDF9] rounded-[10px] border border-[#E8E0D8]
            px-3 py-2.5
          ">
            <span className="text-xs text-[#B0A090]">Nenhum resultado</span>
          </div>
        )}
      </div>

      {showClear && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="
            w-8 h-8 shrink-0 flex items-center justify-center mt-5
            rounded-full text-[#B0A090] hover:text-[#E86C88] hover:bg-[#FFF5F7]
            transition-all duration-150 text-lg
          "
        >
          ×
        </button>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────
export function ClassModal({ schoolId, class: classData, onClose, onSaved }: ClassModalProps) {
  const supabase = createClient()

  const [mode, setMode] = useState<'view' | 'edit' | 'create'>(
    classData ? 'view' : 'create'
  )

  // Form
  const [name, setName] = useState(classData?.name ?? '')
  const [year, setYear] = useState(classData?.year?.toString() ?? new Date().getFullYear().toString())
  const [type, setType] = useState<ClassType>(classData?.type ?? 'regular')
  const [level, setLevel] = useState(classData?.level ?? '')
  const [shift, setShift] = useState<Shift | null>(classData?.shift ?? null)

  // Equipe — colaboradores por role
  const [coordinators, setCoordinators] = useState<User[]>([])
  const [teachers, setTeachers] = useState<User[]>([])
  const [assistants, setAssistants] = useState<User[]>([])

  // Seleções da equipe
  const [selectedCoordinator, setSelectedCoordinator] = useState<User | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null)
  const [selectedAssistants, setSelectedAssistants] = useState<(User | null)[]>([null])

  // Atribuições originais do banco (para sincronização)
  const [originalAssignments, setOriginalAssignments] = useState<SavedAssignment[]>([])

  // Estado
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  useEffect(() => {
    if (type === 'extracurricular') setLevel('')
  }, [type])

  useEffect(() => {
    loadStaffMembers()
    if (classData) loadAssignments(classData.id)
  }, [])

  // ── Carrega colaboradores separados por role ──
  async function loadStaffMembers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('school_id', schoolId)
      .eq('active', true)
      .in('role', ['coordenador', 'professor', 'auxiliar'])
      .order('name')

    if (data) {
      setCoordinators(data.filter((u: User) => u.role === 'coordenador'))
      setTeachers(data.filter((u: User) => u.role === 'professor'))
      setAssistants(data.filter((u: User) => u.role === 'auxiliar'))
    }
  }

  // ── Carrega atribuições atuais da turma ──
  async function loadAssignments(classId: string) {
    const { data } = await supabase
      .from('class_staff')
      .select('id, user_id, users(*)')
      .eq('class_id', classId)
      .is('removed_at', null)

    if (!data) return

    const originals: SavedAssignment[] = data.map((a: any) => ({
      recordId: a.id,
      user: a.users,
    }))
    setOriginalAssignments(originals)

    // Preenche os campos da equipe
    const coord = originals.find((a) => a.user.role === 'coordenador')
    const teacher = originals.find((a) => a.user.role === 'professor')
    const assists = originals.filter((a) => a.user.role === 'auxiliar')

    if (coord) setSelectedCoordinator(coord.user)
    if (teacher) setSelectedTeacher(teacher.user)
    if (assists.length > 0) {
      setSelectedAssistants(assists.map((a) => a.user))
    }
  }

  // ── Validação ──
  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome é obrigatório'
    if (!year || isNaN(Number(year)) || Number(year) < 2020 || Number(year) > 2099)
      e.year = 'Ano inválido'
    if (!shift) e.shift = 'Selecione o turno'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Sincroniza equipe no banco ──
  async function syncStaff(classId: string) {
    const currentUsers: User[] = [
      ...(selectedCoordinator ? [selectedCoordinator] : []),
      ...(selectedTeacher ? [selectedTeacher] : []),
      ...selectedAssistants.filter(Boolean) as User[],
    ]

    const originalIds = originalAssignments.map((a) => a.user.id)
    const currentIds = currentUsers.map((u) => u.id)

    // Removidos — preenche removed_at
    const removed = originalAssignments.filter(
      (a) => !currentIds.includes(a.user.id)
    )
    for (const r of removed) {
      await supabase
        .from('class_staff')
        .update({ removed_at: new Date().toISOString() })
        .eq('id', r.recordId)
    }

    // Novos — insere
    const newMembers = currentUsers.filter((u) => !originalIds.includes(u.id))
    for (const u of newMembers) {
      await supabase.from('class_staff').insert({
        school_id: schoolId,
        class_id: classId,
        user_id: u.id,
      })
    }
  }

  // ── Salvar ──
  async function handleSave() {
    if (!validate()) return
    setSaving(true)

    const payload = {
      school_id: schoolId,
      name: name.trim(),
      year: Number(year),
      type,
      level: level.trim() || null,
      shift,
    }

    if (mode === 'edit' && classData) {
      const { error } = await supabase
        .from('classes')
        .update(payload)
        .eq('id', classData.id)
        .eq('school_id', schoolId)

      if (error) {
        setErrors({ general: 'Erro ao salvar. Tente novamente.' })
        setSaving(false)
        return
      }
      await syncStaff(classData.id)

    } else {
      const { data: newClass, error } = await supabase
        .from('classes')
        .insert({ ...payload, active: true })
        .select('id')
        .single()

      if (error || !newClass) {
        setErrors({ general: 'Erro ao salvar. Tente novamente.' })
        setSaving(false)
        return
      }
      await syncStaff(newClass.id)
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  // ── Desativar ──
  async function handleDeactivate() {
    if (!classData) return
    setDeactivating(true)

    const { error } = await supabase
      .from('classes')
      .update({ active: false, deactivated_at: new Date().toISOString() })
      .eq('id', classData.id)
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

  // ── Nome de exibição ──
  const displayName = (u: User | null) =>
    u ? (u.nickname || u.name.split(' ')[0]) : '—'

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
          {mode === 'create' ? 'Nova turma' : classData?.name}
        </h2>

        {/* ── Visualização ── */}
        {mode === 'view' && classData && (
          <div className="flex flex-col">
            <DetailRow label="Nome" value={classData.name} />
            <DetailRow label="Ano letivo" value={classData.year.toString()} />
            <DetailRow label="Tipo" value={classTypeLabels[classData.type]} />
            <DetailRow label="Nível" value={classData.level} />
            <DetailRow label="Turno" value={classData.shift ? shiftLabels[classData.shift] : null} />

            <div className="mt-2">
              <span className="text-xs text-[#8C7060]">Equipe</span>
              <div className="flex justify-between py-2.5 border-b border-[#F0EAE3]">
                <span className="text-xs text-[#8C7060]">Coordenação</span>
                <span className="text-sm font-medium text-[#3A2E24]">{displayName(selectedCoordinator)}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-[#F0EAE3]">
                <span className="text-xs text-[#8C7060]">Professora</span>
                <span className="text-sm font-medium text-[#3A2E24]">{displayName(selectedTeacher)}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-[#F0EAE3]">
                <span className="text-xs text-[#8C7060]">Assistentes</span>
                <span className="text-sm font-medium text-[#3A2E24]">
                  {selectedAssistants.filter(Boolean).length > 0
                    ? selectedAssistants.filter(Boolean).map((u) => displayName(u)).join(', ')
                    : '—'
                  }
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-5">
              <Button variant="primary" onClick={() => setMode('edit')}>Editar</Button>

              {!confirmDeactivate ? (
                <Button variant="ghost" onClick={() => setConfirmDeactivate(true)}>
                  Desativar turma
                </Button>
              ) : (
                <div className="flex flex-col gap-2 p-4 rounded-[14px] bg-[#FFF5F7] border border-[#E86C88]/20">
                  <p className="text-sm text-[#3A2E24]">
                    Tem certeza? A turma ficará inativa mas os dados serão preservados.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" fullWidth={false} onClick={() => setConfirmDeactivate(false)}>
                      Cancelar
                    </Button>
                    <Button fullWidth={false} loading={deactivating} customColor="#E86C88" customTextColor="#fff" onClick={handleDeactivate}>
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
        {(mode === 'edit' || mode === 'create') && (
          <div className="flex flex-col gap-4">

            <Input
              label="Nome da turma"
              placeholder="Ex: Maternal 1 A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />

            <Input
              label="Ano letivo"
              type="number"
              placeholder={new Date().getFullYear().toString()}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              error={errors.year}
            />

            <ChipGroup
              label="Tipo"
              options={['regular', 'extracurricular'] as ClassType[]}
              labels={classTypeLabels}
              value={type}
              onChange={setType}
            />

            {type === 'regular' && (
              <Input
                label="Nível"
                placeholder="Ex: Berçário 1, Maternal A..."
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              />
            )}

            <ChipGroup
              label="Turno"
              options={['manha', 'tarde', 'noite', 'integral'] as Shift[]}
              labels={shiftLabels}
              value={shift}
              onChange={setShift}
              error={errors.shift}
            />

            {/* ── Equipe ── */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-[#3A2E24]">Equipe</span>

              {/* Coordenação */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#8C7060]">Coordenação</span>
                <PersonSearch
                  staffMembers={coordinators}
                  value={selectedCoordinator}
                  onChange={setSelectedCoordinator}
                  showClear={!!selectedCoordinator}
                  onClear={() => setSelectedCoordinator(null)}
                />
              </div>

              {/* Professora */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#8C7060]">Professora</span>
                <PersonSearch
                  staffMembers={teachers}
                  value={selectedTeacher}
                  onChange={setSelectedTeacher}
                  showClear={!!selectedTeacher}
                  onClear={() => setSelectedTeacher(null)}
                />
              </div>

              {/* Assistentes */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#8C7060]">Assistentes</span>
                {selectedAssistants.map((assistant, index) => (
                  <PersonSearch
                    key={index}
                    staffMembers={assistants}
                    value={assistant}
                    onChange={(u) => {
                      const updated = [...selectedAssistants]
                      updated[index] = u
                      setSelectedAssistants(updated)
                    }}
                    showClear={selectedAssistants.length > 1}
                    onClear={() => {
                      setSelectedAssistants(
                        selectedAssistants.filter((_, i) => i !== index)
                      )
                    }}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => setSelectedAssistants([...selectedAssistants, null])}
                  className="flex items-center gap-1 text-sm font-medium text-[#FF8C66] hover:text-[#e87a54] transition-colors w-fit"
                >
                  <span className="text-lg leading-none">+</span>
                  Adicionar assistente
                </button>
              </div>
            </div>

            {errors.general && (
              <span className="text-xs text-[#E86C88]">{errors.general}</span>
            )}

            <Button variant="primary" loading={saving} onClick={handleSave}>
              {mode === 'edit' ? 'Salvar alterações' : 'Criar turma'}
            </Button>

            <Button
              variant="ghost"
              onClick={() => mode === 'edit' ? setMode('view') : onClose()}
            >
              Cancelar
            </Button>

          </div>
        )}

      </div>
    </>
  )
}