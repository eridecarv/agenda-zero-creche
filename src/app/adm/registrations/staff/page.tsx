/**
 * StaffPage — listagem e gerenciamento de colaboradores.
 *
 * Exibe os colaboradores ativos da escola e permite criar, editar
 * e desativar via StaffModal (bottom sheet).
 *
 * Autenticação e school_id delegados ao hook useSchool.
 * Toda ação de escrita acontece dentro do StaffModal.
 *
 * Rota: /adm/registrations/staff
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StaffModal } from '@/components/ui/StaffModal'
import { createClient } from '@/lib/supabase'
import { useSchool } from '@/hooks/useSchool'
import type { User, Role } from '@/types'

const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  coordinator: 'Coordenador(a)',
  teacher: 'Professor(a)',
  assistant: 'Assistente',
  guardian: 'Responsável',
}

export default function StaffPage() {
  const router = useRouter()
  const supabase = createClient()
  const { schoolId, loading } = useSchool()

  const [staffMembers, setStaffMembers] = useState<User[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<User | undefined>(undefined)

  useEffect(() => {
    if (schoolId) loadStaff(schoolId)
  }, [schoolId])

  async function loadStaff(sid: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('school_id', sid)
      .eq('active', true)
      .in('role', ['coordinator', 'teacher', 'assistant'])
      .order('name')

    if (data) setStaffMembers(data)
  }

  function openNew() {
    setSelectedStaff(undefined)
    setModalOpen(true)
  }

  function openEdit(staffMember: User) {
    setSelectedStaff(staffMember)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setSelectedStaff(undefined)
  }

  function onSaved() {
    if (schoolId) loadStaff(schoolId)
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
              {staffMembers.length}{' '}
              {staffMembers.length === 1 ? 'colaborador ativo' : 'colaboradores ativos'}
            </p>
          </div>
          <Button variant="pill" fullWidth={false} onClick={openNew}>
            + Novo
          </Button>
        </div>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-3 max-w-lg mx-auto">
        {staffMembers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-[#B0A090] mb-4">Nenhum colaborador cadastrado ainda.</p>
            <Button variant="primary" fullWidth={false} onClick={openNew}>
              Cadastrar primeiro colaborador
            </Button>
          </div>
        )}

        {staffMembers.map((staffMember) => (
          <Card key={staffMember.id} onClick={() => openEdit(staffMember)}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-[#3A2E24]">
                  {staffMember.nickname || staffMember.name.split(' ')[0]}
                </span>
                <span className="text-xs text-[#8C7060]">
                  {staffMember.name} · {roleLabels[staffMember.role]}
                </span>
              </div>
              <span className="text-xs text-[#8C7060]">›</span>
            </div>
          </Card>
        ))}
      </div>

      {modalOpen && schoolId && (
        <StaffModal
          schoolId={schoolId}
          staffMember={selectedStaff}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
