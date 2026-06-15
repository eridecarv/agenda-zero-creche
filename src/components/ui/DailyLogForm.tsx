/**
 * DailyLogForm — formulário de registro diário de uma criança.
 *
 * Reutilizável por adm e professor. Recebe child_id e data,
 * carrega o registro existente (se houver) e permite registrar
 * ou atualizar presença, humor, sono, alimentação, higiene e recado.
 *
 * A seção "Saída" é a última — registra horário e responsável que buscou.
 * Quando preenchida, encerra o dia no feed do responsável.
 *
 * Estrutura em acordeão — cada seção expande ao clicar.
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Mood, Sleep, Meal, Acceptance } from "@/types";
import { guardianDisplayName } from "@/lib/guardianDisplayName";

// ── Helpers ──────────────────────────────────────────────

const MOOD_OPTIONS: { value: Mood; label: string; emoji: string }[] = [
  { value: "happy", label: "Contente", emoji: "😄" },
  { value: "calm", label: "Tranquilo", emoji: "😌" },
  { value: "restless", label: "Agitado", emoji: "😤" },
  { value: "tearful", label: "Choroso", emoji: "😢" },
];

const SLEEP_OPTIONS: { value: Sleep; label: string; emoji: string }[] = [
  { value: "good", label: "Bom", emoji: "😴" },
  { value: "fair", label: "Regular", emoji: "😎" },
  { value: "poor", label: "Ruim", emoji: "😫" },
  { value: "did_not_sleep", label: "Não dormiu", emoji: "😵" },
];

const MEAL_OPTIONS: { value: Meal; label: string; emoji: string }[] = [
  { value: "breakfast", label: "Café da manhã", emoji: "🍳" },
  { value: "morning_snack", label: "Lanche manhã", emoji: "🍎" },
  { value: "lunch", label: "Almoço", emoji: "🍽️" },
  { value: "afternoon_snack", label: "Lanche tarde", emoji: "🧃" },
  { value: "dinner", label: "Jantar", emoji: "🌙" },
];

const ACCEPTANCE_OPTIONS: {
  value: Acceptance;
  label: string;
  color: string;
}[] = [
  { value: "good", label: "Boa", color: "#72AA78" },
  { value: "fair", label: "Regular", color: "#F5C632" },
  { value: "refused", label: "Recusou", color: "#E86C88" },
];

// ── Subcomponentes ────────────────────────────────────────

function Section({
  title,
  emoji,
  open,
  onToggle,
  children,
  complete,
  disabled,
}: {
  title: string;
  emoji: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  complete?: boolean;
  disabled?: boolean;
}) {
  return (
    <Card padding="lg" className="overflow-hidden !p-0">
      <button
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-5 py-4 ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{emoji}</span>
          <span className="text-sm font-semibold text-[#3A2E24]">{title}</span>
          {complete && (
            <span className="text-xs text-[#72AA78] font-medium">✓</span>
          )}
        </div>
        {!disabled && (
          <span
            className={`text-[#C8B8A8] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        )}
      </button>

      {open && !disabled && (
        <div className="px-5 pb-5 border-t border-[#F0E8E0] pt-5">
          {children}
        </div>
      )}
    </Card>
  );
}

function OptionPill({
  label,
  emoji,
  selected,
  onClick,
  color,
}: {
  label: string;
  emoji?: string;
  selected: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <Button
      variant="pill"
      fullWidth={false}
      onClick={onClick}
      customColor={selected ? (color ?? "#FF8C66") : undefined}
      customTextColor={selected ? "#ffffff" : "#8C7060"}
      style={!selected ? { backgroundColor: "#F5EFE8" } : undefined}
    >
      {emoji && <span className="mr-1">{emoji}</span>}
      {label}
    </Button>
  );
}

function NotesField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mt-3">
      <p className="text-xs text-[#B0A090] mb-1">Observação opcional</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="
          w-full rounded-[14px] bg-[#F5EFE8] px-4 py-3
          text-sm text-[#3A2E24] placeholder-[#C8B8A8]
          focus:outline-none focus:ring-2 focus:ring-[#FF8C66]/30
          resize-none
        "
      />
    </div>
  );
}

// ── Tipos internos ────────────────────────────────────────

type MealState = {
  acceptance: Acceptance | null;
  notes: string;
};

type FeedingState = Record<Meal, MealState>;

type HygieneState = {
  bath: boolean;
  brushing: boolean;
  bowelMovement: boolean;
  notes: string;
};

type Guardian = {
  user_id: string;
  name: string;
  nickname: string | null;
  relation: string;
};

type Props = {
  childId: string;
  schoolId: string;
  date: string;
  recordedBy: string;
  onSaved?: () => void;
};

const initialFeeding: FeedingState = {
  breakfast:       { acceptance: null, notes: "" },
  morning_snack:   { acceptance: null, notes: "" },
  lunch:           { acceptance: null, notes: "" },
  afternoon_snack: { acceptance: null, notes: "" },
  dinner:          { acceptance: null, notes: "" },
};


// ── Componente principal ──────────────────────────────────

export function DailyLogForm({
  childId,
  schoolId,
  date,
  recordedBy,
  onSaved,
}: Props) {
  const supabase = createClient();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    attendance: true,
    mood: false,
    sleep: false,
    feeding: false,
    hygiene: false,
    message: false,
    checkout: false,
  });

  const [dailyLogId, setDailyLogId] = useState<string | null>(null);
  const [attendanceLogId, setAttendanceLogId] = useState<string | null>(null);
  const [hygieneLogId, setHygieneLogId] = useState<string | null>(null);

  const [present, setPresent] = useState<boolean | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [moodNotes, setMoodNotes] = useState("");
  const [sleep, setSleep] = useState<Sleep | null>(null);
  const [sleepNotes, setSleepNotes] = useState("");
  const [message, setMessage] = useState("");
  const [feeding, setFeeding] = useState<FeedingState>(initialFeeding);
  const [hygiene, setHygiene] = useState<HygieneState>({
    bath: false,
    brushing: false,
    bowelMovement: false,
    notes: "",
  });

  // Saída
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [checkOutTime, setCheckOutTime] = useState("");
  const [pickedUpBy, setPickedUpBy] = useState<string | null>(null);
  const [checkOutRecorded, setCheckOutRecorded] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Carrega responsáveis vinculados à criança
      const { data: guardianships } = await supabase
        .from("guardianships")
        .select("user_id, nickname, relation")
        .eq("child_id", childId)
        .eq("active", true);

      if (guardianships && guardianships.length > 0) {
        const userIds = guardianships.map((g: any) => g.user_id);
        const { data: users } = await supabase
          .from("users")
          .select("id, name")
          .in("id", userIds);

        const userMap: Record<string, string> = {};
        users?.forEach((u: any) => {
          userMap[u.id] = u.name;
        });

        setGuardians(
          guardianships.map((g: any) => ({
            user_id: g.user_id,
            name: userMap[g.user_id] ?? "",
            nickname: g.nickname,
            relation: g.relation,
          })),
        );
      }

      const { data: dl } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("child_id", childId)
        .eq("date", date)
        .single();

      if (dl) {
        setDailyLogId(dl.id);
        setMood(dl.mood);
        setMoodNotes(dl.mood_notes ?? "");
        setSleep(dl.sleep);
        setSleepNotes(dl.sleep_notes ?? "");

        const { data: al } = await supabase
          .from("attendance_logs")
          .select("*")
          .eq("daily_log_id", dl.id)
          .single();

        if (al) {
          setAttendanceLogId(al.id);
          setPresent(al.present);

          if (al.check_out) {
            const checkOut = new Date(al.check_out);
            setCheckOutTime(
              checkOut.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Recife",
              }),
            );
            setCheckOutRecorded(true);
          }

          if (al.picked_up_by) {
            setPickedUpBy(al.picked_up_by);
          }
        }

        const { data: fls } = await supabase
          .from("feeding_logs")
          .select("*")
          .eq("daily_log_id", dl.id);

        if (fls) {
          const newFeeding = { ...initialFeeding };
          fls.forEach((f: any) => {
            newFeeding[f.meal as Meal] = {
              acceptance: f.acceptance,
              notes: f.notes ?? "",
            };
          });
          setFeeding(newFeeding);
        }

        const { data: hl } = await supabase
          .from("hygiene_logs")
          .select("*")
          .eq("daily_log_id", dl.id)
          .single();

        if (hl) {
          setHygieneLogId(hl.id);
          setHygiene({
            bath: hl.bath,
            brushing: hl.brushing,
            bowelMovement: hl.bowel_movement,
            notes: hl.notes ?? "",
          });
        }
      }

      setLoading(false);
    }
    load();
  }, [childId, date]);

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }


  async function save() {
    setSaving(true);
    try {
      let dlId = dailyLogId;

      if (dlId) {
        await supabase
          .from("daily_logs")
          .update({
            mood,
            mood_notes: moodNotes || null,
            sleep,
            sleep_notes: sleepNotes || null,
            recorded_by: recordedBy,
            updated_at: new Date().toISOString(),
          })
          .eq("id", dlId);
      } else {
        const { data: dl } = await supabase
          .from("daily_logs")
          .insert({
            school_id: schoolId,
            child_id: childId,
            date,
            mood,
            mood_notes: moodNotes || null,
            sleep,
            sleep_notes: sleepNotes || null,
            recorded_by: recordedBy,
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        dlId = dl?.id ?? null;
        setDailyLogId(dlId);
      }

      if (!dlId) throw new Error("Falha ao criar registro diário");

      // Monta timestamp de saída a partir do horário digitado e da data do registro
      const checkOutTimestamp = checkOutTime
        ? (() => {
            const [h, m] = checkOutTime.split(":").map(Number);
            const d = new Date(
              `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`,
            );
            return d.toISOString();
          })()
        : null;

      if (present !== null) {
        if (attendanceLogId) {
          await supabase
            .from("attendance_logs")
            .update({
              present,
              check_out: checkOutTimestamp,
              picked_up_by: pickedUpBy,
            })
            .eq("id", attendanceLogId);
        } else {
          const { data: al } = await supabase
            .from("attendance_logs")
            .insert({
              daily_log_id: dlId,
              present,
              check_out: checkOutTimestamp,
              picked_up_by: pickedUpBy,
            })
            .select("id")
            .single();
          setAttendanceLogId(al?.id ?? null);
        }

        if (checkOutTimestamp) setCheckOutRecorded(true);
      }

      const recordedMeals = (
        Object.entries(feeding) as [Meal, MealState][]
      ).filter(([, v]) => v.acceptance !== null);

      if (recordedMeals.length > 0) {
        await supabase.from("feeding_logs").delete().eq("daily_log_id", dlId);

        await supabase.from("feeding_logs").insert(
          recordedMeals.map(([meal, v]) => ({
            daily_log_id: dlId,
            meal,
            acceptance: v.acceptance,
            notes: v.notes || null,
          })),
        );
      }

      if (hygieneLogId) {
        await supabase
          .from("hygiene_logs")
          .update({
            bath: hygiene.bath,
            brushing: hygiene.brushing,
            bowel_movement: hygiene.bowelMovement,
            notes: hygiene.notes || null,
          })
          .eq("id", hygieneLogId);
      } else {
        const { data: hl } = await supabase
          .from("hygiene_logs")
          .insert({
            daily_log_id: dlId,
            bath: hygiene.bath,
            brushing: hygiene.brushing,
            bowel_movement: hygiene.bowelMovement,
            notes: hygiene.notes || null,
          })
          .select("id")
          .single();
        setHygieneLogId(hl?.id ?? null);
      }

      if (message.trim()) {
        await supabase.from("messages").insert({
          school_id: schoolId,
          child_id: childId,
          sent_by: recordedBy,
          content: message.trim(),
        });
        setMessage("");
      }

      setSavedAt(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      onSaved?.();
    } catch (e) {
      console.error("Erro ao salvar diário:", e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-sm text-[#8C7060]">Carregando...</span>
      </div>
    );
  }

  const checkOutComplete = !!(checkOutTime && pickedUpBy);

  return (
    <div className="flex flex-col gap-3">
      {/* Presença */}
      <Section
        title="Presença"
        emoji="✅"
        open={openSections.attendance}
        onToggle={() => toggleSection("attendance")}
        complete={present !== null}
      >
        <div className="flex gap-3">
          <OptionPill
            label="Presente"
            emoji="✅"
            selected={present === true}
            onClick={() => setPresent(true)}
            color="#72AA78"
          />
          <OptionPill
            label="Ausente"
            emoji="❌"
            selected={present === false}
            onClick={() => setPresent(false)}
            color="#E86C88"
          />
        </div>
      </Section>

      {/* Humor */}
      <Section
        title="Humor"
        emoji="😊"
        open={openSections.mood}
        onToggle={() => toggleSection("mood")}
        complete={mood !== null}
      >
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((o) => (
            <OptionPill
              key={o.value}
              label={o.label}
              emoji={o.emoji}
              selected={mood === o.value}
              onClick={() => setMood(o.value)}
            />
          ))}
        </div>
        <NotesField
          value={moodNotes}
          onChange={setMoodNotes}
          placeholder="Ex: ficou mais quieta depois do almoço..."
        />
      </Section>

      {/* Sono */}
      <Section
        title="Sono"
        emoji="😴"
        open={openSections.sleep}
        onToggle={() => toggleSection("sleep")}
        complete={sleep !== null}
      >
        <div className="flex flex-wrap gap-2">
          {SLEEP_OPTIONS.map((o) => (
            <OptionPill
              key={o.value}
              label={o.label}
              emoji={o.emoji}
              selected={sleep === o.value}
              onClick={() => setSleep(o.value)}
            />
          ))}
        </div>
        <NotesField
          value={sleepNotes}
          onChange={setSleepNotes}
          placeholder="Ex: demorou para pegar no sono mas acordou bem..."
        />
      </Section>

      {/* Alimentação */}
      <Section
        title="Alimentação"
        emoji="🍽️"
        open={openSections.feeding}
        onToggle={() => toggleSection("feeding")}
        complete={Object.values(feeding).some((v) => v.acceptance !== null)}
      >
        <div className="flex flex-col gap-5">
          {MEAL_OPTIONS.map((m) => (
            <div key={m.value}>
              <p className="text-xs font-semibold text-[#8C7060] mb-2">
                {m.emoji} {m.label}
              </p>
              <div className="flex gap-2">
                {ACCEPTANCE_OPTIONS.map((a) => (
                  <OptionPill
                    key={a.value}
                    label={a.label}
                    selected={feeding[m.value].acceptance === a.value}
                    onClick={() =>
                      setFeeding((prev) => ({
                        ...prev,
                        [m.value]: { ...prev[m.value], acceptance: a.value },
                      }))
                    }
                    color={a.color}
                  />
                ))}
              </div>
              <NotesField
                value={feeding[m.value].notes}
                onChange={(v) =>
                  setFeeding((prev) => ({
                    ...prev,
                    [m.value]: { ...prev[m.value], notes: v },
                  }))
                }
                placeholder="Ex: comeu bem, pediu mais frango..."
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Higiene */}
      <Section
        title="Higiene"
        emoji="🚿"
        open={openSections.hygiene}
        onToggle={() => toggleSection("hygiene")}
        complete={hygiene.bath || hygiene.brushing || hygiene.bowelMovement}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {[
              { key: "bath", label: "Banho", emoji: "🚿" },
              { key: "brushing", label: "Escovação", emoji: "🪥" },
              { key: "bowelMovement", label: "Evacuação", emoji: "🚽" },
            ].map((item) => (
              <Button
                key={item.key}
                fullWidth
                variant="ghost"
                customColor={
                  hygiene[item.key as "bath" | "brushing" | "bowelMovement"]
                    ? "#EAF3DE"
                    : "#F5EFE8"
                }
                customTextColor={
                  hygiene[item.key as "bath" | "brushing" | "bowelMovement"]
                    ? "#3A7A42"
                    : "#8C7060"
                }
                onClick={() =>
                  setHygiene((prev) => ({
                    ...prev,
                    [item.key]: !prev[item.key as keyof HygieneState],
                  }))
                }
              >
                <span className="flex items-center gap-3 w-full">
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                  {hygiene[
                    item.key as "bath" | "brushing" | "bowelMovement"
                  ] && <span className="ml-auto text-[#72AA78]">✓</span>}
                </span>
              </Button>
            ))}
          </div>
          <NotesField
            value={hygiene.notes}
            onChange={(v) => setHygiene((prev) => ({ ...prev, notes: v }))}
            placeholder="Ex: evacuou bem mas chorou um pouco..."
          />
        </div>
      </Section>

      {/* Recado */}
      <Section
        title="Recado para os responsáveis"
        emoji="💬"
        open={openSections.message}
        onToggle={() => toggleSection("message")}
        complete={message.trim().length > 0}
      >
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex: o xampu da Natália está quase no fim..."
          rows={3}
          className="
            w-full rounded-[14px] bg-[#F5EFE8] px-4 py-3
            text-sm text-[#3A2E24] placeholder-[#C8B8A8]
            focus:outline-none focus:ring-2 focus:ring-[#FF8C66]/30
            resize-none
          "
        />
        <p className="text-xs text-[#B0A090] mt-2">
          O recado será enviado assim que você salvar.
        </p>
      </Section>

      {/* Saída — só aparece se a criança está presente */}
      <Section
        title="Saída"
        emoji="👋"
        open={openSections.checkout}
        onToggle={() => toggleSection("checkout")}
        complete={checkOutComplete}
        disabled={present !== true}
      >
        {checkOutRecorded ? (
          // Estado: saída já registrada
          <div className="flex flex-col gap-3">
            <div
              className="flex items-center gap-3 rounded-[14px] px-4 py-3"
              style={{ backgroundColor: "#EAF3DE" }}
            >
              <span className="text-lg">✓</span>
              <div>
                <p className="text-sm font-semibold text-[#3A7A42]">
                  Saída registrada às {checkOutTime}
                </p>
                {pickedUpBy && (
                  <p className="text-xs text-[#5A8A62] mt-0.5">
                    {guardianDisplayName(
                      guardians.find((g) => g.user_id === pickedUpBy) ?? {
                        user_id: pickedUpBy,
                        name: "",
                        nickname: null,
                        relation: "outro",
                      },
                    )}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-[#B0A090]">
              O dia desta criança está encerrado no app dos responsáveis. Você
              pode corrigir salvando novamente.
            </p>
            {/* Permite corrigir */}
            <div className="flex flex-col gap-3 pt-1">
              <div>
                <p className="text-xs text-[#B0A090] mb-1">Horário de saída</p>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="
                    w-full rounded-[14px] bg-[#F5EFE8] px-4 py-3
                    text-sm text-[#3A2E24]
                    focus:outline-none focus:ring-2 focus:ring-[#FF8C66]/30
                  "
                />
              </div>
              <div>
                <p className="text-xs text-[#B0A090] mb-1">Com quem saiu</p>
                <div className="flex flex-col gap-2">
                  {guardians.map((g) => (
                    <Button
                      key={g.user_id}
                      fullWidth
                      variant="ghost"
                      customColor={
                        pickedUpBy === g.user_id ? "#FEF0E8" : "#F5EFE8"
                      }
                      customTextColor={
                        pickedUpBy === g.user_id ? "#C05A2A" : "#8C7060"
                      }
                      onClick={() => setPickedUpBy(g.user_id)}
                    >
                      <span className="flex items-center gap-3 w-full">
                        <span className="flex-1 text-left">
                          {guardianDisplayName(g)}
                        </span>
                        {pickedUpBy === g.user_id && (
                          <span className="text-[#FF8C66]">✓</span>
                        )}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Estado: saída ainda não registrada
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-[#B0A090] mb-1">Horário de saída</p>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="
                  w-full rounded-[14px] bg-[#F5EFE8] px-4 py-3
                  text-sm text-[#3A2E24]
                  focus:outline-none focus:ring-2 focus:ring-[#FF8C66]/30
                "
              />
            </div>

            {guardians.length > 0 ? (
              <div>
                <p className="text-xs text-[#B0A090] mb-2">Com quem saiu</p>
                <div className="flex flex-col gap-2">
                  {guardians.map((g) => (
                    <Button
                      key={g.user_id}
                      fullWidth
                      variant="ghost"
                      customColor={
                        pickedUpBy === g.user_id ? "#FEF0E8" : "#F5EFE8"
                      }
                      customTextColor={
                        pickedUpBy === g.user_id ? "#C05A2A" : "#8C7060"
                      }
                      onClick={() => setPickedUpBy(g.user_id)}
                    >
                      <span className="flex items-center gap-3 w-full">
                        <span className="flex-1 text-left">
                          {guardianDisplayName(g)}
                        </span>
                        {pickedUpBy === g.user_id && (
                          <span className="text-[#FF8C66]">✓</span>
                        )}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#C4A882]">
                Nenhum responsável vinculado a esta criança.
              </p>
            )}

            <p className="text-xs text-[#B0A090]">
              Ao salvar com a saída preenchida, o dia será encerrado no app dos
              responsáveis.
            </p>
          </div>
        )}
      </Section>

      {/* Botão salvar */}
      <Button
        variant="primary"
        fullWidth
        loading={saving}
        onClick={save}
        style={{ borderRadius: "20px", marginTop: "8px", padding: "16px" }}
      >
        Salvar diário
      </Button>

      {savedAt && (
        <p className="text-center text-xs text-[#72AA78]">
          ✓ Salvo às {savedAt}
        </p>
      )}
    </div>
  );
}
