// src/app/guardian/child/[id]/layout.tsx
/**
 * Layout da área da criança — responsável.
 *
 * Envolve todas as páginas dentro de /guardian/child/[id].
 * Renderiza o BottomNav com cinco abas:
 *   🏠 Início   → volta para a seleção de criança (/guardian)
 *   ☀️ Hoje     → diário do dia atual da criança selecionada
 *   📖 Diário   → histórico de dias anteriores
 *   📢 Avisos   → comunicados da escola
 *   👤 Perfil   → informações da criança, equipe e responsáveis
 *
 * A casinha não tem estado "ativo" — funciona como saída da área
 * da criança, não como uma aba navegável dentro dela.
 */

'use client'

import { useParams, usePathname } from 'next/navigation'
import { BottomNav } from '@/components/ui/BottomNav'

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const id = params.id as string
  const base = `/guardian/child/${id}`

  const items = [
    {
      label: 'Início',
      icon: '🏠',
      href: '/guardian',
      active: false,
    },
    {
      label: 'Hoje',
      icon: '☀️',
      href: base,
      active: pathname === base,
    },
    {
      label: 'Diário',
      icon: '📖',
      href: `${base}/dailylog`,
      active: pathname.startsWith(`${base}/dailylog`),
    },
    {
      label: 'Avisos',
      icon: '📢',
      href: `${base}/announcements`,
      active: pathname.startsWith(`${base}/announcements`),
    },
    {
      label: 'Perfil',
      icon: '👤',
      href: `${base}/perfil`,
      active: pathname.startsWith(`${base}/perfil`),
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <div className="flex-1 pb-24">
        {children}
      </div>
      <BottomNav items={items} />
    </div>
  )
}