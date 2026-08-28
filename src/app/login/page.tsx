/**
 * Tela de login.
 * Ponto de entrada para adm e responsáveis.
 *
 * O identificador do usuário no Supabase Auth é um email fictício
 * no formato {telefone}@agendazero.internal — montado aqui,
 * invisível para quem usa.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const cleanPhone = phone.replace(/\D/g, '')
    const email = `${cleanPhone}@agendazero.internal`

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Telefone ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #FFF0E8 0%, #FAF7F2 100%)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <h1
            className="text-3xl font-extrabold text-[#3A2E24]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Agenda Zero
          </h1>
          <p className="mt-1 text-sm text-[#8C7060]">Diário da Creche ☀️</p>
        </div>

        {/* Formulário */}
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-4 rounded-[20px] bg-[#FFFDF9] p-6 shadow-[0_4px_16px_rgba(180,140,120,0.16)]"
        >
          <Input
            label="Telefone com DDD"
            type="tel"
            placeholder="11999990000"
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
            required
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-center text-xs text-[#E86C88]">{error}</p>}

          <div className="mt-2">
            <Button type="submit" loading={loading}>
              Entrar
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
