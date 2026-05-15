/**
 * GuardianModal — bottom sheet para cadastro e gestão de responsáveis.
 *
 * Fluxo de cadastro novo:
 * 1. Adm digita o CPF
 * 2. Sistema verifica se já existe responsável com esse CPF
 * 3a. Não existe: adm preenche nome, telefone e relação
 * 3b. Existe: mostra nome, adm só vincula à criança
 * 4. Confirmação visual antes de salvar
 * 5. Salva e exibe link do convite (só para responsável novo)
 *
 * Quando `childId` vem como prop (aberto pelo ChildModal):
 * - A seleção de criança some — já sabemos qual é
 * - O fluxo fica mais curto: CPF → dados → resultado
 *
 * Props:
 * - schoolId: obrigatório
 * - userId: id do adm logado
 * - childId: se vier, pré-seleciona a criança e esconde o campo
 * - onClose: fecha o modal
 * - onSaved: recarrega os dados
 */

"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { registerGuardian } from "@/app/actions/registerGuardian";
import { createClient } from "@/lib/supabase";
import type { Child, GuardianRelation } from "@/types";

// ── Labels ────────────────────────────────────────────────────
const relationLabels: Record<GuardianRelation, string> = {
  mae: "Mãe",
  pai: "Pai",
  avo: "Avô",
  ava: "Avó",
  tio: "Tio",
  tia: "Tia",
  outro: "Outro",
};

const relationOptions: GuardianRelation[] = [
  "mae",
  "pai",
  "ava",
  "avo",
  "tia",
  "tio",
  "outro",
];

// ── Tipo local de responsável encontrado ──────────────────────
type GuardianFound = {
  id: string;
  name: string;
  hasActiveAccount: boolean;
};

// ── Props ─────────────────────────────────────────────────────
type GuardianModalProps = {
  schoolId: string;
  userId: string;
  childId?: string; // se vier, pré-seleciona a criança e esconde o campo
  onClose: () => void;
  onSaved: () => void;
};

// ── Formata CPF enquanto digita ───────────────────────────────
function formatCpf(value: string): string {
  const nums = value.replace(/\D/g, "").slice(0, 11);
  return nums
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

// ── Modal ─────────────────────────────────────────────────────
export function GuardianModal({
  schoolId,
  userId,
  childId,
  onClose,
  onSaved,
}: GuardianModalProps) {
  const supabase = createClient();

  type Step = "cpf" | "details" | "result";
  const [step, setStep] = useState<Step>("cpf");

  // CPF
  const [cpf, setCpf] = useState("");
  const [searching, setSearching] = useState(false);

  // Responsável encontrado (se existir)
  const [existingGuardian, setExistingGuardian] = useState<GuardianFound | null>(null);

  // Dados do novo responsável
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Vínculo
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childSearch, setChildSearch] = useState("");
  const [relation, setRelation] = useState<GuardianRelation | null>(null);

  // Estado
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Se childId vier como prop, busca só essa criança ──
  // Se não vier, busca todas para o adm selecionar
  useEffect(() => {
    async function fetchChild() {
      if (childId) {
        const { data } = await supabase
          .from("children")
          .select("*")
          .eq("id", childId)
          .single();
        if (data) setSelectedChild(data);
      } else {
        const { data } = await supabase
          .from("children")
          .select("*")
          .eq("school_id", schoolId)
          .eq("active", true)
          .order("name");
        if (data) setChildren(data);
      }
    }
    fetchChild();
  }, []);

  // ── Verifica CPF no banco via Server Action ──
  async function handleVerifyCpf() {
    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      setErrors({ cpf: "CPF inválido." });
      return;
    }
    setErrors({});
    setSearching(true);

    const { verifyCpf } = await import("@/app/actions/verifyCpf");
    const found = await verifyCpf({ cleanCpf, schoolId });

    if (found) {
      setExistingGuardian(found);
    } else {
      setExistingGuardian(null);
    }

    setStep("details");
    setSearching(false);
  }

  // ── Validação ──
  function validate() {
    const e: Record<string, string> = {};
    if (!existingGuardian && !name.trim()) e.name = "Nome é obrigatório";
    if (!existingGuardian && !phone.replace(/\D/g, ""))
      e.phone = "Telefone é obrigatório";
    if (!selectedChild && !childId) e.child = "Selecione a criança";
    if (!relation) e.relation = "Selecione a relação";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Salvar ──
  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const targetChildId = childId ?? selectedChild?.id;

    if (!targetChildId) {
      setErrors({ general: "Criança não identificada." });
      setSaving(false);
      return;
    }

    if (existingGuardian) {
      // Só adiciona vínculo com a criança
      const { error } = await supabase.from("guardianships").insert({
        school_id: schoolId,
        child_id: targetChildId,
        user_id: existingGuardian.id,
        type: "principal",
        relation,
        added_by: userId,
        start_date: new Date().toISOString().split("T")[0],
      });

      if (error) {
        setErrors({ general: "Erro ao salvar vínculo. Tente novamente." });
        setSaving(false);
        return;
      }

      setSaving(false);
      setStep("result");
      onSaved();
    } else {
      // Novo responsável — chama Server Action
      const result = await registerGuardian({
        schoolId,
        registeredBy: userId,
        name,
        phone,
        cpf: cpf.replace(/\D/g, ""),
        childId: targetChildId,
        relation: relation!,
      });

      if (!result.ok) {
        setErrors({ general: result.error });
        setSaving(false);
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      setInviteLink(`${baseUrl}/convite/${result.token}`);
      setSaving(false);
      setStep("result");
      onSaved();
    }
  }

  // ── Copia link ──
  async function copyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Crianças filtradas pela busca (só usado sem childId) ──
  const filteredChildren = children.filter((c) =>
    c.name.toLowerCase().includes(childSearch.toLowerCase()),
  );

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

        {/* ── Etapa 1: CPF ── */}
        {step === "cpf" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-bold text-[#3A2E24]">
              Cadastrar responsável
            </h2>
            <p className="text-sm text-[#8C7060] -mt-2">
              Digite o CPF do responsável para verificar se já tem cadastro.
            </p>

            <Input
              label="CPF"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              error={errors.cpf}
            />

            <Button
              variant="primary"
              loading={searching}
              onClick={handleVerifyCpf}
            >
              Continuar
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        )}

        {/* ── Etapa 2: Dados ── */}
        {step === "details" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-bold text-[#3A2E24]">
              {existingGuardian ? existingGuardian.name : "Novo responsável"}
            </h2>

            {existingGuardian ? (
              <div className="p-3 rounded-[14px] bg-[#EDF7ED] border border-[#72AA78]/20">
                <p className="text-sm text-[#72AA78] font-medium">
                  ✓ Responsável já cadastrado
                </p>
                <p className="text-xs text-[#8C7060] mt-0.5">
                  Só é necessário vincular à criança.
                </p>
              </div>
            ) : (
              <>
                <Input
                  label="Nome completo"
                  placeholder="Nome do responsável"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                />
                <Input
                  label="Telefone"
                  placeholder="(00) 00000-0000"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={errors.phone}
                />
              </>
            )}

            {/* Seleção de criança — só aparece quando childId NÃO vem como prop */}
            {!childId && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#3A2E24]">
                  Criança
                </span>
                <input
                  type="text"
                  placeholder="Buscar pelo nome..."
                  value={childSearch}
                  onChange={(e) => setChildSearch(e.target.value)}
                  className="
                    w-full rounded-[14px] border border-[#E8E0D8] px-4 py-3 text-sm
                    bg-[#FFFDF9] text-[#3A2E24] placeholder:text-[#C4B5A8]
                    outline-none transition-all duration-200
                    focus:border-[#FF8C66] focus:ring-2 focus:ring-[#FF8C66]/20
                  "
                />
                {errors.child && (
                  <span className="text-xs text-[#E86C88]">{errors.child}</span>
                )}
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {filteredChildren.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedChild(c)}
                      className={`
                        w-full text-left px-4 py-2.5 rounded-[10px] text-sm transition-all border
                        ${selectedChild?.id === c.id
                          ? "border-[#FF8C66] bg-[#FFF5F0] font-medium text-[#3A2E24]"
                          : "border-[#E8E0D8] text-[#3A2E24] hover:border-[#FF8C66]"
                        }
                      `}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Relação */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#3A2E24]">
                Relação com a criança
              </span>
              <div className="flex flex-wrap gap-2">
                {relationOptions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRelation(r)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
                      ${relation === r
                        ? "bg-[#FF8C66] text-white shadow-[0_2px_8px_rgba(180,140,120,0.25)]"
                        : "bg-[#FAF7F2] text-[#8C7060] border border-[#E8E0D8] hover:border-[#FF8C66]"
                      }
                    `}
                  >
                    {relationLabels[r]}
                  </button>
                ))}
              </div>
              {errors.relation && (
                <span className="text-xs text-[#E86C88]">{errors.relation}</span>
              )}
            </div>

            {errors.general && (
              <span className="text-xs text-[#E86C88]">{errors.general}</span>
            )}

            {/* Confirmação visual */}
            {relation && (selectedChild || childId) && (
              <div className="p-4 rounded-[14px] bg-[#FAF7F2] border border-[#E8E0D8]">
                <p className="text-sm text-[#3A2E24]">
                  <span className="font-semibold">
                    {existingGuardian ? existingGuardian.name : name || "—"}
                  </span>{" "}
                  será vinculado(a) como{" "}
                  <span className="font-semibold">{relationLabels[relation]}</span>
                  {selectedChild && (
                    <>
                      {" "}de{" "}
                      <span className="font-semibold">{selectedChild.name}</span>
                    </>
                  )}
                  .
                </p>
              </div>
            )}

            <Button variant="primary" loading={saving} onClick={handleSave}>
              {existingGuardian ? "Salvar vínculo" : "Cadastrar e gerar convite"}
            </Button>
            <Button variant="ghost" onClick={() => setStep("cpf")}>
              Voltar
            </Button>
          </div>
        )}

        {/* ── Etapa 3: Resultado ── */}
        {step === "result" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-bold text-[#3A2E24]">
              {inviteLink ? "Convite gerado!" : "Vínculo salvo!"}
            </h2>

            {inviteLink ? (
              <>
                <p className="text-sm text-[#8C7060]">
                  Copie o link abaixo e envie para o responsável pelo WhatsApp.
                  O link expira em 72 horas.
                </p>
                <div className="p-4 rounded-[14px] bg-[#FAF7F2] border border-[#E8E0D8] break-all">
                  <p className="text-xs text-[#8C7060] font-mono">{inviteLink}</p>
                </div>
                <Button
                  variant="primary"
                  customColor={copied ? "#72AA78" : undefined}
                  customTextColor={copied ? "#fff" : undefined}
                  onClick={copyLink}
                >
                  {copied ? "✓ Copiado!" : "Copiar link"}
                </Button>
              </>
            ) : (
              <p className="text-sm text-[#8C7060]">
                O responsável já tem acesso ao sistema. A nova criança aparecerá
                no feed dele automaticamente.
              </p>
            )}

            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </div>
        )}
      </div>
    </>
  );
}