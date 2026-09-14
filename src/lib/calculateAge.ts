// ── Calcula idade ─────────────────────────────────────────────
export function calculateAge(birthDate: string | null): string {
  if (!birthDate) return ''
  const nasc = new Date(birthDate)
  const hoje = new Date()
  const meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth())
  if (meses < 12) return `${meses}m`
  const anos = Math.floor(meses / 12)
  const mesesRest = meses % 12
  return mesesRest > 0 ? `${anos}a ${mesesRest}m` : `${anos}a`
}
