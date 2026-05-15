/**
 * CadastrosPage — hub de navegação dos cadastros.
 *
 * Ponto de entrada para os cadastros do sistema:
 * turmas, colaboradores e crianças.
 *
 * Cada item navega para sua respectiva página de listagem,
 * onde o modal de criação/edição é aberto.
 *
 * Rota: /adm/cadastros
 */

'use client'

import { useRouter } from 'next/navigation'
import { useEscola } from '@/hooks/useEscola'

type CadastroItem = {
  label: string
  descricao: string
  emoji: string
  href: string
}

const cadastros: CadastroItem[] = [
  {
    label: 'Turmas',
    descricao: 'Crie e gerencie as turmas da escola',
    emoji: '🏫',
    href: '/adm/cadastros/turmas',
  },
  {
    label: 'Colaboradores',
    descricao: 'Professores, assistentes e coordenadores',
    emoji: '👩‍🏫',
    href: '/adm/cadastros/colaboradores',
  },
  {
    label: 'Crianças',
    descricao: 'Cadastre as crianças e vincule às turmas',
    emoji: '🧒',
    href: '/adm/cadastros/criancas',
  },
]

export default function CadastrosPage() {
  const router = useRouter()
  const { loading } = useEscola()

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
      <div className="bg-[#FFFDF9] px-5 pt-12 pb-6 shadow-[0_2px_8px_rgba(180,140,120,0.08)]">
        <button
          onClick={() => router.back()}
          className="text-sm text-[#8C7060] mb-3 flex items-center gap-1"
        >
          ← Voltar
        </button>
        <h1 className="font-display text-2xl font-bold text-[#3A2E24]">Cadastros</h1>
        <p className="text-sm text-[#8C7060] mt-0.5">Gerencie os dados da escola</p>
      </div>

      {/* Lista */}
      <div className="px-5 pt-6 flex flex-col gap-3 max-w-lg mx-auto">
        {cadastros.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="
              w-full text-left rounded-[20px] bg-[#FFFDF9] p-5
              shadow-[0_2px_8px_rgba(180,140,120,0.12)]
              active:scale-[0.97] hover:shadow-[0_4px_16px_rgba(180,140,120,0.16)]
              transition-all duration-200 cursor-pointer
            "
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-[#3A2E24]">{item.label}</span>
                  <span className="text-xs text-[#8C7060]">{item.descricao}</span>
                </div>
              </div>
              <span className="text-xs text-[#8C7060]">›</span>
            </div>
          </button>
        ))}
      </div>

    </div>
  )
}