/**
 * ChildrenPage — listagem e gerenciamento de crianças.
 *
 * Exibe as crianças ativas da escola com turma atual e
 * permite criar, editar e desativar via ChildModal.
 *
 * Autenticação e school_id delegados ao hook useSchool.
 * Toda ação de escrita acontece dentro do ChildModal.
 *
 * Rota: /adm/registrations/children
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChildModal } from '@/components/ui/ChildModal'
import { createClient } from '@/lib/supabase'
import { useSchool } from '@/hooks/useSchool'
import type { Child } from '@/types'
import { calculateAge } from '@/lib/calculateAge'

// ── Tipo local com turma atual ────────────────────────────────
type ChildWithClass = Child & {
  class_name: string | null
}



export default function ChildrenPage() {
  const router = useRouter()
  const supabase = createClient()
  const { schoolId, userId, loading } = useSchool()

  const [children, setChildren] = useState<ChildWithClass[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedChild, setSelectedChild] = useState<Child | undefined>(undefined)

  useEffect(() => {
    if (schoolId) loadChildren(schoolId)
  }, [schoolId])

  async function loadChildren(sid: string) {
    const { data } = await supabase
      .from('children')
      .select(`
        *,
        child_class!left (
          end_date,
          classes ( name )
        )
      `)
      .eq('school_id', sid)
      .eq('active', true)
      .order('name')

    if (data) {
      const formatted: ChildWithClass[] = data.map((c: any) => {
        const activeEnrollment = c.child_class?.find((cc: any) => cc.end_date === null)
        return {
          ...c,
          class_name: activeEnrollment?.classes?.name ?? null,
          child_class: undefined,
        }
      })
      setChildren(formatted)
    }
  }

  function openNew() {
    setSelectedChild(undefined)
    setModalOpen(true)
  }

  function openEdit(child: Child) {
    setSelectedChild(child)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setSelectedChild(undefined)
  }

  function onSaved() {
    if (schoolId) loadChildren(schoolId)
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
            <h1 className="font-display text-2xl font-bold text-[#3A2E24]">Crianças</h1>
            <p className="text-sm text-[#8C7060] mt-0.5">
              {children.length} {children.length === 1 ? 'criança ativa' : 'crianças ativas'}
            </p>
          </div>
          <Button variant="pill" fullWidth={false} onClick={openNew}>
            + Nova
          </Button>
        </div>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-3 max-w-lg mx-auto">

        {children.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-[#B0A090] mb-4">Nenhuma criança cadastrada ainda.</p>
            <Button variant="primary" fullWidth={false} onClick={openNew}>
              Cadastrar primeira criança
            </Button>
          </div>
        )}

        {children.map((child) => (
          <Card key={child.id} onClick={() => openEdit(child)}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-[#3A2E24]">{child.name}</span>
                <span className="text-xs text-[#8C7060]">
                  {[
                    calculateAge(child.birth_date),
                    child.class_name ?? 'Sem turma',
                  ].filter(Boolean).join(' · ')}
                </span>
                {child.notes && (
                  <span className="text-xs text-[#E86C88] mt-0.5">⚠ {child.notes}</span>
                )}
              </div>
              <span className="text-xs text-[#8C7060]">›</span>
            </div>
          </Card>
        ))}

      </div>

      {modalOpen && schoolId && userId && (
        <ChildModal
          schoolId={schoolId}
          userId={userId}
          child={selectedChild}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}

    </div>
  )
}