/**
 * AssignmentList — lista dinâmica de atribuições com busca por nome.
 *
 * Usado para atribuir colaboradores a turmas, responsáveis a crianças,
 * ou qualquer relação onde o usuário escolhe um cargo e uma pessoa.
 *
 * Cada linha tem:
 * - Chips de cargo (coordenação, professora, assistente)
 * - Campo de busca por nome — filtra em tempo real os colaboradores do cargo
 * - Botão de remover (x)
 *
 * O componente é controlado — recebe a lista atual via `assignments`
 * e notifica mudanças via `onChange`. Não faz queries no banco —
 * recebe os colaboradores já carregados via `staffMembers`.
 *
 * Uso:
 *   <AssignmentList
 *     staffMembers={staffMembers}
 *     assignments={assignments}
 *     onChange={setAssignments}
 *   />
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import type { User, Role } from '@/types'

// ── Tipos ─────────────────────────────────────────────────────
export type Assignment = {
  id: string
  role: Role | null
  user: User | null
}

type AssignmentListProps = {
  staffMembers: User[]
  assignments: Assignment[]
  onChange: (assignments: Assignment[]) => void
}

// ── Cargos disponíveis ────────────────────────────────────────
const roleOptions: Role[] = ['coordenador', 'professor', 'auxiliar']

const roleLabels: Record<string, string> = {
  coordenador: 'Coordenação',
  professor: 'Professora',
  auxiliar: 'Assistente',
}

// ── Linha de atribuição ───────────────────────────────────────
function AssignmentRow({
  assignment,
  staffMembers,
  onChangeRole,
  onChangeUser,
  onRemove,
}: {
  assignment: Assignment
  staffMembers: User[]
  onChangeRole: (role: Role) => void
  onChangeUser: (user: User) => void
  onRemove: () => void
}) {
  const [search, setSearch] = useState(
    assignment.user?.nickname || assignment.user?.name.split(' ')[0] || ''
  )
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtra colaboradores pelo cargo e pelo texto de busca
  const filteredStaff = staffMembers.filter((s) => {
    if (assignment.role && s.role !== assignment.role) return false
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(term) ||
      (s.nickname?.toLowerCase().includes(term) ?? false)
    )
  })

  function selectUser(user: User) {
    onChangeUser(user)
    setSearch(user.nickname || user.name.split(' ')[0])
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-[14px] bg-[#FAF7F2] border border-[#E8E0D8]">

      {/* Chips de cargo + botão remover */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {roleOptions.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => {
                onChangeRole(role)
                setSearch('')
                onChangeUser(null as any)
              }}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-all duration-150
                ${assignment.role === role
                  ? 'bg-[#FF8C66] text-white'
                  : 'bg-white text-[#8C7060] border border-[#E8E0D8] hover:border-[#FF8C66]'
                }
              `}
            >
              {roleLabels[role]}
            </button>
          ))}
        </div>

        {/* Botão remover */}
        <button
          type="button"
          onClick={onRemove}
          className="
            w-7 h-7 shrink-0 flex items-center justify-center
            rounded-full text-[#B0A090] hover:text-[#E86C88] hover:bg-white
            transition-all duration-150 text-base
          "
        >
          ×
        </button>
      </div>

      {/* Campo de busca — só aparece quando cargo está selecionado */}
      {assignment.role && (
        <div className="relative" ref={ref}>
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
              w-full rounded-[10px] border border-[#E8E0D8] px-3 py-2 text-sm
              bg-white text-[#3A2E24] placeholder:text-[#C4B5A8]
              outline-none transition-all duration-200
              focus:border-[#FF8C66] focus:ring-2 focus:ring-[#FF8C66]/20
            "
          />

          {/* Dropdown de resultados */}
          {open && filteredStaff.length > 0 && (
            <div className="
              absolute top-full left-0 right-0 z-10 mt-1
              bg-[#FFFDF9] rounded-[10px] border border-[#E8E0D8]
              shadow-[0_4px_16px_rgba(180,140,120,0.16)]
              overflow-hidden
            ">
              {filteredStaff.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectUser(s)}
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
                    <span className="text-xs text-[#8C7060] ml-1">({s.name})</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Nenhum resultado */}
          {open && search.trim() && filteredStaff.length === 0 && (
            <div className="
              absolute top-full left-0 right-0 z-10 mt-1
              bg-[#FFFDF9] rounded-[10px] border border-[#E8E0D8]
              px-3 py-2.5
            ">
              <span className="text-xs text-[#B0A090]">Nenhum resultado</span>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
export function AssignmentList({
  staffMembers,
  assignments,
  onChange,
}: AssignmentListProps) {

  function addRow() {
    onChange([
      ...assignments,
      { id: crypto.randomUUID(), role: null, user: null },
    ])
  }

  function removeRow(id: string) {
    onChange(assignments.filter((a) => a.id !== id))
  }

  function updateRole(id: string, role: Role) {
    onChange(assignments.map((a) => a.id === id ? { ...a, role, user: null } : a))
  }

  function updateUser(id: string, user: User) {
    onChange(assignments.map((a) => a.id === id ? { ...a, user } : a))
  }

  return (
    <div className="flex flex-col gap-2">

      {assignments.length === 0 && (
        <p className="text-xs text-[#B0A090]">Nenhum colaborador atribuído ainda.</p>
      )}

      {assignments.map((assignment) => (
        <AssignmentRow
          key={assignment.id}
          assignment={assignment}
          staffMembers={staffMembers}
          onChangeRole={(role) => updateRole(assignment.id, role)}
          onChangeUser={(user) => updateUser(assignment.id, user)}
          onRemove={() => removeRow(assignment.id)}
        />
      ))}

      <button
        type="button"
        onClick={addRow}
        className="
          flex items-center gap-1.5 text-sm font-medium text-[#FF8C66]
          hover:text-[#e87a54] transition-colors w-fit mt-1
        "
      >
        <span className="text-lg leading-none">+</span>
        Adicionar colaborador
      </button>

    </div>
  )
}