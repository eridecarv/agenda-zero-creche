/**
 * ResponsavelModal — bottom sheet para cadastro e gestão de responsáveis.
 *
 * Fluxo de cadastro novo:
 * 1. Adm digita o CPF
 * 2. Sistema verifica se já existe responsável com esse CPF
 * 3a. Não existe: adm preenche nome, telefone e relação
 * 3b. Existe: mostra nome, adm só vincula à criança
 * 4. Confirmação visual antes de salvar
 * 5. Salva e exibe link do convite (só para responsável novo)
 *
 * Quando `criancaId` vem como prop (aberto pelo CriancaModal):
 * - A seleção de criança some — já sabemos qual é
 * - O fluxo fica mais curto: CPF → dados → resultado
 *
 * Props:
 * - escolaId: obrigatório
 * - usuarioId: id do adm logado
 * - criancaId: se vier, pré-seleciona a criança e esconde o campo
 * - onClose: fecha o modal
 * - onSaved: recarrega os dados
 */

"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cadastrarResponsavel } from "@/app/actions/cadastrarResponsavel";
import { createClient } from "@/lib/supabase";
import type { Crianca, RelacaoVinculo } from "@/types";

// ── Labels ────────────────────────────────────────────────────
const relacaoLabels: Record<RelacaoVinculo, string> = {
  mae: "Mãe",
  pai: "Pai",
  avo: "Avô",
  ava: "Avó",
  tio: "Tio",
  tia: "Tia",
  outro: "Outro",
};

const relacaoOptions: RelacaoVinculo[] = [
  "mae",
  "pai",
  "ava",
  "avo",
  "tia",
  "tio",
  "outro",
];

// ── Tipo local de responsável encontrado ──────────────────────
type ResponsavelEncontrado = {
  id: string;
  nome: string;
  temContaAtiva: boolean;
};

// ── Props ─────────────────────────────────────────────────────
type ResponsavelModalProps = {
  escolaId: string;
  usuarioId: string;
  criancaId?: string; // se vier, pré-seleciona a criança e esconde o campo
  onClose: () => void;
  onSaved: () => void;
};

// ── Formata CPF enquanto digita ───────────────────────────────
function formatarCpf(valor: string): string {
  const nums = valor.replace(/\D/g, "").slice(0, 11);
  return nums
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

// ── Modal ─────────────────────────────────────────────────────
export function ResponsavelModal({
  escolaId,
  usuarioId,
  criancaId,
  onClose,
  onSaved,
}: ResponsavelModalProps) {
  const supabase = createClient();

  type Etapa = "cpf" | "dados" | "resultado";
  const [etapa, setEtapa] = useState<Etapa>("cpf");

  // CPF
  const [cpf, setCpf] = useState("");
  const [buscando, setBuscando] = useState(false);

  // Responsável encontrado (se existir)
  const [responsavelExistente, setResponsavelExistente] =
    useState<ResponsavelEncontrado | null>(null);

  // Dados do novo responsável
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  // Vínculo
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [criancaSelecionada, setCriancaSelecionada] = useState<Crianca | null>(
    null,
  );
  const [buscaCrianca, setBuscaCrianca] = useState("");
  const [relacao, setRelacao] = useState<RelacaoVinculo | null>(null);

  // Estado
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [linkConvite, setLinkConvite] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  // ── Se criancaId vier como prop, busca só essa criança ──
  // Se não vier, busca todas para o adm selecionar
  useEffect(() => {
    async function buscarCrianca() {
      if (criancaId) {
        const { data } = await supabase
          .from("criancas")
          .select("*")
          .eq("id", criancaId)
          .single();
        if (data) setCriancaSelecionada(data);
      } else {
        const { data } = await supabase
          .from("criancas")
          .select("*")
          .eq("escola_id", escolaId)
          .eq("ativo", true)
          .order("nome");
        if (data) setCriancas(data);
      }
    }
    buscarCrianca();
  }, []);

  // ── Verifica CPF no banco via Server Action ──
  async function handleVerificarCpf() {
    const cpfLimpo = cpf.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) {
      setErrors({ cpf: "CPF inválido." });
      return;
    }
    setErrors({});
    setBuscando(true);

    const { verificarCpfResponsavel } =
      await import("@/app/actions/verificarCpf");
    const encontrado = await verificarCpfResponsavel({ cpfLimpo, escolaId });

    if (encontrado) {
      setResponsavelExistente(encontrado);
    } else {
      setResponsavelExistente(null);
    }

    setEtapa("dados");
    setBuscando(false);
  }

  // ── Validação ──
  function validar() {
    const e: Record<string, string> = {};
    if (!responsavelExistente && !nome.trim()) e.nome = "Nome é obrigatório";
    if (!responsavelExistente && !telefone.replace(/\D/g, ""))
      e.telefone = "Telefone é obrigatório";
    if (!criancaSelecionada && !criancaId) e.crianca = "Selecione a criança";
    if (!relacao) e.relacao = "Selecione a relação";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Salvar ──
  async function handleSalvar() {
    if (!validar()) return;
    setSalvando(true);

    // Usa criancaId da prop ou da seleção
    const idCrianca = criancaId ?? criancaSelecionada?.id;

    if (!idCrianca) {
      setErrors({ geral: "Criança não identificada." });
      setSalvando(false);
      return;
    }

    if (responsavelExistente) {
      // Só adiciona vínculo com a criança
      const { error } = await supabase.from("vinculos").insert({
        escola_id: escolaId,
        crianca_id: idCrianca,
        usuario_id: responsavelExistente.id,
        tipo: "principal",
        relacao,
        adicionado_por: usuarioId,
        data_inicio: new Date().toISOString().split("T")[0],
      });

      if (error) {
        setErrors({ geral: "Erro ao salvar vínculo. Tente novamente." });
        setSalvando(false);
        return;
      }

      setSalvando(false);
      setEtapa("resultado");
      onSaved();
    } else {
      // Novo responsável — chama Server Action
      const resultado = await cadastrarResponsavel({
        escolaId,
        cadastradoPor: usuarioId,
        nome,
        telefone,
        cpf: cpf.replace(/\D/g, ""),
        criancaId: idCrianca,
        relacao: relacao!,
      });

      if (!resultado.ok) {
        setErrors({ geral: resultado.erro });
        setSalvando(false);
        return;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      setLinkConvite(`${baseUrl}/convite/${resultado.token}`);
      setSalvando(false);
      setEtapa("resultado");
      onSaved();
    }
  }

  // ── Copia link ──
  async function copiarLink() {
    if (!linkConvite) return;
    await navigator.clipboard.writeText(linkConvite);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  // ── Criancas filtradas pela busca (só usado sem criancaId) ──
  const criancasFiltradas = criancas.filter((c) =>
    c.nome.toLowerCase().includes(buscaCrianca.toLowerCase()),
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div
        className="
        fixed bottom-0 left-0 right-0 z-50
        bg-[#FFFDF9] rounded-t-[28px]
        shadow-[0_-4px_24px_rgba(180,140,120,0.18)]
        px-5 pt-5 pb-10
        max-w-lg mx-auto
        max-h-[90vh] overflow-y-auto
      "
      >
        <div className="w-10 h-1 bg-[#E8E0D8] rounded-full mx-auto mb-5" />

        {/* ── Etapa 1: CPF ── */}
        {etapa === "cpf" && (
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
              onChange={(e) => setCpf(formatarCpf(e.target.value))}
              error={errors.cpf}
            />

            <Button
              variant="primary"
              loading={buscando}
              onClick={handleVerificarCpf}
            >
              Continuar
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        )}

        {/* ── Etapa 2: Dados ── */}
        {etapa === "dados" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-bold text-[#3A2E24]">
              {responsavelExistente
                ? responsavelExistente.nome
                : "Novo responsável"}
            </h2>

            {responsavelExistente ? (
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
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  error={errors.nome}
                />
                <Input
                  label="Telefone"
                  placeholder="(00) 00000-0000"
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  error={errors.telefone}
                />
              </>
            )}

            {/* Seleção de criança — só aparece quando criancaId NÃO vem como prop */}
            {!criancaId && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#3A2E24]">
                  Criança
                </span>
                <input
                  type="text"
                  placeholder="Buscar pelo nome..."
                  value={buscaCrianca}
                  onChange={(e) => setBuscaCrianca(e.target.value)}
                  className="
                    w-full rounded-[14px] border border-[#E8E0D8] px-4 py-3 text-sm
                    bg-[#FFFDF9] text-[#3A2E24] placeholder:text-[#C4B5A8]
                    outline-none transition-all duration-200
                    focus:border-[#FF8C66] focus:ring-2 focus:ring-[#FF8C66]/20
                  "
                />
                {errors.crianca && (
                  <span className="text-xs text-[#E86C88]">
                    {errors.crianca}
                  </span>
                )}
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {criancasFiltradas.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCriancaSelecionada(c)}
                      className={`
                        w-full text-left px-4 py-2.5 rounded-[10px] text-sm transition-all border
                        ${
                          criancaSelecionada?.id === c.id
                            ? "border-[#FF8C66] bg-[#FFF5F0] font-medium text-[#3A2E24]"
                            : "border-[#E8E0D8] text-[#3A2E24] hover:border-[#FF8C66]"
                        }
                      `}
                    >
                      {c.nome}
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
                {relacaoOptions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRelacao(r)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
                      ${
                        relacao === r
                          ? "bg-[#FF8C66] text-white shadow-[0_2px_8px_rgba(180,140,120,0.25)]"
                          : "bg-[#FAF7F2] text-[#8C7060] border border-[#E8E0D8] hover:border-[#FF8C66]"
                      }
                    `}
                  >
                    {relacaoLabels[r]}
                  </button>
                ))}
              </div>
              {errors.relacao && (
                <span className="text-xs text-[#E86C88]">{errors.relacao}</span>
              )}
            </div>

            {errors.geral && (
              <span className="text-xs text-[#E86C88]">{errors.geral}</span>
            )}

            {/* Confirmação visual */}
            {relacao && (criancaSelecionada || criancaId) && (
              <div className="p-4 rounded-[14px] bg-[#FAF7F2] border border-[#E8E0D8]">
                <p className="text-sm text-[#3A2E24]">
                  <span className="font-semibold">
                    {responsavelExistente
                      ? responsavelExistente.nome
                      : nome || "—"}
                  </span>{" "}
                  será vinculado(a) como{" "}
                  <span className="font-semibold">
                    {relacaoLabels[relacao]}
                  </span>
                  {criancaSelecionada && (
                    <>
                      {" "}
                      de{" "}
                      <span className="font-semibold">
                        {criancaSelecionada.nome}
                      </span>
                    </>
                  )}
                  .
                </p>
              </div>
            )}

            <Button variant="primary" loading={salvando} onClick={handleSalvar}>
              {responsavelExistente
                ? "Salvar vínculo"
                : "Cadastrar e gerar convite"}
            </Button>
            <Button variant="ghost" onClick={() => setEtapa("cpf")}>
              Voltar
            </Button>
          </div>
        )}

        {/* ── Etapa 3: Resultado ── */}
        {etapa === "resultado" && (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-bold text-[#3A2E24]">
              {linkConvite ? "Convite gerado!" : "Vínculo salvo!"}
            </h2>

            {linkConvite ? (
              <>
                <p className="text-sm text-[#8C7060]">
                  Copie o link abaixo e envie para o responsável pelo WhatsApp.
                  O link expira em 72 horas.
                </p>
                <div className="p-4 rounded-[14px] bg-[#FAF7F2] border border-[#E8E0D8] break-all">
                  <p className="text-xs text-[#8C7060] font-mono">
                    {linkConvite}
                  </p>
                </div>
                <Button
                  variant="primary"
                  customColor={copiado ? "#72AA78" : undefined}
                  customTextColor={copiado ? "#fff" : undefined}
                  onClick={copiarLink}
                >
                  {copiado ? "✓ Copiado!" : "Copiar link"}
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
