/**
 * ClassroomsPage — listagem e gerenciamento de turmas da escola.
 *
 * Exibe as turmas ativas da escola e permite criar, editar
 * e desativar turmas via ClassModal (bottom sheet).
 *
 * Autenticação e school_id delegados ao hook useSchool.
 * Toda ação de escrita (criar/editar/desativar) acontece dentro
 * do ClassModal — esta página só controla a lista e o estado do modal.
 *
 * Rota: /adm/registrations/classrooms
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ClassModal } from '@/components/ui/ClassModal'
import { createClient } from '@/lib/supabase'
import { useSchool } from '@/hooks/useSchool'
import type { Class, Shift } from '@/types'

const shiftLabels: Record<Shift, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
}

export default function ClassroomsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { schoolId, loading } = useSchool()

  const [classes, setClasses] = useState<Class[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | undefined>(undefined)

  useEffect(() => {
    if (schoolId) loadClasses(schoolId)
  }, [schoolId])

  async function loadClasses(sid: string) {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('school_id', sid)
      .eq('active', true)
      .order('name')

    if (data) setClasses(data)
  }

  function openNew() {
    setSelectedClass(undefined)
    setModalOpen(true)
  }

  function openEdit(cls: Class) {
    setSelectedClass(cls)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setSelectedClass(undefined)
  }

  function onSaved() {
    if (schoolId) loadClasses(schoolId)
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
            <h1 className="font-display text-2xl font-bold text-[#3A2E24]">Turmas</h1>
            <p className="text-sm text-[#8C7060] mt-0.5">
              {classes.length} {classes.length === 1 ? 'turma ativa' : 'turmas ativas'}
            </p>
          </div>
          <Button variant="pill" fullWidth={false} onClick={openNew}>
            + Nova turma
          </Button>
        </div>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-3 max-w-lg mx-auto">

        {classes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-[#B0A090] mb-4">Nenhuma turma cadastrada ainda.</p>
            <Button variant="primary" fullWidth={false} onClick={openNew}>
              Criar primeira turma
            </Button>
          </div>
        )}

        {classes.map((cls) => (
          <Card key={cls.id} onClick={() => openEdit(cls)}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-[#3A2E24]">{cls.name}</span>
                <span className="text-xs text-[#8C7060]">
                  {[
                    cls.level,
                    cls.shift ? shiftLabels[cls.shift as Shift] : null,
                    cls.year,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              <span className="text-xs text-[#8C7060]">›</span>
            </div>
          </Card>
        ))}

      </div>

      {modalOpen && schoolId && (
        <ClassModal
          schoolId={schoolId}
          class={selectedClass}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}

    </div>
  )
}