// src/app/responsavel/crianca/[id]/diario/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'

type DiaResumido = {
  data: string         // 'YYYY-MM-DD'
  humor: string | null
  presente: boolean | null
  encerrado: boolean   // tem saida preenchida
}

const HUMOR_EMOJI: Record<string, string> = {
  contente:  '😄',
  tranquilo: '😌',
  agitado:   '😤',
  choroso:   '😢',
}

function formatarData(dataStr: string): string {
  const [ano, mes, dia] = dataStr.split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function DiarioHistoricoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [nomeCrianca, setNomeCrianca] = useState('')
  const [dias, setDias] = useState<DiaResumido[]>([])
  const [loading, setLoading] = useState(true)

  // Data de hoje para excluir do histórico (hoje já aparece na home)
  const hoje = new Date()
    .toLocaleDateString('pt-BR', {
      timeZone: 'America/Recife',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .split('/')
    .reverse()
    .join('-')

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: c } = await supabase
        .from('criancas').select('nome').eq('id', id).single()
      if (c) setNomeCrianca(c.nome.split(' ')[0])

      // Busca registros diários excluindo hoje, ordenado do mais recente
      const { data: rds } = await supabase
        .from('registros_diarios')
        .select('id, data, humor')
        .eq('crianca_id', id)
        .neq('data', hoje)
        .order('data', { ascending: false })
        .limit(60) // últimos ~2 meses

      if (!rds || rds.length === 0) { setLoading(false); return }

      // Busca presença e saída de todos esses registros
      const rdIds = rds.map((r: any) => r.id)
      const { data: presencas } = await supabase
        .from('registros_presenca')
        .select('registro_diario_id, presente, saida')
        .in('registro_diario_id', rdIds)

      const presencaMap: Record<string, { presente: boolean | null; saida: string | null }> = {}
      presencas?.forEach((p: any) => {
        presencaMap[p.registro_diario_id] = { presente: p.presente, saida: p.saida }
      })

      setDias(
        rds.map((rd: any) => ({
          data: rd.data,
          humor: rd.humor,
          presente: presencaMap[rd.id]?.presente ?? null,
          encerrado: !!presencaMap[rd.id]?.saida,
        }))
      )

      setLoading(false)
    }
    carregar()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <span style={{ color: '#C4A882' }} className="text-sm">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-8">
      {/* Header */}
      <div className="bg-[#FFFDF9] px-5 pt-12 pb-6 shadow-[0_2px_8px_rgba(180,140,120,0.06)]">
        <p style={{ color: '#C4A882' }} className="text-xs mb-1">Histórico</p>
        <h1 style={{ color: '#A08060' }} className="font-display text-2xl font-bold">
          Dias anteriores
        </h1>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto flex flex-col gap-3">
        {dias.length === 0 ? (
          <Card padding="lg">
            <div className="flex flex-col items-center text-center py-8 gap-3">
              <div className="w-16 h-16 rounded-full bg-[#FEF0E8] flex items-center justify-center text-3xl">📖</div>
              <p style={{ color: '#A08060' }} className="text-base font-semibold">
                Ainda sem histórico
              </p>
              <p style={{ color: '#C4A882' }} className="text-sm leading-relaxed">
                Os dias registrados vão aparecer aqui.
              </p>
            </div>
          </Card>
        ) : (
          dias.map(dia => (
            <button
              key={dia.data}
              onClick={() => router.push(`/responsavel/crianca/${id}/diario/${dia.data}`)}
              className="w-full text-left"
            >
              <Card padding="lg" className="hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <p style={{ color: '#A08060' }} className="text-sm font-semibold capitalize">
                      {formatarData(dia.data)}
                    </p>
                    <div className="flex items-center gap-2">
                      {dia.presente === false && (
                        <span
                          style={{ backgroundColor: '#FDE8EC', color: '#A03050' }}
                          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                        >
                          Faltou
                        </span>
                      )}
                      {dia.presente === true && dia.encerrado && (
                        <span
                          style={{ backgroundColor: '#EAF3DE', color: '#4A7A3A' }}
                          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                        >
                          Dia completo
                        </span>
                      )}
                      {dia.presente === true && !dia.encerrado && (
                        <span
                          style={{ backgroundColor: '#FEF6E4', color: '#9A6F2A' }}
                          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                        >
                          Parcial
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {dia.humor && (
                      <span className="text-2xl">{HUMOR_EMOJI[dia.humor] ?? '😊'}</span>
                    )}
                    <span style={{ color: '#C4A882' }} className="text-sm">›</span>
                  </div>
                </div>
              </Card>
            </button>
          ))
        )}
      </div>
    </div>
  )
}