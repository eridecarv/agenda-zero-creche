/**
 * AtribuicaoLista — lista dinâmica de atribuições com busca por nome.
 *
 * Usado para atribuir colaboradores a turmas, responsáveis a crianças,
 * ou qualquer relação onde o usuário escolhe um cargo e uma pessoa.
 *
 * Cada linha tem:
 * - Chips de cargo (coordenação, professora, assistente)
 * - Campo de busca por nome — filtra em tempo real os colaboradores do cargo
 * - Botão de remover (x)
 *
 * O componente é controlado — recebe a lista atual via `atribuicoes`
 * e notifica mudanças via `onChange`. Não faz queries no banco —
 * recebe os colaboradores já carregados via `colaboradores`.
 *
 * Uso:
 *   <AtribuicaoLista
 *     colaboradores={colaboradores}
 *     atribuicoes={atribuicoes}
 *     onChange={setAtribuicoes}
 *   />
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import type { Usuario, Role } from '@/types'

// ── Tipos ─────────────────────────────────────────────────────
export type Atribuicao = {
  id: string
  cargo: Role | null
  usuario: Usuario | null
}

type AtribuicaoListaProps = {
  colaboradores: Usuario[]
  atribuicoes: Atribuicao[]
  onChange: (atribuicoes: Atribuicao[]) => void
}

// ── Cargos disponíveis ────────────────────────────────────────
const cargoOptions: Role[] = ['coordenador', 'professor', 'auxiliar']

const cargoLabels: Record<string, string> = {
  coordenador: 'Coordenação',
  professor: 'Professora',
  auxiliar: 'Assistente',
}

// ── Linha de atribuição ───────────────────────────────────────
function AtribuicaoLinha({
  atribuicao,
  colaboradores,
  onChangeCargo,
  onChangeUsuario,
  onRemover,
}: {
  atribuicao: Atribuicao
  colaboradores: Usuario[]
  onChangeCargo: (cargo: Role) => void
  onChangeUsuario: (usuario: Usuario) => void
  onRemover: () => void
}) {
  const [busca, setBusca] = useState(
    atribuicao.usuario?.apelido || atribuicao.usuario?.nome.split(' ')[0] || ''
  )
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  // Filtra colaboradores pelo cargo e pelo texto de busca
  const colaboradoresFiltrados = colaboradores.filter((c) => {
    if (atribuicao.cargo && c.role !== atribuicao.cargo) return false
    if (!busca.trim()) return true
    const termo = busca.toLowerCase()
    return (
      c.nome.toLowerCase().includes(termo) ||
      (c.apelido?.toLowerCase().includes(termo) ?? false)
    )
  })

  function selecionarUsuario(usuario: Usuario) {
    onChangeUsuario(usuario)
    setBusca(usuario.apelido || usuario.nome.split(' ')[0])
    setAberto(false)
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-[14px] bg-[#FAF7F2] border border-[#E8E0D8]">

      {/* Chips de cargo + botão remover */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {cargoOptions.map((cargo) => (
            <button
              key={cargo}
              type="button"
              onClick={() => {
                onChangeCargo(cargo)
                setBusca('')
                onChangeUsuario(null as any)
              }}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-all duration-150
                ${atribuicao.cargo === cargo
                  ? 'bg-[#FF8C66] text-white'
                  : 'bg-white text-[#8C7060] border border-[#E8E0D8] hover:border-[#FF8C66]'
                }
              `}
            >
              {cargoLabels[cargo]}
            </button>
          ))}
        </div>

        {/* Botão remover */}
        <button
          type="button"
          onClick={onRemover}
          className="
            w-7 h-7 shrink-0 flex items-center justify-center
            rounded-full text-[#B0A090] hover:text-[#E86C88] hover:bg-white
            transition-all duration-150 text-base
          "
        >
          ×
        </button>
      </div>

      {/* Campo de busca — só aparece quando cargo está selecionado */}
      {atribuicao.cargo && (
        <div className="relative" ref={ref}>
          <input
            type="text"
            placeholder="Buscar pelo nome..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setAberto(true)
            }}
            onFocus={() => setAberto(true)}
            className="
              w-full rounded-[10px] border border-[#E8E0D8] px-3 py-2 text-sm
              bg-white text-[#3A2E24] placeholder:text-[#C4B5A8]
              outline-none transition-all duration-200
              focus:border-[#FF8C66] focus:ring-2 focus:ring-[#FF8C66]/20
            "
          />

          {/* Dropdown de resultados */}
          {aberto && colaboradoresFiltrados.length > 0 && (
            <div className="
              absolute top-full left-0 right-0 z-10 mt-1
              bg-[#FFFDF9] rounded-[10px] border border-[#E8E0D8]
              shadow-[0_4px_16px_rgba(180,140,120,0.16)]
              overflow-hidden
            ">
              {colaboradoresFiltrados.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selecionarUsuario(c)}
                  className="
                    w-full text-left px-3 py-2.5 text-sm
                    hover:bg-[#FAF7F2] transition-colors
                    border-b border-[#F0EAE3] last:border-0
                  "
                >
                  <span className="font-medium text-[#3A2E24]">
                    {c.apelido || c.nome.split(' ')[0]}
                  </span>
                  {c.apelido && (
                    <span className="text-xs text-[#8C7060] ml-1">({c.nome})</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Nenhum resultado */}
          {aberto && busca.trim() && colaboradoresFiltrados.length === 0 && (
            <div className="
              absolute top-full left-0 right-0 z-10 mt-1
              bg-[#FFFDF9] rounded-[10px] border border-[#E8E0D8]
              px-3 py-2.5
            ">
              <span className="text-xs text-[#B0A090]">Nenhum resultado</span>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
export function AtribuicaoLista({
  colaboradores,
  atribuicoes,
  onChange,
}: AtribuicaoListaProps) {

  function adicionarLinha() {
    onChange([
      ...atribuicoes,
      { id: crypto.randomUUID(), cargo: null, usuario: null },
    ])
  }

  function removerLinha(id: string) {
    onChange(atribuicoes.filter((a) => a.id !== id))
  }

  function atualizarCargo(id: string, cargo: Role) {
    onChange(atribuicoes.map((a) => a.id === id ? { ...a, cargo, usuario: null } : a))
  }

  function atualizarUsuario(id: string, usuario: Usuario) {
    onChange(atribuicoes.map((a) => a.id === id ? { ...a, usuario } : a))
  }

  return (
    <div className="flex flex-col gap-2">

      {atribuicoes.length === 0 && (
        <p className="text-xs text-[#B0A090]">Nenhum colaborador atribuído ainda.</p>
      )}

      {atribuicoes.map((atribuicao) => (
        <AtribuicaoLinha
          key={atribuicao.id}
          atribuicao={atribuicao}
          colaboradores={colaboradores}
          onChangeCargo={(cargo) => atualizarCargo(atribuicao.id, cargo)}
          onChangeUsuario={(usuario) => atualizarUsuario(atribuicao.id, usuario)}
          onRemover={() => removerLinha(atribuicao.id)}
        />
      ))}

      <button
        type="button"
        onClick={adicionarLinha}
        className="
          flex items-center gap-1.5 text-sm font-medium text-[#FF8C66]
          hover:text-[#e87a54] transition-colors w-fit mt-1
        "
      >
        <span className="text-lg leading-none">+</span>
        Adicionar colaborador
      </button>

    </div>
  )
}