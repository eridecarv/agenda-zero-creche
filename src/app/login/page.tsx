/**
 * Login screen.
 * Entry point for admin and guardians.
 *
 * The user identifier in Supabase Auth is a fictitious email
 * in the format {phone}@agendazero.internal — assembled here,
 * invisible to the end user.
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
      style={{ background: 'linear-gradient(160deg, #FFF0E8 0%, var(--color-bg) 100%)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <h1
            className="text-3xl font-extrabold text-fg1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Agenda Zero
          </h1>
          <p className="mt-1 text-sm text-fg2">Diário da Creche ☀️</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-4 rounded-lg bg-surface p-6 shadow-md"
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

          {error && <p className="text-center text-xs text-danger">{error}</p>}

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
