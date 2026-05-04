/**
 * useEscola — hook de autenticação e contexto de escola.
 *
 * Busca o usuário logado via Supabase Auth e retorna o escola_id
 * e usuarioId correspondentes na tabela `usuarios`.
 *
 * Se não houver sessão ativa ou o usuário não for encontrado,
 * redireciona automaticamente para /login.
 *
 * Uso:
 *   const { escolaId, usuarioId, loading } = useEscola()
 *
 * Toda página do painel adm deve usar esse hook no lugar de
 * reescrever a lógica de auth manualmente.
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type UseEscolaResult = {
  escolaId: string | null
  usuarioId: string | null
  loading: boolean
}

export function useEscola(): UseEscolaResult {
  const router = useRouter()
  const supabase = createClient()

  const [escolaId, setEscolaId] = useState<string | null>(null)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('id, escola_id')
        .eq('id', user.id)
        .single()


      if (error || !usuario) { router.push('/login'); return }

      setUsuarioId(usuario.id)
      setEscolaId(usuario.escola_id)
      setLoading(false)
    }
    init()
  }, [])

  return { escolaId, usuarioId, loading }
}