/**
 * supabase-admin — cliente Supabase com privilégios administrativos.
 *
 * Usa a SERVICE_ROLE_KEY que bypassa o RLS e permite operações
 * administrativas como criar usuários no Auth.
 *
 * IMPORTANTE: nunca importar esse arquivo em componentes client-side.
 * Usar apenas em Server Actions ('use server') ou API Routes.
 */

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}