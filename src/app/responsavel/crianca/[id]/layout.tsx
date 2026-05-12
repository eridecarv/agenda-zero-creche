// src/app/responsavel/crianca/[id]/layout.tsx
/**
 * Layout da área da criança — responsável.
 *
 * Envolve todas as páginas dentro de /responsavel/crianca/[id].
 * Renderiza o BottomNav com cinco abas:
 *   🏠 Início   → volta para a seleção de criança (/responsavel)
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

export default function CriancaLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const id = params.id as string
  const base = `/responsavel/crianca/${id}`

  const itens = [
    {
      label: 'Início',
      icon: '🏠',
      href: '/responsavel',           // ← volta para seleção de criança
      ativo: false,                   // nunca "ativo" — é uma saída, não uma aba
    },
    {
      label: 'Hoje',
      icon: '☀️',
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