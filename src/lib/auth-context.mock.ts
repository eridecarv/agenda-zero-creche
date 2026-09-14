// src/lib/auth-context.mock.ts
import type { Role } from '@/types'

/**
 * Mock profile for schoolId/role — placeholder until the users table
 * is remodeled (current modeling is being redone from scratch).
 * Swap this file's contents for a real Supabase lookup once that's done;
 * requireAuthContext()'s signature and every caller stay unchanged.
 */
// TODO: swap for a real Supabase lookup once the users table is remodeled
export const mockAuthProfile: { schoolId: string; role: Role } = {
  schoolId: 'mock-school-id',
  role: 'admin',
}
