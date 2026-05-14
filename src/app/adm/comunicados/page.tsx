/**
 * ComunicadosPage — página de comunicados do painel administrativo.
 *
 * Lista comunicados do mês selecionado com seletor de mês.
 * Permite criar novo comunicado via modal.
 *
 * Rota: /adm/comunicados
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useEscola } from '@/hooks/useEscola'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { criarComunicado } from '@/app/actions/criarComunicado'
import type { Turma, Turno } from '@/types'
import type { Comunicado, ComunicadoAnexo, EscopoComunicado } from '@/types'

// ── Labels ────────────────────────────────────────────────────
const turnoLabels: Record<Turno, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  integral: 'Integral',
  noite: 'Noite',
}

const escopoLabels: Record<EscopoComunicado, string> = {
  turma: 'Turma',
  turno: 'Turno',
  escola: 'Toda a escola',
}

// ── Tipo local ─────────────────────────────────────────────────
type ComunicadoComAnexo = Comunicado & {
  comunicados_anexos: ComunicadoAnexo[]
}

// ── Formata mês ───────────────────────────────────────────────
function formatarMes(data: Date): string {
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default function ComunicadosPage() {
  const router = useRouter()
  const { escolaId, usuarioId, loading } = useEscola()
  const supabase = createClient()

  // Mês atual
  const hoje = new Date()
  const [mes, setMes] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1))

  // Lista
  const [comunicados, setComunicados] = useState<ComunicadoComAnexo[]>([])
  const [carregando, setCarregando] = useState(false)

  // Modal de criação
  const [modalAberto, setModalAberto] = useState(false)
  const [comunicadoAberto, setComunicadoAberto] = useState<ComunicadoComAnexo | null>(null)

  // Turmas
  const [turmas, setTurmas] = useState<Turma[]>([])

  // Form
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [escopo, setEscopo] = useState<EscopoComunicado>('escola')
  const [turmaId, setTurmaId] = useState<string | null>(null)
  const [turno, setTurno] = useState<Turno | null>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erroArquivo, setErroArquivo] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const inputArquivoRef = useRef<HTMLInputElement>(null)

  // ── Busca turmas ──
  useEffect(() => {
    if (!escolaId) return
    async function buscarTurmas() {
      const { data } = await supabase
        .from('turmas')
        .select('*')
        .eq('escola_id', escolaId)
        .eq('ativo', true)
        .order('nome')
      if (data) setTurmas(data)
    }
    buscarTurmas()
  }, [escolaId])

  // ── Busca comunicados do mês ──
  useEffect(() => {
    if (!escolaId) return
    buscarComunicados()
  }, [escolaId, mes])

  async function buscarComunicados() {
    setCarregando(true)
    const inicio = mes.toISOString()
    const fim = new Date(mes.getFullYear(), mes.getMonth() + 1, 1).toISOString()

    const { data } = await supabase
      .from('comunicados')
      .select('*, comunicados_anexos(*)')
      .eq('escola_id', escolaId)
      .gte('criado_em', inicio)
      .lt('criado_em', fim)
      .order('criado_em', { ascending: false })

    setComunicados((data as ComunicadoComAnexo[]) ?? [])
    setCarregando(false)
  }

  // ── Navega entre meses ──
  function mesAnterior() {
    setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))
  }

  function proximoMes() {
    const proximo = new Date(mes.getFullYear(), mes.getMonth() + 1, 1)
    if (proximo <= hoje) setMes(proximo)
  }

  // ── Valida arquivo ──
  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErroArquivo('')

    if (file.size > 5 * 1024 * 1024) {
      setErroArquivo('O arquivo deve ter no máximo 5MB.')
      return
    }

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!tiposPermitidos.includes(file.type)) {
      setErroArquivo('Apenas imagens (JPG, PNG, WEBP) e PDF são permitidos.')
      return
    }

    setArquivo(file)
  }

  // ── Validação do form ──
  function validar() {
    const e: Record<string, string> = {}
    if (!titulo.trim()) e.titulo = 'Título é obrigatório.'
    if (!conteudo.trim()) e.conteudo = 'Mensagem é obrigatória.'
    if (escopo === 'turma' && !turmaId) e.turma = 'Selecione a turma.'
    if (escopo === 'turno' && !turno) e.turno = 'Selecione o turno.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Salvar ──
  async function handleSalvar() {
    if (!validar() || !escolaId || !usuarioId) return
    setSalvando(true)

    let anexoPayload = null

    if (arquivo) {
      const bytes = Array.from(new Uint8Array(await arquivo.arrayBuffer()))
      anexoPayload = {
        nome: arquivo.name,
        tipo: arquivo.type,
        bytes,
      }
    }

    const resultado = await criarComunicado({
      escolaId,
      publicadoPor: usuarioId,
      titulo,
      conteudo,
      escopo,
      turmaId: escopo === 'turma' ? turmaId : null,
      turno: escopo === 'turno' ? turno : null,
      anexo: anexoPayload,
    })

    if (!resultado.ok) {
      setErrors({ geral: resultado.erro })
      setSalvando(false)
      return
    }

    // Reseta form e fecha modal
    setTitulo('')
    setConteudo('')
    setEscopo('escola')
    setTurmaId(null)
    setTurno(null)
    setArquivo(null)
    setErrors({})
    setModalAberto(false)
    setSalvando(false)
    buscarComunicados()
  }

  // ── Pill de escopo ──
  function PillEscopo({ comunicado }: { comunicado: ComunicadoComAnexo }) {
    let label = 'Toda a escola'
    if (comunicado.escopo === 'turma' && comunicado.turma_id) {
      const turma = turmas.find(t => t.id === comunicado.turma_id)
      label = turma?.nome ?? 'Turma'
    }
    if (comunicado.escopo === 'turno' && comunicado.turno) {
      label = turnoLabels[comunicado.turno as Turno] ?? comunicado.turno
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFF0E8] text-[#FF8C66]">
        {label}
      </span>
    )
  }

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
      <div className="bg-[#FFFDF9] px-5 pt-12 pb-5 shadow-[0_2px_8px_rgba(180,140,120,0.08)]">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="text-[#8C7060] hover:text-[#3A2E24] transition-colors"
          >
            ‹
          </button>
          <h1 className="font-display text-xl font-bold text-[#3A2E24]">Comunicados</h1>
        </div>
        <Button variant="primary" onClick={() => setModalAberto(true)}>
          + Novo comunicado
        </Button>
      </div>

      {/* Seletor de mês */}
      <div className="px-5 pt-5 max-w-lg mx-auto">
        <div className="flex items-center justify-between bg-[#FFFDF9] rounded-[16px] px-4 py-3 shadow-[0_2px_8px_rgba(180,140,120,0.08)]">
          <button
            onClick={mesAnterior}
            className="text-[#8C7060] hover:text-[#3A2E24] text-lg px-2 transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-[#3A2E24] capitalize">
            {formatarMes(mes)}
          </span>
          <button
            onClick={proximoMes}
            disabled={new Date(mes.getFullYear(), mes.getMonth() + 1, 1) > hoje}
            className="text-[#8C7060] hover:text-[#3A2E24] text-lg px-2 transition-colors disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="px-5 pt-4 max-w-lg mx-auto flex flex-col gap-2">
        {carregando ? (
          <p className="text-sm text-[#8C7060] text-center py-8">Carregando...</p>
        ) : comunicados.length === 0 ? (
          <p className="text-sm text-[#8C7060] text-center py-8">
            Nenhum comunicado em {formatarMes(mes)}.
          </p>
        ) : (
          comunicados.map((c) => (
            <button
              key={c.id}
              onClick={() => setComunicadoAberto(c)}
              className="w-full text-left bg-[#FFFDF9] rounded-[16px] px-4 py-3.5 shadow-[0_2px_8px_rgba(180,140,120,0.08)] hover:shadow-[0_4px_16px_rgba(180,140,120,0.16)] transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <PillEscopo comunicado={c} />
                  <span className="text-sm font-medium text-[#3A2E24] truncate">
                    {c.titulo}
                  </span>
                  {c.comunicados_anexos?.length > 0 && (
                    <span className="text-xs text-[#8C7060]">📎</span>
                  )}
                </div>
                <span className="text-xs text-[#8C7060] shrink-0">
                  {new Date(c.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Modal de criação */}
      {modalAberto && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setModalAberto(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFFDF9] rounded-t-[28px] shadow-[0_-4px_24px_rgba(180,140,120,0.18)] px-5 pt-5 pb-10 max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#E8E0D8] rounded-full mx-auto mb-5" />
            <h2 className="font-display text-lg font-bold text-[#3A2E24] mb-4">Novo comunicado</h2>

            <div className="flex flex-col gap-4">

              {/* Escopo */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#3A2E24]">Para quem?</span>
                <div className="flex gap-2">
                  {(['escola', 'turma', 'turno'] as EscopoComunicado[]).map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => { setEscopo(e); setTurmaId(null); setTurno(null) }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                        escopo === e
                          ? 'bg-[#FF8C66] text-white'
                          : 'bg-[#FAF7F2] text-[#8C7060] border border-[#E8E0D8] hover:border-[#FF8C66]'
                      }`}
                    >
                      {escopoLabels[e]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Turma */}
              {escopo === 'turma' && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[#3A2E24]">Turma</span>
                  <div className="flex flex-col gap-1">
                    {turmas.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTurmaId(t.id)}
                        className={`w-full text-left px-4 py-2.5 rounded-[10px] text-sm transition-all border ${
                          turmaId === t.id
                            ? 'border-[#FF8C66] bg-[#FFF5F0] font-medium text-[#3A2E24]'
                            : 'border-[#E8E0D8] text-[#3A2E24] hover:border-[#FF8C66]'
                        }`}
                      >
                        {t.nome}
                      </button>
                    ))}
                  </div>
                  {errors.turma && <span className="text-xs text-[#E86C88]">{errors.turma}</span>}
                </div>
              )}

              {/* Turno */}
              {escopo === 'turno' && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[#3A2E24]">Turno</span>
                  <div className="flex flex-wrap gap-2">
                    {(['manha', 'tarde', 'integral'] as Turno[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTurno(t)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                          turno === t
                            ? 'bg-[#FF8C66] text-white'
                            : 'bg-[#FAF7F2] text-[#8C7060] border border-[#E8E0D8] hover:border-[#FF8C66]'
                        }`}
                      >
                        {turnoLabels[t]}
                      </button>
                    ))}
                  </div>
                  {errors.turno && <span className="text-xs text-[#E86C88]">{errors.turno}</span>}
                </div>
              )}

              <Input
                label="Título"
                placeholder="Ex: Reunião de pais — maio"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                error={errors.titulo}
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#3A2E24]">Mensagem</label>
                <textarea
                  placeholder="Digite o conteúdo do comunicado..."
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  rows={5}
                  className="w-full rounded-[14px] border border-[#E8E0D8] px-4 py-3 text-sm bg-[#FFFDF9] text-[#3A2E24] placeholder:text-[#C4B5A8] outline-none transition-all duration-200 focus:border-[#FF8C66] focus:ring-2 focus:ring-[#FF8C66]/20 resize-none"
                />
                {errors.conteudo && <span className="text-xs text-[#E86C88]">{errors.conteudo}</span>}
              </div>

              {/* Anexo */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#3A2E24]">Anexo (opcional)</span>
                <input
                  ref={inputArquivoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleArquivo}
                  className="hidden"
                />
                {arquivo ? (
                  <div className="flex items-center justify-between bg-[#FAF7F2] rounded-[12px] px-4 py-3 border border-[#E8E0D8]">
                    <span className="text-sm text-[#3A2E24] truncate">{arquivo.name}</span>
                    <button
                      type="button"
                      onClick={() => { setArquivo(null); if (inputArquivoRef.current) inputArquivoRef.current.value = '' }}
                      className="text-xs text-[#E86C88] ml-3 shrink-0"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputArquivoRef.current?.click()}
                    className="w-full rounded-[14px] border border-dashed border-[#E8E0D8] px-4 py-3 text-sm text-[#8C7060] hover:border-[#FF8C66] hover:text-[#FF8C66] transition-all text-center"
                  >
                    Anexar imagem ou PDF
                  </button>
                )}
                {erroArquivo && <span className="text-xs text-[#E86C88]">{erroArquivo}</span>}
              </div>

              {errors.geral && (
                <span className="text-xs text-[#E86C88] text-center">{errors.geral}</span>
              )}

              <Button variant="primary" loading={salvando} onClick={handleSalvar}>
                Publicar comunicado
              </Button>
              <Button variant="ghost" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Modal de visualização */}
      {comunicadoAberto && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setComunicadoAberto(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFFDF9] rounded-t-[28px] shadow-[0_-4px_24px_rgba(180,140,120,0.18)] px-5 pt-5 pb-10 max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#E8E0D8] rounded-full mx-auto mb-5" />

            <div className="flex items-center gap-2 mb-1">
              <PillEscopo comunicado={comunicadoAberto} />
              <span className="text-xs text-[#8C7060]">
                {new Date(comunicadoAberto.criado_em).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </span>
            </div>

            <h2 className="font-display text-lg font-bold text-[#3A2E24] mb-3">
              {comunicadoAberto.titulo}
            </h2>

            <p className="text-sm text-[#5C4A3A] leading-relaxed whitespace-pre-wrap mb-4">
              {comunicadoAberto.conteudo}
            </p>

            {comunicadoAberto.comunicados_anexos?.map((anexo) => (
              <a
                key={anexo.id}
                href={anexo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#FAF7F2] rounded-[14px] px-4 py-3 border border-[#E8E0D8] hover:border-[#FF8C66] transition-all"
              >
                <span className="text-xl">{anexo.tipo === 'pdf' ? '📄' : '🖼️'}</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-[#3A2E24] truncate">
                    {anexo.nome_arquivo ?? 'Anexo'}
                  </span>
                  {anexo.tamanho_bytes && (
                    <span className="text-xs text-[#8C7060]">
                      {(anexo.tamanho_bytes / 1024).toFixed(0)}KB
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#FF8C66] ml-auto shrink-0">Abrir ↗</span>
              </a>
            ))}

            <div className="mt-4">
              <Button variant="ghost" onClick={() => setComunicadoAberto(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}