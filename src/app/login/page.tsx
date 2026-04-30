/**
 * Tela de login.
 * Ponto de entrada para adm e responsáveis.
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

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro('Email ou senha incorretos.')
      setCarregando(false)
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
          <p className="mt-1 text-sm text-[#8C7060]">
            Diário da creche ☀️
          </p>
        </div>

        {/* Formulário */}
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-4 rounded-[20px] bg-[#FFFDF9] p-6 shadow-[0_4px_16px_rgba(180,140,120,0.16)]"
        >
          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSenha(e.target.value)}
            required
          />

          {/* Erro */}
          {erro && (
            <p className="text-center text-xs text-[#E86C88]">{erro}</p>
          )}

          <div className="mt-2">
            <Button type="submit" loading={carregando}>
              Entrar
            </Button>
          </div>
        </form>

      </div>
    </main>
  )
}