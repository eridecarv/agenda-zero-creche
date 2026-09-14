// src/lib/auth-context.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Role } from '@/types'
import { mockAuthProfile } from './auth-context.mock'

export type AuthContext = {
  userId: string
  schoolId: string
  role: Role
}

/**
 * Derives who the caller really is from their session cookie.
 * Session check is real (Supabase Auth); schoolId/role are mocked
 * until the users table is remodeled — see auth-context.mock.ts.
 */
export async function requireAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return {
    userId: user.id,
    schoolId: mockAuthProfile.schoolId,
    role: mockAuthProfile.role,
  }
}
