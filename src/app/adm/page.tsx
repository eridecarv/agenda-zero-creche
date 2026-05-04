/**
 * AdmPage — página inicial do painel administrativo.
 *
 * Hub de navegação principal do adm. Agrupa os acessos
 * às seções do sistema: cadastros, comunicados, cardápio,
 * ocorrências e configurações.
 *
 * Por enquanto exibe apenas os cadastros. As demais seções
 * serão adicionadas conforme o desenvolvimento avança.
 *
 * Rota: /adm
 */

"use client";

import { useRouter } from "next/navigation";
import { useEscola } from "@/hooks/useEscola";
import { createClient } from '@/lib/supabase'

// ── Tipo de item de navegação ──
type NavItem = {
  label: string;
  descricao: string;
  emoji: string;
  href: string;
  disponivel: boolean;
};

const navItems: NavItem[] = [
  {
    label: "Cadastros",
    descricao: "Turmas, crianças, colaboradores e responsáveis",
    emoji: "📋",
    href: "/adm/cadastros",
    disponivel: true,
  },
  {
    label: "Ocorrências",
    descricao: "Registre e acompanhe ocorrências das crianças",
    emoji: "📝",
    href: "/adm/ocorrencias",
    disponivel: false,
  },
  {
    label: "Comunicados",
    descricao: "Envie avisos para turmas ou toda a escola",
    emoji: "📣",
    href: "/adm/comunicados",
    disponivel: false,
  },
  {
    label: "Cardápio",
    descricao: "Gerencie o cardápio semanal",
    emoji: "🍽",
    href: "/adm/cardapio",
    disponivel: false,
  },
  {
    label: "Configurações",
    descricao: "Dados da escola e preferências",
    emoji: "⚙️",
    href: "/adm/configuracoes",
    disponivel: false,
  },
];

export default function AdmPage() {
  const router = useRouter();
  const { loading } = useEscola();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <span className="text-sm text-[#8C7060]">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      {/* Header */}
      <div className="bg-[#FFFDF9] px-5 pt-12 pb-6 shadow-[0_2px_8px_rgba(180,140,120,0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8C7060] mb-1">Painel administrativo</p>
            <h1 className="font-display text-2xl font-bold text-[#3A2E24]">
              Agenda Zero
            </h1>
          </div>
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="text-sm text-[#8C7060] hover:text-[#E86C88] transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Navegação */}
      <div className="px-5 pt-6 flex flex-col gap-3 max-w-lg mx-auto">
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => item.disponivel && router.push(item.href)}
            disabled={!item.disponivel}
            className={`
              w-full text-left rounded-[20px] bg-[#FFFDF9] p-5
              shadow-[0_2px_8px_rgba(180,140,120,0.12)]
              transition-all duration-200
              ${
                item.disponivel
                  ? "active:scale-[0.97] hover:shadow-[0_4px_16px_rgba(180,140,120,0.16)] cursor-pointer"
                  : "opacity-40 cursor-not-allowed"
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-[#3A2E24]">
                    {item.label}
                  </span>
                  <span className="text-xs text-[#8C7060]">
                    {item.descricao}
                  </span>
                </div>
              </div>
              {item.disponivel ? (
                <span className="text-xs text-[#8C7060]">›</span>
              ) : (
                <span className="text-xs text-[#C4B5A8]">em breve</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
