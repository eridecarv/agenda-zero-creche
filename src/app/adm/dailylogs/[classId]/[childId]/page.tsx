/**
 * DailyLogChildPage — registro do diário de uma criança.
 * Rota: /adm/dailylogs/[classId]/[childId]
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { DailyLogForm } from '@/components/ui/DailyLogForm'
import { Avatar } from '@/components/ui/Avatar'
import type { Child } from '@/types'

export default function DailyLogChildPage() {
  const router = useRouter()
  const params = useParams()
  const classId = params.classId as string
  const childId = params.childId as string
  const supabase = createClient()

  const [child, setChild] = useState<Child | null>(null)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      const { data: userData } = await supabase
        .from('users')
        .select('school_id')
        .eq('id', user.id)
        .single()

      if (userData) setSchoolId(userData.school_id)

      const { data: childData } = await supabase
        .from('children')
        .select('*')
        .eq('id', childId)
        .single()

      if (childData) setChild(childData)

      setLoading(false)
    }
    load()
  }, [childId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <span className="text-sm text-[#8C7060]">Carregando...</span>
      </div>
    )
  }

  if (!child || !schoolId || !userId) return null

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      {/* Header */}
      <div className="bg-[#FFFDF9] px-5 pt-12 pb-6 shadow-[0_2px_8px_rgba(180,140,120,0.08)]">
        <button
          onClick={() => router.push(`/adm/dailylogs/${classId}`)}
          className="text-sm text-[#8C7060] mb-3 flex items-center gap-1"
        >
          ← Turma
        </button>
        <div className="flex items-center gap-3">
          <Avatar name={child.name} size="md" />
          <div>
            <h1 className="font-display text-xl font-bold text-[#3A2E24]">{child.name}</h1>
            <p className="text-xs text-[#8C7060] mt-0.5">
              Diário de hoje ·{' '}
              {new Date().toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        <DailyLogForm
          childId={childId}
          schoolId={schoolId}
          date={today}
          recordedBy={userId}
          onSaved={() => router.push(`/adm/dailylogs/${classId}`)}
        />
      </div>
    </div>
  )
}
