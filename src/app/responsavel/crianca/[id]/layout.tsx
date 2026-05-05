// src/app/responsavel/crianca/[id]/layout.tsx
'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { BottomNav } from '@/components/ui/BottomNav'

export default function CriancaLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const id = params.id as string
  const base = `/responsavel/crianca/${id}`

  const itens = [
    {
      label: 'Início',
      icon: '🏠',
      href: base,
      ativo: pathname === base,
    },
    {
      label: 'Diário',
      icon: '📖',
      href: `${base}/diario`,
      ativo: pathname.startsWith(`${base}/diario`),
    },
    {
      label: 'Avisos',
      icon: '📢',
      href: `${base}/comunicados`,
      ativo: pathname.startsWith(`${base}/comunicados`),
    },
    {
      label: 'Perfil',
      icon: '👤',
      href: `${base}/perfil`,
      ativo: pathname.startsWith(`${base}/perfil`),
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <div className="flex-1 pb-24">
        {children}
      </div>
      <BottomNav itens={itens} />
    </div>
  )
}