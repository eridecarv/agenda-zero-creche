const RELATION_LABEL: Record<string, string> = {
  mae: 'Mãe',
  pai: 'Pai',
  avo: 'Avô',
  ava: 'Avó',
  tio: 'Tio',
  tia: 'Tia',
  outro: 'Responsável',
}

type Guardian = {
  user_id: string
  name: string
  nickname: string | null
  relation: string
}

export function guardianDisplayName(g: Guardian): string {
  if (g.nickname) return g.nickname
  const relLabel = RELATION_LABEL[g.relation] ?? 'Responsável'
  return `${relLabel} — ${g.name.split(' ')[0]}`
}
