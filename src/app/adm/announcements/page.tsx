/**
 * AnnouncementsPage — página de comunicados do painel administrativo.
 *
 * Lista comunicados do mês selecionado com seletor de mês.
 * Permite criar novo comunicado via modal.
 *
 * Rota: /adm/announcements
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSchool } from '@/hooks/useSchool'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createAnnouncement } from '@/app/actions/createAnnouncement'
import type { Class, Shift, Announcement, AnnouncementAttachment, AnnouncementScope } from '@/types'

// ── Labels ────────────────────────────────────────────────────
const shiftLabels: Record<Shift, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  integral: 'Integral',
  noite: 'Noite',
}

const scopeLabels: Record<AnnouncementScope, string> = {
  turma: 'Turma',
  turno: 'Turno',
  escola: 'Toda a escola',
}

// ── Tipo local ─────────────────────────────────────────────────
type AnnouncementWithAttachments = Announcement & {
  announcement_attachments: AnnouncementAttachment[]
}

// ── Formata mês ───────────────────────────────────────────────
function formatMonth(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const { schoolId, userId, loading } = useSchool()
  const supabase = createClient()

  // Mês atual
  const today = new Date()
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  // Lista
  const [announcements, setAnnouncements] = useState<AnnouncementWithAttachments[]>([])
  const [loadingList, setLoadingList] = useState(false)

  // Modal de criação
  const [modalOpen, setModalOpen] = useState(false)
  const [openAnnouncement, setOpenAnnouncement] = useState<AnnouncementWithAttachments | null>(null)

  // Turmas
  const [classes, setClasses] = useState<Class[]>([])

  // Form
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [scope, setScope] = useState<AnnouncementScope>('escola')
  const [classId, setClassId] = useState<string | null>(null)
  const [shift, setShift] = useState<Shift | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Busca turmas ──
  useEffect(() => {
    if (!schoolId) return
    async function fetchClasses() {
      const { data } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', schoolId)
        .eq('active', true)
        .order('name')
      if (data) setClasses(data)
    }
    fetchClasses()
  }, [schoolId])

  // ── Busca comunicados do mês ──
  useEffect(() => {
    if (!schoolId) return
    fetchAnnouncements(schoolId, month)
  }, [schoolId, month])

  async function fetchAnnouncements(schoolId: string, month: Date) {
    setLoadingList(true)
    const start = month.toISOString()
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString()

    const { data } = await supabase
      .from('announcements')
      .select('*, announcement_attachments(*)')
      .eq('school_id', schoolId)
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false })

    setAnnouncements((data as AnnouncementWithAttachments[]) ?? [])
    setLoadingList(false)
  }

  // ── Navega entre meses ──
  function prevMonth() {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
  }

  function nextMonth() {
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1)
    if (next <= today) setMonth(next)
  }

  // ── Valida arquivo ──
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFileError('')

    if (selected.size > 5 * 1024 * 1024) {
      setFileError('O arquivo deve ter no máximo 5MB.')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(selected.type)) {
      setFileError('Apenas imagens (JPG, PNG, WEBP) e PDF são permitidos.')
      return
    }

    setFile(selected)
  }

  // ── Validação do form ──
  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Título é obrigatório.'
    if (!content.trim()) e.content = 'Mensagem é obrigatória.'
    if (scope === 'turma' && !classId) e.class = 'Selecione a turma.'
    if (scope === 'turno' && !shift) e.shift = 'Selecione o turno.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Salvar ──
  async function handleSave() {
    if (!validate() || !schoolId || !userId) return
    setSaving(true)

    let attachmentPayload = null

    if (file) {
      const bytes = Array.from(new Uint8Array(await file.arrayBuffer()))
      attachmentPayload = {
        name: file.name,
        type: file.type,
        bytes,
      }
    }

    const result = await createAnnouncement({
      schoolId,
      publishedBy: userId,
      title,
      content,
      scope,
      classId: scope === 'turma' ? classId : null,
      shift: scope === 'turno' ? shift : null,
      attachment: attachmentPayload,
    })

    if (!result.ok) {
      setErrors({ general: result.error })
      setSaving(false)
      return
    }

    // Reseta form e fecha modal
    setTitle('')
    setContent('')
    setScope('escola')
    setClassId(null)
    setShift(null)
    setFile(null)
    setErrors({})
    setModalOpen(false)
    setSaving(false)
    fetchAnnouncements(schoolId, month)
  }

  // ── Pill de escopo ──
  function ScopePill({ announcement }: { announcement: AnnouncementWithAttachments }) {
    let label = 'Toda a escola'
    if (announcement.scope === 'turma' && announcement.class_id) {
      const cls = classes.find((c) => c.id === announcement.class_id)
      label = cls?.name ?? 'Turma'
    }
    if (announcement.scope === 'turno' && announcement.shift) {
      label = shiftLabels[announcement.shift as Shift] ?? announcement.shift
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
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          + Novo comunicado
        </Button>
      </div>

      {/* Seletor de mês */}
      <div className="px-5 pt-5 max-w-lg mx-auto">
        <div className="flex items-center justify-between bg-[#FFFDF9] rounded-[16px] px-4 py-3 shadow-[0_2px_8px_rgba(180,140,120,0.08)]">
          <button
            onClick={prevMonth}
            className="text-[#8C7060] hover:text-[#3A2E24] text-lg px-2 transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-[#3A2E24] capitalize">
            {formatMonth(month)}
          </span>
          <button
            onClick={nextMonth}
            disabled={new Date(month.getFullYear(), month.getMonth() + 1, 1) > today}
            className="text-[#8C7060] hover:text-[#3A2E24] text-lg px-2 transition-colors disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="px-5 pt-4 max-w-lg mx-auto flex flex-col gap-2">
        {loadingList ? (
          <p className="text-sm text-[#8C7060] text-center py-8">Carregando...</p>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-[#8C7060] text-center py-8">
            Nenhum comunicado em {formatMonth(month)}.
          </p>
        ) : (
          announcements.map((a) => (
            <button
              key={a.id}
              onClick={() => setOpenAnnouncement(a)}
              className="w-full text-left bg-[#FFFDF9] rounded-[16px] px-4 py-3.5 shadow-[0_2px_8px_rgba(180,140,120,0.08)] hover:shadow-[0_4px_16px_rgba(180,140,120,0.16)] transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ScopePill announcement={a} />
                  <span className="text-sm font-medium text-[#3A2E24] truncate">{a.title}</span>
                  {a.announcement_attachments?.length > 0 && (
                    <span className="text-xs text-[#8C7060]">📎</span>
                  )}
                </div>
                <span className="text-xs text-[#8C7060] shrink-0">
                  {new Date(a.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Modal de criação */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setModalOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFFDF9] rounded-t-[28px] shadow-[0_-4px_24px_rgba(180,140,120,0.18)] px-5 pt-5 pb-10 max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#E8E0D8] rounded-full mx-auto mb-5" />
            <h2 className="font-display text-lg font-bold text-[#3A2E24] mb-4">Novo comunicado</h2>

            <div className="flex flex-col gap-4">
              {/* Escopo */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#3A2E24]">Para quem?</span>
                <div className="flex gap-2">
                  {(['escola', 'turma', 'turno'] as AnnouncementScope[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setScope(s)
                        setClassId(null)
                        setShift(null)
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                        scope === s
                          ? 'bg-[#FF8C66] text-white'
                          : 'bg-[#FAF7F2] text-[#8C7060] border border-[#E8E0D8] hover:border-[#FF8C66]'
                      }`}
                    >
                      {scopeLabels[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Turma */}
              {scope === 'turma' && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[#3A2E24]">Turma</span>
                  <div className="flex flex-col gap-1">
                    {classes.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setClassId(c.id)}
                        className={`w-full text-left px-4 py-2.5 rounded-[10px] text-sm transition-all border ${
                          classId === c.id
                            ? 'border-[#FF8C66] bg-[#FFF5F0] font-medium text-[#3A2E24]'
                            : 'border-[#E8E0D8] text-[#3A2E24] hover:border-[#FF8C66]'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                  {errors.class && <span className="text-xs text-[#E86C88]">{errors.class}</span>}
                </div>
              )}

              {/* Turno */}
              {scope === 'turno' && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[#3A2E24]">Turno</span>
                  <div className="flex flex-wrap gap-2">
                    {(['manha', 'tarde', 'integral'] as Shift[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setShift(s)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                          shift === s
                            ? 'bg-[#FF8C66] text-white'
                            : 'bg-[#FAF7F2] text-[#8C7060] border border-[#E8E0D8] hover:border-[#FF8C66]'
                        }`}
                      >
                        {shiftLabels[s]}
                      </button>
                    ))}
                  </div>
                  {errors.shift && <span className="text-xs text-[#E86C88]">{errors.shift}</span>}
                </div>
              )}

              <Input
                label="Título"
                placeholder="Ex: Reunião de pais — maio"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#3A2E24]">Mensagem</label>
                <textarea
                  placeholder="Digite o conteúdo do comunicado..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="w-full rounded-[14px] border border-[#E8E0D8] px-4 py-3 text-sm bg-[#FFFDF9] text-[#3A2E24] placeholder:text-[#C4B5A8] outline-none transition-all duration-200 focus:border-[#FF8C66] focus:ring-2 focus:ring-[#FF8C66]/20 resize-none"
                />
                {errors.content && <span className="text-xs text-[#E86C88]">{errors.content}</span>}
              </div>

              {/* Anexo */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#3A2E24]">Anexo (opcional)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFile}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-between bg-[#FAF7F2] rounded-[12px] px-4 py-3 border border-[#E8E0D8]">
                    <span className="text-sm text-[#3A2E24] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="text-xs text-[#E86C88] ml-3 shrink-0"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-[14px] border border-dashed border-[#E8E0D8] px-4 py-3 text-sm text-[#8C7060] hover:border-[#FF8C66] hover:text-[#FF8C66] transition-all text-center"
                  >
                    Anexar imagem ou PDF
                  </button>
                )}
                {fileError && <span className="text-xs text-[#E86C88]">{fileError}</span>}
              </div>

              {errors.general && (
                <span className="text-xs text-[#E86C88] text-center">{errors.general}</span>
              )}

              <Button variant="primary" loading={saving} onClick={handleSave}>
                Publicar comunicado
              </Button>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Modal de visualização */}
      {openAnnouncement && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setOpenAnnouncement(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFFDF9] rounded-t-[28px] shadow-[0_-4px_24px_rgba(180,140,120,0.18)] px-5 pt-5 pb-10 max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#E8E0D8] rounded-full mx-auto mb-5" />

            <div className="flex items-center gap-2 mb-1">
              <ScopePill announcement={openAnnouncement} />
              <span className="text-xs text-[#8C7060]">
                {new Date(openAnnouncement.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h2 className="font-display text-lg font-bold text-[#3A2E24] mb-3">
              {openAnnouncement.title}
            </h2>

            <p className="text-sm text-[#5C4A3A] leading-relaxed whitespace-pre-wrap mb-4">
              {openAnnouncement.content}
            </p>

            {openAnnouncement.announcement_attachments?.map(
              (attachment: AnnouncementAttachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-[#FAF7F2] rounded-[14px] px-4 py-3 border border-[#E8E0D8] hover:border-[#FF8C66] transition-all"
                >
                  <span className="text-xl">{attachment.type === 'pdf' ? '📄' : '🖼️'}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-[#3A2E24] truncate">
                      {attachment.file_name ?? 'Anexo'}
                    </span>
                    {attachment.size_bytes && (
                      <span className="text-xs text-[#8C7060]">
                        {(attachment.size_bytes / 1024).toFixed(0)}KB
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#FF8C66] ml-auto shrink-0">Abrir ↗</span>
                </a>
              )
            )}

            <div className="mt-4">
              <Button variant="ghost" onClick={() => setOpenAnnouncement(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
