/**
 * Página inicial temporária.
 * Será substituída pelo dashboard quando estiver pronto.
 */

'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Agenda Zero</h1>
      <p className="text-sm text-gray-500">Você está logado.</p>
      <button
        onClick={handleLogout}
        className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
      >
        Sair
      </button>
    </main>
  )
}
