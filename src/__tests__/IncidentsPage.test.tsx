import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import IncidentsPage from '@/app/adm/incidents/page'

vi.mock('@/hooks/useSchool', () => ({
  useSchool: () => ({
    schoolId: 'escola-1',
    userId: 'user-1',
    role: 'admin',
    loading: false,
  })
}))

vi.mock('@/lib/supabase', () => {
  const incidents = [
    {
      id: '1',
      title: 'Fall in the yard',
      description: 'The child fell...',
      status: 'draft',
      created_at: new Date().toISOString(),
      child_id: '123',
      children: { name: 'Maria Alice' },
      incident_attachments: [],
    }
  ]

  const children = [
    { id: '123', name: 'Maria Alice' }
  ]

  return {
    createClient: () => ({
      from: (table: string) => {
        const data = table === 'incidents' ? incidents : children
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          gte: () => chain,
          lt: () => chain,
          order: () => ({ data }),
          single: () => ({ data: null }),
          in: () => chain,
        }
        return chain
      },
    }),
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn() }),
}))

describe('IncidentsPage', () => {
  it('renders the page title', async () => {
    render(<IncidentsPage />)
    await waitFor(() => {
      expect(screen.getByText('Ocorrências')).toBeInTheDocument()
    })
  })

  it('renders an incident from the list', async () => {
    render(<IncidentsPage />)
    await waitFor(() => {
      expect(screen.getByText('Fall in the yard')).toBeInTheDocument()
    })
  })
})