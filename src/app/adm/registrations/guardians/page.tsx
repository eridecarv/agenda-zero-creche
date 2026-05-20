/**
 * GuardiansPage — listagem de responsáveis cadastrados.
 *
 * Exibe os responsáveis ativos da escola com suas crianças vinculadas.
 * Permite cadastrar novo responsável ou vincular existente via modal.
 *
 * Rota: /adm/registrations/guardians
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { GuardianModal } from '@/components/ui/GuardianModal'
import { createClient } from '@/lib/supabase'
import { useSchool } from '@/hooks/useSchool'

type GuardianWithChildren = {
  id: string
  name: string
  phone: string | null
  children: string[]    // nomes das crianças vinculadas
  hasPendingInvite: boolean
}

export default function GuardiansPage() {
  const router = useRouter()
  const supabase = createClient()
  const { schoolId, userId, loading } = useSchool()

  const [guardians, setGuardians] = useState<GuardianWithChildren[]>([])
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (schoolId) loadGuardians(schoolId)
  }, [schoolId])

  async function loadGuardians(sid: string) {
    const { data } = await supabase
      .from('users')
      .select(`
        id, name, phone,
        guardianships (
          child_id,
          end_date,
          children ( name )
        ),
        invites (
          used_at,
          expires_at
        )
      `)
      .eq('school_id', sid)
      .eq('role', 'guardian')
      .eq('active', true)
      .order('name')

    if (data) {
      const formatted: GuardianWithChildren[] = data.map((g: any) => {
        const children = g.guardianships
          ?.filter((gs: any) => gs.end_date === null)
          .map((gs: any) => gs.children?.name)
          .filter(Boolean) ?? []

        const hasPendingInvite = g.invites?.some(
          (i: any) => !i.used_at && new Date(i.expires_at) > new Date()
        ) ?? false

        return {
          id: g.id,
          name: g.name,
          phone: g.phone,
          children,
          hasPendingInvite,
        }
      })
      setGuardians(formatted)
    }
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
            <h1 className="font-display text-2xl font-bold text-[#3A2E24]">Responsáveis</h1>
            <p className="text-sm text-[#8C7060] mt-0.5">
              {guardians.length} {guardians.length === 1 ? 'responsável ativo' : 'responsáveis ativos'}
            </p>
          </div>
          <Button variant="pill" fullWidth={false} onClick={() => setModalOpen(true)}>
            + Novo
          </Button>
        </div>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-3 max-w-lg mx-auto">

        {guardians.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-[#B0A090] mb-4">Nenhum responsável cadastrado ainda.</p>
            <Button variant="primary" fullWidth={false} onClick={() => setModalOpen(true)}>
              Cadastrar primeiro responsável
            </Button>
          </div>
        )}

        {guardians.map((guardian) => (
          <Card key={guardian.id}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-[#3A2E24]">{guardian.name}</span>
                <span className="text-xs text-[#8C7060]">
                  {guardian.children.length > 0
                    ? guardian.children.join(', ')
                    : 'Sem criança vinculada'
                  }
                </span>
                {guardian.hasPendingInvite && (
                  <span className="text-xs text-[#F5C632] mt-0.5">⏳ Convite pendente</span>
                )}
              </div>
            </div>
          </Card>
        ))}

      </div>

      {modalOpen && schoolId && userId && (
        <GuardianModal
          schoolId={schoolId}
          userId={userId}
          onClose={() => setModalOpen(false)}
          onSaved={() => loadGuardians(schoolId)}
        />
      )}

    </div>
  )
}