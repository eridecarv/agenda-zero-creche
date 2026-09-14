/**
 * Layout raiz da aplicação.
 * Define fontes, metadados e estrutura base de todas as páginas.
 */

import type { Metadata } from 'next'
import { Nunito, DM_Sans } from 'next/font/google'
import './globals.css'

/* ── Fonte de display — headings e títulos ── */
const nunito = Nunito({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
})

/* ── Fonte de corpo — UI e texto corrido ── */
const dmSans = DM_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Agenda Zero',
  description: 'Diário digital para creches',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  )
}
