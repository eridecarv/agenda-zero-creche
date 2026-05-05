/**
 * TurmaModal — bottom sheet para visualização e edição de turma.
 *
 * Modos:
 * - Visualização: dados da turma + equipe atribuída.
 * - Edição: campos editáveis + seleção de equipe por cargo.
 * - Criação: campos vazios.
 *
 * Equipe:
 * - Coordenação: uma pessoa
 * - Professora: uma pessoa
 * - Assistentes: múltiplos, com "+" para adicionar e "×" para remover
 *
 * Cada campo de pessoa é um input com busca em tempo real,
 * filtrado pelo role correspondente.
 *
 * Ao salvar, sincroniza a tabela `turma_colaborador`:
 * removidos recebem `removido_em`, novos são inseridos.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase'
import type { Turma, Turno, TipoTurma, Usuario } from '@/types'

// ── Labels ────────────────────────────────────────────────────
const turnoLabels: Record<Turno, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
}

const tipoLabels: Record<TipoTurma, string> = {
  regular: 'Regular',
  extracurricular: 'Extracurricular',
}

// ── Props ─────────────────────────────────────────────────────
type TurmaModalProps = {
  escolaId: string
  turma?: Turma
  onClose: () => void
  onSaved: () => void
}

// ── Tipo interno de atribuição ─────────────────────────────────
type AtribuicaoSalva = {
  registroId: string    // id na tabela turma_colaborador
  usuario: Usuario
}

// ── Chip selector ─────────────────────────────────────────────
function ChipGroup<T extends string>({
  label,
  options,
  labels,
  value,
  onChange,
  error,
}: {
  label: string
  options: T[]
  labels: Record<T, string>
  value: T | null
  onChange: (v: T) => void
  error?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[#3A2E24]">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
              ${value === opt
                ? 'bg-[#FF8C66] text-white shadow-[0_2px_8px_rgba(180,140,120,0.25)]'
                : 'bg-[#FAF7F2] text-[#8C7060] border border-[#E8E0D8] hover:border-[#FF8C66]'
              }
            `}
          >
            {labels[opt]}
          </button>
        ))}
      </div>
      {error && <span className="text-xs text-[#E86C88]">{error}</span>}
    </div>
  )
}

// ── Linha de detalhe ──────────────────────────────────────────
function DetalheRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-[#F0EAE3] last:border-0">
      <span className="text-xs text-[#8C7060]">{label}</span>
      <span className="text-sm font-medium text-[#3A2E24]">{value ?? '—'}</span>
    </div>
  )
}

// ── Campo de busca de pessoa ──────────────────────────────────
function BuscaPessoa({
  label,
  colaboradores,
  value,
  onChange,
  onClear,
  mostrarClear,
}: {
  label?: string
  colaboradores: Usuario[]
  value: Usuario | null
  onChange: (u: Usuario) => void
  onClear?: () => void
  mostrarClear?: boolean
}) {
  const [busca, setBusca] = useState(
    value?.apelido || value?.nome.split(' ')[0] || ''
  )
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setBusca(value?.apelido || value?.nome.split(' ')[0] || '')
  }, [value])

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  const filtrados = colaboradores.filter((c) => {
    if (!busca.trim()) return true
    const termo = busca.toLowerCase()
    return (
      c.nome.toLowerCase().includes(termo) ||
      (c.apelido?.toLowerCase().includes(termo) ?? false)
    )
  })

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1" ref={ref}>
        {label && (
          <span className="text-xs text-[#8C7060] mb-1 block">{label}</span>
        )}
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
            w-full rounded-[10px] border border-[#E8E0D8] px-3 py-2.5 text-sm
            bg-[#FFFDF9] text-[#3A2E24] placeholder:text-[#C4B5A8]
            outline-none transition-all duration-200
            focus:border-[#FF8C66] focus:ring-2 focus:ring-[#FF8C66]/20
          "
        />

        {aberto && filtrados.length > 0 && (
          <div className="
            absolute top-full left-0 right-0 z-20 mt-1
            bg-[#FFFDF9] rounded-[10px] border border-[#E8E0D8]
            shadow-[0_4px_16px_rgba(180,140,120,0.16)]
            overflow-hidden
          ">
            {filtrados.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c)
                  setBusca(c.apelido || c.nome.split(' ')[0])
                  setAberto(false)
                }}
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
                  <span className="text-xs text-[#8C7060] ml-1">{c.nome}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {aberto && busca.trim() && filtrados.length === 0 && (
          <div className="
            absolute top-full left-0 right-0 z-20 mt-1
            bg-[#FFFDF9] rounded-[10px] border border-[#E8E0D8]
            px-3 py-2.5
          ">
            <span className="text-xs text-[#B0A090]">Nenhum resultado</span>
          </div>
        )}
      </div>

      {mostrarClear && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="
            w-8 h-8 shrink-0 flex items-center justify-center mt-5
            rounded-full text-[#B0A090] hover:text-[#E86C88] hover:bg-[#FFF5F7]
            transition-all duration-150 text-lg
          "
        >
          ×
        </button>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────
export function TurmaModal({ escolaId, turma, onClose, onSaved }: TurmaModalProps) {
  const supabase = createClient()

  const [modo, setModo] = useState<'visualizacao' | 'edicao' | 'criacao'>(
    turma ? 'visualizacao' : 'criacao'
  )

  // Form
  const [nome, setNome] = useState(turma?.nome ?? '')
  const [ano, setAno] = useState(turma?.ano?.toString() ?? new Date().getFullYear().toString())
  const [tipo, setTipo] = useState<TipoTurma>(turma?.tipo ?? 'regular')
  const [nivel, setNivel] = useState(turma?.nivel ?? '')
  const [turno, setTurno] = useState<Turno | null>(turma?.turno ?? null)

  // Equipe — colaboradores por role
  const [coordenadores, setCoordenadores] = useState<Usuario[]>([])
  const [professores, setProfessores] = useState<Usuario[]>([])
  const [auxiliares, setAuxiliares] = useState<Usuario[]>([])

  // Seleções da equipe
  const [coordenadorSelecionado, setCoordenadorSelecionado] = useState<Usuario | null>(null)
  const [professorSelecionado, setProfessorSelecionado] = useState<Usuario | null>(null)
  const [assistentesSelecionados, setAssistentesSelecionados] = useState<(Usuario | null)[]>([null])

  // Atribuições originais do banco (para sincronização)
  const [atribuicoesOriginais, setAtribuicoesOriginais] = useState<AtribuicaoSalva[]>([])

  // Estado
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [desativando, setDesativando] = useState(false)
  const [confirmarDesativar, setConfirmarDesativar] = useState(false)

  useEffect(() => {
    if (tipo === 'extracurricular') setNivel('')
  }, [tipo])

  useEffect(() => {
    carregarColaboradores()
    if (turma) carregarAtribuicoes(turma.id)
  }, [])

  // ── Carrega colaboradores separados por role ──
  async function carregarColaboradores() {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('escola_id', escolaId)
      .eq('ativo', true)
      .in('role', ['coordenador', 'professor', 'auxiliar'])
      .order('nome')

    if (data) {
      setCoordenadores(data.filter((u: Usuario) => u.role === 'coordenador'))
      setProfessores(data.filter((u: Usuario) => u.role === 'professor'))
      setAuxiliares(data.filter((u: Usuario) => u.role === 'auxiliar'))
    }
  }

  // ── Carrega atribuições atuais da turma ──
  async function carregarAtribuicoes(turmaId: string) {
    const { data } = await supabase
      .from('turma_colaborador')
      .select('id, usuario_id, usuarios(*)')
      .eq('turma_id', turmaId)
      .is('removido_em', null)

    if (!data) return

    const originais: AtribuicaoSalva[] = data.map((a: any) => ({
      registroId: a.id,
      usuario: a.usuarios,
    }))
    setAtribuicoesOriginais(originais)

    // Preenche os campos da equipe
    const coord = originais.find((a) => a.usuario.role === 'coordenador')
    const prof = originais.find((a) => a.usuario.role === 'professor')
    const assists = originais.filter((a) => a.usuario.role === 'auxiliar')

    if (coord) setCoordenadorSelecionado(coord.usuario)
    if (prof) setProfessorSelecionado(prof.usuario)
    if (assists.length > 0) {
      setAssistentesSelecionados(assists.map((a) => a.usuario))
    }
  }

  // ── Validação ──
  function validar() {
    const e: Record<string, string> = {}
    if (!nome.trim()) e.nome = 'Nome é obrigatório'
    if (!ano || isNaN(Number(ano)) || Number(ano) < 2020 || Number(ano) > 2099)
      e.ano = 'Ano inválido'
    if (!turno) e.turno = 'Selecione o turno'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Sincroniza equipe no banco ──
  async function sincronizarEquipe(turmaId: string) {
    // Monta lista atual de usuarios selecionados
    const usuariosAtuais: Usuario[] = [
      ...(coordenadorSelecionado ? [coordenadorSelecionado] : []),
      ...(professorSelecionado ? [professorSelecionado] : []),
      ...assistentesSelecionados.filter(Boolean) as Usuario[],
    ]

    const idsOriginais = atribuicoesOriginais.map((a) => a.usuario.id)
    const idsAtuais = usuariosAtuais.map((u) => u.id)

    // Removidos — preenche removido_em
    const removidos = atribuicoesOriginais.filter(
      (a) => !idsAtuais.includes(a.usuario.id)
    )
    for (const r of removidos) {
      await supabase
        .from('turma_colaborador')
        .update({ removido_em: new Date().toISOString() })
        .eq('id', r.registroId)
    }

    // Novos — insere
    const novos = usuariosAtuais.filter((u) => !idsOriginais.includes(u.id))
    for (const u of novos) {
      await supabase.from('turma_colaborador').insert({
        escola_id: escolaId,
        turma_id: turmaId,
        usuario_id: u.id,
      })
    }
  }

  // ── Salvar ──
  async function handleSalvar() {
    if (!validar()) return
    setSalvando(true)

    const payload = {
      escola_id: escolaId,
      nome: nome.trim(),
      ano: Number(ano),
      tipo,
      nivel: nivel.trim() || null,
      turno,
    }

    if (modo === 'edicao' && turma) {
      const { error } = await supabase
        .from('turmas')
        .update(payload)
        .eq('id', turma.id)
        .eq('escola_id', escolaId)

      if (error) {
        setErrors({ geral: 'Erro ao salvar. Tente novamente.' })
        setSalvando(false)
        return
      }
      await sincronizarEquipe(turma.id)

    } else {
      const { data: novaTurma, error } = await supabase
        .from('turmas')
        .insert({ ...payload, ativo: true })
        .select('id')
        .single()

      if (error || !novaTurma) {
        setErrors({ geral: 'Erro ao salvar. Tente novamente.' })
        setSalvando(false)
        return
      }
      await sincronizarEquipe(novaTurma.id)
    }

    setSalvando(false)
    onSaved()
    onClose()
  }

  // ── Desativar ──
  async function handleDesativar() {
    if (!turma) return
    setDesativando(true)

    const { error } = await supabase
      .from('turmas')
      .update({ ativo: false, desativado_em: new Date().toISOString() })
      .eq('id', turma.id)
      .eq('escola_id', escolaId)

    if (error) {
      setErrors({ geral: 'Erro ao desativar. Tente novamente.' })
      setDesativando(false)
      return
    }

    setDesativando(false)
    onSaved()
    onClose()
  }

  // ── Nome de exibição ──
  const nomeExibicao = (u: Usuario | null) =>
    u ? (u.apelido || u.nome.split(' ')[0]) : '—'

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="
        fixed bottom-0 left-0 right-0 z-50
        bg-[#FFFDF9] rounded-t-[28px]
        shadow-[0_-4px_24px_rgba(180,140,120,0.18)]
        px-5 pt-5 pb-10
        max-w-lg mx-auto
        max-h-[90vh] overflow-y-auto
      ">
        <div className="w-10 h-1 bg-[#E8E0D8] rounded-full mx-auto mb-5" />

        <h2 className="font-display text-lg font-bold text-[#3A2E24] mb-5">
          {modo === 'criacao' ? 'Nova turma' : turma?.nome}
        </h2>

        {/* ── Visualização ── */}
        {modo === 'visualizacao' && turma && (
          <div className="flex flex-col">
            <DetalheRow label="Nome" value={turma.nome} />
            <DetalheRow label="Ano letivo" value={turma.ano.toString()} />
            <DetalheRow label="Tipo" value={tipoLabels[turma.tipo]} />
            <DetalheRow label="Nível" value={turma.nivel} />
            <DetalheRow label="Turno" value={turma.turno ? turnoLabels[turma.turno] : null} />

            <div className="mt-2">
              <span className="text-xs text-[#8C7060]">Equipe</span>
              <div className="flex justify-between py-2.5 border-b border-[#F0EAE3]">
                <span className="text-xs text-[#8C7060]">Coordenação</span>
                <span className="text-sm font-medium text-[#3A2E24]">{nomeExibicao(coordenadorSelecionado)}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-[#F0EAE3]">
                <span className="text-xs text-[#8C7060]">Professora</span>
                <span className="text-sm font-medium text-[#3A2E24]">{nomeExibicao(professorSelecionado)}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-[#F0EAE3]">
                <span className="text-xs text-[#8C7060]">Assistentes</span>
                <span className="text-sm font-medium text-[#3A2E24]">
                  {assistentesSelecionados.filter(Boolean).length > 0
                    ? assistentesSelecionados.filter(Boolean).map((u) => nomeExibicao(u)).join(', ')
                    : '—'
                  }
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-5">
              <Button variant="primary" onClick={() => setModo('edicao')}>Editar</Button>

              {!confirmarDesativar ? (
                <Button variant="ghost" onClick={() => setConfirmarDesativar(true)}>
                  Desativar turma
                </Button>
              ) : (
                <div className="flex flex-col gap-2 p-4 rounded-[14px] bg-[#FFF5F7] border border-[#E86C88]/20">
                  <p className="text-sm text-[#3A2E24]">
                    Tem certeza? A turma ficará inativa mas os dados serão preservados.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" fullWidth={false} onClick={() => setConfirmarDesativar(false)}>
                      Cancelar
                    </Button>
                    <Button fullWidth={false} loading={desativando} customColor="#E86C88" customTextColor="#fff" onClick={handleDesativar}>
                      Confirmar
                    </Button>
                  </div>
                </div>
              )}

              <Button variant="ghost" onClick={onClose}>Fechar</Button>
            </div>
          </div>
        )}

        {/* ── Edição / Criação ── */}
        {(modo === 'edicao' || modo === 'criacao') && (
          <div className="flex flex-col gap-4">

            <Input
              label="Nome da turma"
              placeholder="Ex: Maternal 1 A"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              error={errors.nome}
            />

            <Input
              label="Ano letivo"
              type="number"
              placeholder={new Date().getFullYear().toString()}
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              error={errors.ano}
            />

            <ChipGroup
              label="Tipo"
              options={['regular', 'extracurricular'] as TipoTurma[]}
              labels={tipoLabels}
              value={tipo}
              onChange={setTipo}
            />

            {tipo === 'regular' && (
              <Input
                label="Nível"
                placeholder="Ex: Berçário 1, Maternal A..."
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
              />
            )}

            <ChipGroup
              label="Turno"
              options={['manha', 'tarde', 'noite', 'integral'] as Turno[]}
              labels={turnoLabels}
              value={turno}
              onChange={setTurno}
              error={errors.turno}
            />

            {/* ── Equipe ── */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-[#3A2E24]">Equipe</span>

              {/* Coordenação */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#8C7060]">Coordenação</span>
                <BuscaPessoa
                  colaboradores={coordenadores}
                  value={coordenadorSelecionado}
                  onChange={setCoordenadorSelecionado}
                  mostrarClear={!!coordenadorSelecionado}
                  onClear={() => setCoordenadorSelecionado(null)}
                />
              </div>

              {/* Professora */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#8C7060]">Professora</span>
                <BuscaPessoa
                  colaboradores={professores}
                  value={professorSelecionado}
                  onChange={setProfessorSelecionado}
                  mostrarClear={!!professorSelecionado}
                  onClear={() => setProfessorSelecionado(null)}
                />
              </div>

              {/* Assistentes */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#8C7060]">Assistentes</span>
                {assistentesSelecionados.map((assistente, index) => (
                  <BuscaPessoa
                    key={index}
                    colaboradores={auxiliares}
                    value={assistente}
                    onChange={(u) => {
                      const nova = [...assistentesSelecionados]
                      nova[index] = u
                      setAssistentesSelecionados(nova)
                    }}
                    mostrarClear={assistentesSelecionados.length > 1}
                    onClear={() => {
                      setAssistentesSelecionados(
                        assistentesSelecionados.filter((_, i) => i !== index)
                      )
                    }}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => setAssistentesSelecionados([...assistentesSelecionados, null])}
                  className="flex items-center gap-1 text-sm font-medium text-[#FF8C66] hover:text-[#e87a54] transition-colors w-fit"
                >
                  <span className="text-lg leading-none">+</span>
                  Adicionar assistente
                </button>
              </div>
            </div>

            {errors.geral && (
              <span className="text-xs text-[#E86C88]">{errors.geral}</span>
            )}

            <Button variant="primary" loading={salvando} onClick={handleSalvar}>
              {modo === 'edicao' ? 'Salvar alterações' : 'Criar turma'}
            </Button>

            <Button
              variant="ghost"
              onClick={() => modo === 'edicao' ? setModo('visualizacao') : onClose()}
            >
              Cancelar
            </Button>

          </div>
        )}

      </div>
    </>
  )
}