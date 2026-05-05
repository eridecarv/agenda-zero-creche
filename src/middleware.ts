/**
 * Middleware de autenticação e roteamento.
 *
 * Responsabilidades:
 * - Protege todas as rotas — redireciona para /login se não houver sessão.
 * - Redireciona / para /adm quando o usuário está logado.
 *   (no futuro, esse redirecionamento pode verificar o role e
 *    enviar professor para /professor, responsavel para /responsavel, etc.)
 *
 * Rotas públicas: /login, /convite/[token]
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Sem sessão — redireciona para /login (exceto rotas públicas)
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/convite')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

// Logado na raiz — redireciona conforme o role
if (user && request.nextUrl.pathname === '/') {
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  const url = request.nextUrl.clone()
  url.pathname = usuario?.role === 'responsavel' ? '/responsavel' : '/adm'
  return NextResponse.redirect(url)
}
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 