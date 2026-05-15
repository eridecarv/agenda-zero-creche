/**
 * StaffModal — bottom sheet para visualização e edição de colaborador.
 *
 * Tem três modos:
 * - Visualização: exibe os dados em texto, sem campos editáveis.
 *   Botões de "Editar" e "Desativar" disponíveis.
 * - Edição: campos editáveis. Ativado ao clicar em "Editar".
 * - Criação: campos vazios para novo colaborador.
 *
 * Campos: nome completo, apelido, role.
 * O apelido é como o colaborador assina registros e ocorrências
 * para as famílias. Se não tiver apelido, usa o primeiro nome.
 *
 * Props:
 * - staffMember: se vier, abre em visualização. Se não, abre em criação.
 * - schoolId: obrigatório para todas as operações no banco.
 * - onClose: fecha o modal.
 * - onSaved: chamado após salvar ou desativar — página recarrega a lista.
 */

'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase'
import type { User, Role } from '@/types'

// ── Roles disponíveis para colaboradores ─────────────────────
const roleOptions: Role[] = ['coordenador', 'professor', 'auxiliar']

const roleLabels: Record<Role, string> = {
  adm: 'Administrador',
  coordenador: 'Coordenador(a)',
  professor: 'Professor(a)',
  auxiliar: 'Assistente',
  responsavel: 'Responsável',
}

// ── Props ─────────────────────────────────────────────────────
type StaffModalProps = {
  schoolId: string
  staffMember?: User
  onClose: () => void
  onSaved: () => void
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
  labels: Record<string, string>
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

// ── Modal ─────────────────────────────────────────────────────
export function StaffModal({
  schoolId,
  staffMember,
  onClose,
  onSaved,
}: StaffModalProps) {
  const supabase = createClient()

  const [mode, setMode] = useState<'view' | 'edit' | 'create'>(
    staffMember ? 'view' : 'create'
  )

  // Form
  const [name, setName] = useState(staffMember?.name ?? '')
  const [nickname, setNickname] = useState(staffMember?.nickname ?? '')
  const [role, setRole] = useState<Role | null>(
    staffMember?.role && roleOptions.includes(staffMember.role)
      ? staffMember.role
      : null
  )

  // Estado
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  // ── Validação ──
  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome é obrigatório'
    if (!role) e.role = 'Selecione a função'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Salvar ──
  async function handleSave() {
    if (!validate()) return
    setSaving(true)

    const payload = {
      school_id: schoolId,
      name: name.trim(),
      nickname: nickname.trim() || null,
      role: role!,
      active: true,
    }

    if (mode === 'edit' && staffMember) {
      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', staffMember.id)
        .eq('school_id', schoolId)

      if (error) {
        setErrors({ general: 'Erro ao salvar. Tente novamente.' })
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('users')
        .insert(payload)

      if (error) {
        setErrors({ general: 'Erro ao salvar. Tente novamente.' })
        setSaving(false)
        return
      }
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  // ── Desativar ──
  async function handleDeactivate() {
    if (!staffMember) return
    setDeactivating(true)

    const { error } = await supabase
      .from('users')
      .update({
        active: false,
        deactivated_at: new Date().toISOString(),
      })
      .eq('id', staffMember.id)
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
  const displayName = staffMember?.nickname || staffMember?.name.split(' ')[0] || ''

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
          {mode === 'create' ? 'Novo colaborador' : displayName}
        </h2>

        {/* ── Modo visualização ── */}
        {mode === 'view' && staffMember && (
          <div className="flex flex-col">

            <DetailRow label="Nome completo" value={staffMember.name} />
            <DetailRow label="Apelido" value={staffMember.nickname} />
            <DetailRow label="Função" value={roleLabels[staffMember.role]} />

            <div className="flex flex-col gap-2 mt-5">
              <Button variant="primary" onClick={() => setMode('edit')}>
                Editar
              </Button>

              {!confirmDeactivate ? (
                <Button variant="ghost" onClick={() => setConfirmDeactivate(true)}>
                  Desativar colaborador
                </Button>
              ) : (
                <div className="flex flex-col gap-2 p-4 rounded-[14px] bg-[#FFF5F7] border border-[#E86C88]/20">
                  <p className="text-sm text-[#3A2E24]">
                    Tem certeza? O colaborador ficará inativo mas os dados serão preservados.
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

        {/* ── Modo edição / criação ── */}
        {(mode === 'edit' || mode === 'create') && (
          <div className="flex flex-col gap-4">

            <Input
              label="Nome completo"
              placeholder="Ex: Josemar Cardoso Marques"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />

            <Input
              label="Apelido"
              placeholder="Ex: Tia Josi"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <span className="-mt-2 text-xs text-[#8C7060]">
              Como aparece para as famílias e assina os registros.
              Se não preenchido, usa o primeiro nome.
            </span>

            <ChipGroup
              label="Função"
              options={roleOptions}
              labels={roleLabels}
              value={role}
              onChange={setRole}
              error={errors.role}
            />

            {errors.general && (
              <span className="text-xs text-[#E86C88]">{errors.general}</span>
            )}

            <Button variant="primary" loading={saving} onClick={handleSave}>
              {mode === 'edit' ? 'Salvar alterações' : 'Criar colaborador'}
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