/**
 * IncidentsPage — página de ocorrências do painel administrativo.
 *
 * Lista ocorrências filtradas por período e criança.
 * Professor vê ocorrências da sua turma.
 * Admin e coordenador veem todas da escola e podem editar/enviar.
 *
 * Rota: /adm/incidents
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSchool } from "@/hooks/useSchool";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createIncident } from "@/app/actions/createIncident";
import { updateIncident } from "@/app/actions/updateIncident";
import { sendIncident } from "@/app/actions/sendIncident";
import type { Incident, IncidentAttachment, IncidentStatus } from "@/types";
import type { Child } from "@/types";

// ── Tipo local ────────────────────────────────────────────────
type IncidentWithDetails = Incident & {
  incident_attachments: IncidentAttachment[];
  children: { name: string } | null;
  recorded_by_user: { name: string } | null;
  sent_by_user: { name: string } | null;
  edited_by_user: { name: string } | null;
};

// ── Labels e estilos de status ────────────────────────────────
const STATUS_LABEL: Record<IncidentStatus, string> = {
  draft: "Rascunho",
  pending: "Pendente",
  sent: "Enviado",
};

const STATUS_STYLE: Record<IncidentStatus, { bg: string; text: string }> = {
  draft: { bg: "#F0EDE8", text: "#8C7060" },
  pending: { bg: "#FEF6E4", text: "#9A6F2A" },
  sent: { bg: "#EAF3DE", text: "#4A7A3A" },
};

// ── Formata mês ───────────────────────────────────────────────
function formatMonth(date: Date): string {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default function IncidentsPage() {
  const router = useRouter();
  const { schoolId, userId, role, loading } = useSchool();
  const supabase = createClient();

  const isAdminOrCoord = role === "admin" || role === "coordinator";

  // Filtros
  const today = new Date();
  const [month, setMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  // Dados
  const [incidents, setIncidents] = useState<IncidentWithDetails[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Modal criação
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newChildId, setNewChildId] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newFileError, setNewFileError] = useState("");
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal detalhe/edição
  const [openIncident, setOpenIncident] = useState<IncidentWithDetails | null>(
    null,
  );
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState(false);
  const [sending, setSending] = useState(false);

  // ── Busca crianças ──
  useEffect(() => {
    if (!schoolId) return;
    async function fetchChildren() {
      const { data } = await supabase
        .from("children")
        .select("*")
        .eq("school_id", schoolId)
        .eq("active", true)
        .order("name");
      if (data) setChildren(data);
    }
    fetchChildren();
  }, [schoolId]);

  // ── Busca ocorrências ──
  useEffect(() => {
    if (!schoolId) return;
    fetchIncidents();
  }, [schoolId, month, selectedChild]);

  async function fetchIncidents() {
    if (!schoolId) return;
    setLoadingList(true);

    const start = month.toISOString();
    const end = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      1,
    ).toISOString();

    let query = supabase
      .from("incidents")
      .select("*, incident_attachments(*), children(name)")
      .eq("school_id", schoolId)
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: false });

    if (selectedChild) query = query.eq("child_id", selectedChild);

    const { data } = await query;
    setIncidents((data as IncidentWithDetails[]) ?? []);
    setLoadingList(false);
  }

  // ── Navega entre meses ──
  function prevMonth() {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  }
  function nextMonth() {
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    if (next <= today) setMonth(next);
  }

  // ── Valida arquivo ──
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setNewFileError("");
    if (!selected.type.startsWith("image/")) {
      setNewFileError("Apenas imagens são permitidas.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setNewFileError("A imagem deve ter no máximo 5MB.");
      return;
    }
    setNewFile(selected);
  }

  // ── Criar ocorrência ──
  function validateCreate() {
    const e: Record<string, string> = {};
    if (!newChildId) e.child = "Selecione a criança.";
    if (!newTitle.trim()) e.title = "Título é obrigatório.";
    if (!newDescription.trim()) e.description = "Descrição é obrigatória.";
    setCreateErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate() {
    if (!validateCreate() || !schoolId || !userId) return;
    setSaving(true);

    let attachmentPayload = null;
    if (newFile) {
      const bytes = Array.from(new Uint8Array(await newFile.arrayBuffer()));
      attachmentPayload = { name: newFile.name, type: newFile.type, bytes };
    }

    const result = await createIncident({
      schoolId,
      childId: newChildId!,
      recordedBy: userId,
      title: newTitle,
      description: newDescription,
      attachment: attachmentPayload,
    });

    if (!result.ok) {
      setCreateErrors({ general: result.error });
      setSaving(false);
      return;
    }

    setNewTitle("");
    setNewDescription("");
    setNewChildId(null);
    setNewFile(null);
    setCreateErrors({});
    setCreateOpen(false);
    setSaving(false);
    fetchIncidents();
  }

  // ── Editar ocorrência ──
  function openEdit(incident: IncidentWithDetails) {
    setEditTitle(incident.title);
    setEditDescription(incident.description);
    setEditErrors({});
    setEditMode(true);
  }

  async function handleUpdate() {
    if (!openIncident || !userId) return;
    const e: Record<string, string> = {};
    if (!editTitle.trim()) e.title = "Título é obrigatório.";
    if (!editDescription.trim()) e.description = "Descrição é obrigatória.";
    setEditErrors(e);
    if (Object.keys(e).length > 0) return;

    setUpdating(true);
    const result = await updateIncident({
      incidentId: openIncident.id,
      editedBy: userId,
      title: editTitle,
      description: editDescription,
    });

    if (!result.ok) {
      setEditErrors({ general: result.error });
      setUpdating(false);
      return;
    }

    setEditMode(false);
    setUpdating(false);
    setOpenIncident(null);
    fetchIncidents();
  }

  // ── Enviar ocorrência ──
  async function handleSend() {
    if (!openIncident || !userId) return;
    setSending(true);

    const result = await sendIncident({
      incidentId: openIncident.id,
      sentBy: userId,
    });

    if (!result.ok) {
      setEditErrors({ general: result.error });
      setSending(false);
      return;
    }

    setSending(false);
    setOpenIncident(null);
    fetchIncidents();
  }

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
      <div className="bg-[#FFFDF9] px-5 pt-12 pb-5 shadow-[0_2px_8px_rgba(180,140,120,0.08)]">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="text-[#8C7060] hover:text-[#3A2E24] transition-colors"
          >
            ‹
          </button>
          <h1 className="font-display text-xl font-bold text-[#3A2E24]">
            Ocorrências
          </h1>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          + Nova ocorrência
        </Button>
      </div>

      {/* Filtros */}
      <div className="px-5 pt-5 max-w-lg mx-auto flex flex-col gap-3">
        {/* Seletor de mês */}
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
            disabled={
              new Date(month.getFullYear(), month.getMonth() + 1, 1) > today
            }
            className="text-[#8C7060] hover:text-[#3A2E24] text-lg px-2 transition-colors disabled:opacity-30"
          >
            ›
          </button>
        </div>

        {/* Filtro por criança */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedChild(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !selectedChild
                ? "bg-[#3A2E24] text-[#FAF7F2]"
                : "bg-[#FFFDF9] text-[#8C7060] border border-[#E8E0D8] hover:border-[#3A2E24]"
            }`}
          >
            Todas
          </button>
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedChild(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedChild === c.id
                  ? "bg-[#3A2E24] text-[#FAF7F2]"
                  : "bg-[#FFFDF9] text-[#8C7060] border border-[#E8E0D8] hover:border-[#3A2E24]"
              }`}
            >
              {c.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="px-5 pt-4 max-w-lg mx-auto flex flex-col gap-2">
        {loadingList ? (
          <p className="text-sm text-[#8C7060] text-center py-8">
            Carregando...
          </p>
        ) : incidents.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm text-[#B0A090]">
              Nenhuma ocorrência em {formatMonth(month)}.
            </p>
          </div>
        ) : (
          incidents.map((incident) => {
            const statusStyle = STATUS_STYLE[incident.status as IncidentStatus];
            return (
              <button
                key={incident.id}
                onClick={() => {
                  setOpenIncident(incident);
                  setEditMode(false);
                }}
                className="w-full text-left bg-[#FFFDF9] rounded-[16px] px-4 py-3.5 shadow-[0_2px_8px_rgba(180,140,120,0.08)] hover:shadow-[0_4px_16px_rgba(180,140,120,0.16)] transition-all active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.text,
                        }}
                      >
                        {STATUS_LABEL[incident.status as IncidentStatus]}
                      </span>
                      {incident.incident_attachments?.length > 0 && (
                        <span className="text-xs text-[#8C7060]">📷</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-[#3A2E24] truncate">
                      {incident.title}
                    </span>
                    <span className="text-xs text-[#8C7060]">
                      {incident.children?.name}
                    </span>
                  </div>
                  <span className="text-xs text-[#8C7060] shrink-0 mt-1">
                    {new Date(incident.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Modal — criar ocorrência */}
      {createOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setCreateOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFFDF9] rounded-t-[28px] shadow-[0_-4px_24px_rgba(180,140,120,0.18)] px-5 pt-5 pb-10 max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#E8E0D8] rounded-full mx-auto mb-5" />
            <h2 className="font-display text-lg font-bold text-[#3A2E24] mb-4">
              Nova ocorrência
            </h2>

            <div className="flex flex-col gap-4">
              {/* Criança */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#3A2E24]">
                  Criança
                </span>
                <div className="flex flex-col gap-1">
                  {children.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewChildId(c.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-[10px] text-sm transition-all border ${
                        newChildId === c.id
                          ? "border-[#3A2E24] bg-[#F5F0EA] font-medium text-[#3A2E24]"
                          : "border-[#E8E0D8] text-[#3A2E24] hover:border-[#3A2E24]"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                {createErrors.child && (
                  <span className="text-xs text-[#E86C88]">
                    {createErrors.child}
                  </span>
                )}
              </div>

              <Input
                label="Título"
                placeholder="Ex: Queda no pátio"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                error={createErrors.title}
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#3A2E24]">
                  Descrição
                </label>
                <textarea
                  placeholder="Descreva o que aconteceu..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={5}
                  className="w-full rounded-[14px] border border-[#E8E0D8] px-4 py-3 text-sm bg-[#FFFDF9] text-[#3A2E24] placeholder:text-[#C4B5A8] outline-none transition-all duration-200 focus:border-[#3A2E24] focus:ring-2 focus:ring-[#3A2E24]/10 resize-none"
                />
                {createErrors.description && (
                  <span className="text-xs text-[#E86C88]">
                    {createErrors.description}
                  </span>
                )}
              </div>

              {/* Foto opcional */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#3A2E24]">
                  Foto (opcional)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFile}
                  className="hidden"
                />
                {newFile ? (
                  <div className="flex items-center justify-between bg-[#FAF7F2] rounded-[12px] px-4 py-3 border border-[#E8E0D8]">
                    <span className="text-sm text-[#3A2E24] truncate">
                      {newFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewFile(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
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
                    className="w-full rounded-[14px] border border-dashed border-[#E8E0D8] px-4 py-3 text-sm text-[#8C7060] hover:border-[#3A2E24] hover:text-[#3A2E24] transition-all text-center"
                  >
                    Anexar foto
                  </button>
                )}
                {newFileError && (
                  <span className="text-xs text-[#E86C88]">{newFileError}</span>
                )}
              </div>

              {createErrors.general && (
                <span className="text-xs text-[#E86C88] text-center">
                  {createErrors.general}
                </span>
              )}

              <Button variant="primary" loading={saving} onClick={handleCreate}>
                Registrar ocorrência
              </Button>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Modal — detalhe / edição */}
      {openIncident && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => {
              setOpenIncident(null);
              setEditMode(false);
            }}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFFDF9] rounded-t-[28px] shadow-[0_-4px_24px_rgba(180,140,120,0.18)] px-5 pt-5 pb-10 max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#E8E0D8] rounded-full mx-auto mb-5" />

            {!editMode ? (
              <>
                {/* Cabeçalho do detalhe */}
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        STATUS_STYLE[openIncident.status as IncidentStatus].bg,
                      color:
                        STATUS_STYLE[openIncident.status as IncidentStatus]
                          .text,
                    }}
                  >
                    {STATUS_LABEL[openIncident.status as IncidentStatus]}
                  </span>
                  <span className="text-xs text-[#8C7060]">
                    {new Date(openIncident.created_at).toLocaleDateString(
                      "pt-BR",
                      {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>

                <p className="text-xs text-[#8C7060] mb-2">
                  {openIncident.children?.name}
                </p>

                <h2 className="font-display text-lg font-bold text-[#3A2E24] mb-3">
                  {openIncident.title}
                </h2>

                <p className="text-sm text-[#5C4A3A] leading-relaxed whitespace-pre-wrap mb-4">
                  {openIncident.description}
                </p>

                {/* Texto original se foi editado */}
                {openIncident.original_description && (
                  <div className="bg-[#FAF7F2] rounded-[12px] px-4 py-3 border border-[#E8E0D8] mb-4">
                    <p className="text-xs font-medium text-[#8C7060] mb-1">
                      Texto original da professora
                    </p>
                    <p className="text-sm text-[#8C7060] leading-relaxed whitespace-pre-wrap">
                      {openIncident.original_description}
                    </p>
                  </div>
                )}

                {/* Foto */}
                {openIncident.incident_attachments?.map(
                  (att: IncidentAttachment) => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-[#FAF7F2] rounded-[14px] px-4 py-3 border border-[#E8E0D8] hover:border-[#3A2E24] transition-all mb-4"
                    >
                      <span className="text-xl">🖼️</span>
                      <span className="text-sm font-medium text-[#3A2E24] truncate">
                        {att.file_name ?? "Foto"}
                      </span>
                      <span className="text-xs text-[#8C7060] ml-auto shrink-0">
                        Abrir ↗
                      </span>
                    </a>
                  ),
                )}

                {/* Metadados */}
                <div className="flex flex-col gap-1 mb-5">
                  {openIncident.recorded_by_user && (
                    <p className="text-xs text-[#B0A090]">
                      Registrado por {openIncident.recorded_by_user.name}
                    </p>
                  )}
                  {openIncident.edited_by_user && (
                    <p className="text-xs text-[#B0A090]">
                      Editado por {openIncident.edited_by_user.name}
                    </p>
                  )}
                  {openIncident.sent_by_user && openIncident.sent_at && (
                    <p className="text-xs text-[#B0A090]">
                      Enviado por {openIncident.sent_by_user.name} em{" "}
                      {new Date(openIncident.sent_at).toLocaleDateString(
                        "pt-BR",
                        { day: "2-digit", month: "long" },
                      )}
                    </p>
                  )}
                </div>

                {/* Ações — só admin/coord */}
                {isAdminOrCoord && openIncident.status !== "sent" && (
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="primary"
                      loading={sending}
                      onClick={handleSend}
                    >
                      Enviar para o responsável
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => openEdit(openIncident)}
                    >
                      Editar antes de enviar
                    </Button>
                  </div>
                )}

                {(!isAdminOrCoord || openIncident.status === "sent") && (
                  <Button variant="ghost" onClick={() => setOpenIncident(null)}>
                    Fechar
                  </Button>
                )}
              </>
            ) : (
              <>
                {/* Modo edição */}
                <h2 className="font-display text-lg font-bold text-[#3A2E24] mb-4">
                  Editar ocorrência
                </h2>

                <div className="flex flex-col gap-4">
                  <Input
                    label="Título"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    error={editErrors.title}
                  />

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[#3A2E24]">
                      Descrição
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={6}
                      className="w-full rounded-[14px] border border-[#E8E0D8] px-4 py-3 text-sm bg-[#FFFDF9] text-[#3A2E24] placeholder:text-[#C4B5A8] outline-none transition-all duration-200 focus:border-[#3A2E24] focus:ring-2 focus:ring-[#3A2E24]/10 resize-none"
                    />
                    {editErrors.description && (
                      <span className="text-xs text-[#E86C88]">
                        {editErrors.description}
                      </span>
                    )}
                  </div>

                  {editErrors.general && (
                    <span className="text-xs text-[#E86C88] text-center">
                      {editErrors.general}
                    </span>
                  )}

                  <Button
                    variant="primary"
                    loading={updating}
                    onClick={handleUpdate}
                  >
                    Salvar edição
                  </Button>
                  <Button variant="ghost" onClick={() => setEditMode(false)}>
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
