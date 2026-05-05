/**
 * ConvitePage — página pública de ativação de conta do responsável.
 *
 * Acessada via link enviado pelo WhatsApp: /convite/[token]
 *
 * Etapas:
 * 1. Valida o token ao carregar — existe, não expirou, não foi usado
 * 2. Responsável confirma o CPF
 * 3. Responsável cria a senha
 * 4. Sistema cria a conta no Auth e redireciona para o feed
 *
 * Rota pública — não requer autenticação.
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ativarResponsavel } from "@/app/actions/ativarResponsavel";
import { createClient } from "@/lib/supabase";

type StatusToken = "carregando" | "valido" | "invalido" | "expirado" | "usado";

// ── Formata CPF enquanto digita ───────────────────────────────
function formatarCpf(valor: string): string {
  const nums = valor.replace(/\D/g, "").slice(0, 11);
  return nums
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export default function ConvitePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const token = params.token as string;

  // Status do token
  const [statusToken, setStatusToken] = useState<StatusToken>("carregando");
  const [nomeCrianca, setNomeCrianca] = useState<string | null>(null);

  // Form
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // Estado
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ativando, setAtivando] = useState(false);
  const [etapa, setEtapa] = useState<"cpf" | "senha">("cpf");

  // ── Valida o token ao carregar ──
  useEffect(() => {
    async function validarToken() {
      // 1. Busca só o convite — tabela pública
      const { data: convite } = await supabase
        .from("convites")
        .select("id, expira_em, usado_em, usuario_id")
        .eq("token", token)
        .single();

      if (!convite) {
        setStatusToken("invalido");
        return;
      }
      if (convite.usado_em) {
        setStatusToken("usado");
        return;
      }
      if (new Date(convite.expira_em) < new Date()) {
        setStatusToken("expirado");
        return;
      }

      setStatusToken("valido");
    }
    validarToken();
  }, [token]);

  // ── Validação do CPF ──
  function validarCpf() {
    const e: Record<string, string> = {};
    if (cpf.replace(/\D/g, "").length !== 11) e.cpf = "CPF inválido.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Validação da senha ──
  function validarSenha() {
    const e: Record<string, string> = {};
    if (senha.length < 6) e.senha = "A senha deve ter pelo menos 6 caracteres.";
    if (senha !== confirmarSenha) e.confirmarSenha = "As senhas não coincidem.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Ativa a conta ──
  async function handleAtivar() {
    if (!validarSenha()) return;
    setAtivando(true);

    const resultado = await ativarResponsavel({
      token,
      cpf: cpf.replace(/\D/g, ""),
      senha,
    });

    if (!resultado.ok) {
      setErrors({ geral: resultado.erro });
      setAtivando(false);
      return;
    }

    // Faz login automaticamente após ativar
    // O email fictício é telefone@agendazero.internal
    // mas não temos o telefone aqui — vamos redirecionar para o login
    router.push("/login?ativado=true");
  }

  // ── Estados de token inválido ──
  if (statusToken === "carregando") {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <span className="text-sm text-[#8C7060]">Verificando convite...</span>
      </div>
    );
  }

  if (statusToken === "invalido") {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="font-display text-xl font-bold text-[#3A2E24] mb-2">
            Link inválido
          </h1>
          <p className="text-sm text-[#8C7060]">
            Esse link não existe ou foi removido. Entre em contato com a escola
            para receber um novo convite.
          </p>
        </div>
      </div>
    );
  }

  if (statusToken === "expirado") {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">⏰</p>
          <h1 className="font-display text-xl font-bold text-[#3A2E24] mb-2">
            Link expirado
          </h1>
          <p className="text-sm text-[#8C7060]">
            Esse convite expirou após 72 horas. Peça à escola que envie um novo
            link.
          </p>
        </div>
      </div>
    );
  }

  if (statusToken === "usado") {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">✓</p>
          <h1 className="font-display text-xl font-bold text-[#3A2E24] mb-2">
            Conta já ativada
          </h1>
          <p className="text-sm text-[#8C7060] mb-6">
            Esse convite já foi usado. Acesse o app com sua senha.
          </p>
          <Button variant="primary" onClick={() => router.push("/login")}>
            Ir para o login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center px-5 py-12">
      <div className="max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-3xl mb-3">👶</p>
          <h1 className="font-display text-2xl font-bold text-[#3A2E24]">
            Bem-vindo(a)!
          </h1>
          {nomeCrianca && (
            <p className="text-sm text-[#8C7060] mt-2">
              Você foi convidado(a) para acompanhar{" "}
              <span className="font-semibold text-[#3A2E24]">
                {nomeCrianca}
              </span>
              .
            </p>
          )}
        </div>

        {/* Etapa 1: CPF */}
        {etapa === "cpf" && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#FFFDF9] rounded-[20px] p-5 shadow-[0_2px_8px_rgba(180,140,120,0.12)]">
              <h2 className="font-display text-base font-bold text-[#3A2E24] mb-1">
                Confirme sua identidade
              </h2>
              <p className="text-xs text-[#8C7060] mb-4">
                Digite seu CPF para confirmar que é você.
              </p>

              <Input
                label="CPF"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatarCpf(e.target.value))}
                error={errors.cpf}
              />
            </div>

            <Button
              variant="primary"
              onClick={() => {
                if (validarCpf()) setEtapa("senha");
              }}
            >
              Confirmar
            </Button>
          </div>
        )}

        {/* Etapa 2: Senha */}
        {etapa === "senha" && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#FFFDF9] rounded-[20px] p-5 shadow-[0_2px_8px_rgba(180,140,120,0.12)]">
              <h2 className="font-display text-base font-bold text-[#3A2E24] mb-1">
                Crie sua senha
              </h2>
              <p className="text-xs text-[#8C7060] mb-4">
                Escolha uma senha para acessar o diário.
              </p>

              <div className="flex flex-col gap-3">
                <Input
                  label="Senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  error={errors.senha}
                />
                <Input
                  label="Confirmar senha"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  error={errors.confirmarSenha}
                />
              </div>
            </div>

            {errors.geral && (
              <span className="text-xs text-[#E86C88] text-center">
                {errors.geral}
              </span>
            )}

            <Button variant="primary" loading={ativando} onClick={handleAtivar}>
              Criar conta e entrar
            </Button>

            <Button variant="ghost" onClick={() => setEtapa("cpf")}>
              Voltar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
