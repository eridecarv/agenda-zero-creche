/**
 * useSchool — hook de autenticação e contexto de escola.
 *
 * Busca o usuário logado via Supabase Auth e retorna o school_id
 * e userId correspondentes na tabela `users`.
 *
 * Se não houver sessão ativa ou o usuário não for encontrado,
 * redireciona automaticamente para /login.
 *
 * Uso:
 *   const { schoolId, userId, loading } = useSchool()
 *
 * Toda página do painel adm deve usar esse hook no lugar de
 * reescrever a lógica de auth manualmente.
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Role } from '@/types'

type UseSchoolResult = {
  schoolId: string | null
  userId: string | null
  loading: boolean
  role: Role | null
}

export function useSchool(): UseSchoolResult {
  const router = useRouter()
  const supabase = createClient()

  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('id, school_id, role')
        .eq('id', user.id)
        .single()

      if (error || !userData) {
        router.push('/login')
        return
      }

      if (userData.role === 'guardian') {
        router.push('/guardian')
        return
      }
      setUserId(userData.id)
      setSchoolId(userData.school_id)
      setRole(userData.role)
      setLoading(false)
    }
    init()
  }, [])

  return { schoolId, userId, loading, role }
}
