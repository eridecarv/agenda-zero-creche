/**
 * DailyLogsClassPage — lista de crianças da turma para registro.
 * Rota: /adm/dailylogs/[classId]
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import type { Child, Class } from '@/types'

export default function DailyLogsClassPage() {
  const router = useRouter()
  const params = useParams()
  const classId = params.classId as string
  const supabase = createClient()

  const [currentClass, setCurrentClass] = useState<Class | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: cls } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single()

      if (cls) setCurrentClass(cls)

      const { data: cc } = await supabase
        .from('child_class')
        .select('children(*)')
        .eq('class_id', classId)
        .is('end_date', null)

      if (cc) {
        const list = cc
          .map((r: any) => r.children)
          .filter(Boolean)
          .sort((a: Child, b: Child) => a.name.localeCompare(b.name))
        setChildren(list)
      }

      setLoading(false)
    }
    load()
  }, [classId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <span className="text-sm text-[#8C7060]">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">

      {/* Header */}
      <div className="bg-[#FFFDF9] px-5 pt-12 pb-6 shadow-[0_2px_8px_rgba(180,140,120,0.08)]">
        <button
          onClick={() => router.push('/adm/dailylogs')}
          className="text-sm text-[#8C7060] mb-3 flex items-center gap-1"
        >
          ← Diários
        </button>
        <h1 className="font-display text-2xl font-bold text-[#3A2E24]">
          {currentClass?.name ?? 'Turma'}
        </h1>
        <p className="text-xs text-[#8C7060] mt-1">
          {children.length} {children.length === 1 ? 'criança' : 'crianças'}
        </p>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto flex flex-col gap-3">
        {children.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">👶</p>
            <p className="text-sm text-[#B0A090]">Nenhuma criança nesta turma.</p>
          </div>
        )}

        {children.map(child => (
          <button
            key={child.id}
            onClick={() => router.push(`/adm/dailylogs/${classId}/${child.id}`)}
            className="
              w-full text-left rounded-[20px] bg-[#FFFDF9] p-4
              shadow-[0_2px_8px_rgba(180,140,120,0.12)]
              flex items-center gap-4
              active:scale-[0.97] transition-all duration-200
            "
          >
            <Avatar name={child.name} size="sm" />
            <span className="flex-1 text-sm font-semibold text-[#3A2E24]">
              {child.name}
            </span>
            <span className="
              text-xs font-medium text-[#FF8C66]
              bg-[#FFF0E8] px-3 py-1 rounded-full
            ">
              + Registrar
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}