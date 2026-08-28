// src/app/guardian/child/[id]/perfil/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Child } from '@/types/child'
import type { Class } from '@/types/class'

type Guardian = {
  name: string
  relation: string
  type: string
}

type StaffMember = {
  name: string
  role: string
}

const RELATION_LABEL: Record<string, string> = {
  mae: 'Mãe',
  pai: 'Pai',
  avo: 'Avô',
  ava: 'Avó',
  tio: 'Tio',
  tia: 'Tia',
  outro: 'Responsável',
}

const ROLE_LABEL: Record<string, string> = {
  coordenador: 'Coordenação',
  professor: 'Professor',
  auxiliar: 'Auxiliar',
}

const ROLE_EMOJI: Record<string, string> = {
  coordenador: '👩‍💼',
  professor: '👩‍🏫',
  auxiliar: '🧑‍🤝‍🧑',
}

const LEVEL_LABEL: Record<string, string> = {
  bercario_1: 'Berçário I',
  bercario_2: 'Berçário II',
  maternal_1: 'Maternal I',
  maternal_2: 'Maternal II',
}

const SHIFT_LABEL: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  integral: 'Integral',
  noite: 'Noite',
}

function calculateAge(birthDate: string | null): string {
  if (!birthDate) return ''
  const nasc = new Date(birthDate)
  const hoje = new Date()
  const meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth())
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(meses / 12)
  const mesesRest = meses % 12
  if (mesesRest === 0) return `${anos} ${anos === 1 ? 'ano' : 'anos'}`
  return `${anos}a ${mesesRest}m`
}

type InfoRowProps = {
  emoji: string
  label: string
  value: string
}

function InfoRow({ emoji, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-[#F0E8E0] last:border-0">
      <div className="w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center text-base bg-[#FFF0E8]">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#B0A090] mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-[#3A2E24] leading-snug">{value}</p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [child, setChild] = useState<Child | null>(null)
  const [currentClass, setCurrentClass] = useState<Class | null>(null)
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Criança
      const { data: childData } = await supabase.from('children').select('*').eq('id', id).single()

      if (!childData) {
        router.push('/guardian')
        return
      }
      setChild(childData)

      // Turma atual
      const { data: cc } = await supabase
        .from('child_class')
        .select('class_id, classes(*)')
        .eq('child_id', id)
        .is('end_date', null)
        .single()

      const cls = cc ? ((cc as any).classes as Class) : null
      if (cls) setCurrentClass(cls)

      // Responsáveis — busca separada para evitar bloqueio de RLS no join
      const { data: guardianships } = await supabase
        .from('guardianships')
        .select('type, relation, user_id')
        .eq('child_id', id)
        .eq('active', true)
        .is('end_date', null)

      if (guardianships && guardianships.length > 0) {
        const ids = guardianships.map((g: any) => g.user_id)
        const { data: users } = await supabase.from('users').select('id, name').in('id', ids)

        if (users) {
          setGuardians(
            guardianships.map((g: any) => {
              const u = users.find((u: any) => u.id === g.user_id)
              return {
                name: u?.name ?? '—',
                relation: g.relation ?? 'outro',
                type: g.type,
              }
            })
          )
        }
      }

      // Equipe da turma
      if (cc?.class_id) {
        const { data: staff } = await supabase
          .from('class_staff')
          .select('user_id, users(name, role)')
          .eq('class_id', cc.class_id)
          .is('removed_at', null)

        if (staff) {
          setStaffMembers(
            staff.map((s: any) => ({
              name: s.users?.name ?? '—',
              role: s.users?.role ?? '',
            }))
          )
        }
      }

      setLoading(false)
    }
    init()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <span className="text-sm text-[#8C7060]">Carregando...</span>
      </div>
    )
  }

  if (!child) return null

  const classDescription = currentClass
    ? [
        currentClass.name,
        currentClass.level ? (LEVEL_LABEL[currentClass.level] ?? currentClass.level) : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'Sem turma'

  const shiftDescription = currentClass?.shift ? SHIFT_LABEL[currentClass.shift] : '—'

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-8">
      {/* Header */}
      <div className="px-5 pt-12 pb-8 bg-gradient-to-br from-[#FFF0E8] to-[#EAF3DE]">
        <div className="flex flex-col items-center gap-3 max-w-lg mx-auto">
          <Avatar name={child.name} size="lg" />
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-[#3A2E24]">{child.name}</h1>
            {child.birth_date && (
              <p className="text-sm text-[#8C7060] mt-0.5">{calculateAge(child.birth_date)}</p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {currentClass && (
              <Badge label={currentClass.name} color="#EAF3DE" textColor="#3A7A42" />
            )}
            {currentClass?.level && (
              <Badge
                label={LEVEL_LABEL[currentClass.level] ?? currentClass.level}
                color="#FFF0E8"
                textColor="#C05A2A"
              />
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-5 pt-6 max-w-lg mx-auto flex flex-col gap-4">
        {/* Turma */}
        <Card padding="lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#B0A090] mb-1">
            Turma
          </p>
          <InfoRow emoji="🏫" label="Turma" value={classDescription} />
          <InfoRow emoji="🕐" label="Turno" value={shiftDescription} />
        </Card>

        {/* Família */}
        <Card padding="lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#B0A090] mb-1">
            Família
          </p>
          {guardians.length === 0 ? (
            <InfoRow emoji="👨‍👩‍👧" label="Responsáveis" value="—" />
          ) : (
            guardians.map((g, i) => (
              <InfoRow
                key={i}
                emoji={g.type === 'principal' ? '👩‍👧' : '👤'}
                label={RELATION_LABEL[g.relation] ?? 'Responsável'}
                value={g.name}
              />
            ))
          )}
        </Card>

        {/* Equipe */}
        {staffMembers.length > 0 && (
          <Card padding="lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#B0A090] mb-1">
              Equipe
            </p>
            {staffMembers.map((s, i) => (
              <InfoRow
                key={i}
                emoji={ROLE_EMOJI[s.role] ?? '👤'}
                label={ROLE_LABEL[s.role] ?? s.role}
                value={s.name}
              />
            ))}
          </Card>
        )}

        {/* Saúde */}
        <Card padding="lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#B0A090] mb-1">
            Saúde
          </p>
          <InfoRow
            emoji="💊"
            label="Observações"
            value={child.notes || 'Nenhuma restrição registrada'}
          />
        </Card>
      </div>
    </div>
  )
}
