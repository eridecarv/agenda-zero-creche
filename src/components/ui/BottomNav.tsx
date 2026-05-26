/**
 * BottomNav — navegação inferior do app.
 * Presente em todas as telas do responsável e da adm.
 *
 * Pill flutuante com backdrop-blur. Item ativo recebe fundo
 * preenchido em vez de apenas mudar de cor.
 *
 * A interface de props não mudou: qualquer uso existente
 * continua funcionando sem alteração.
 */

'use client'

import Link from 'next/link'

type NavItem = {
  label: string
  icon: string
  href: string
  active?: boolean
}

type BottomNavProps = {
  items: NavItem[]
}

export function BottomNav({ items }: BottomNavProps) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 24px)',
        maxWidth: 406,
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: 28,
          padding: '8px',
          gap: 4,
          backgroundColor: 'rgba(255, 253, 249, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 8px 28px rgba(180,140,120,0.14), 0 2px 8px rgba(180,140,120,0.08)',
        }}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minHeight: 60,
              borderRadius: 20,
              textDecoration: 'none',
              transition: 'all 0.18s ease',
              color: item.active ? '#3A2E24' : '#9A928A',
              backgroundColor: item.active ? '#FAF7F2' : 'transparent',
              boxShadow: item.active
                ? '0 4px 12px rgba(180,140,120,0.10), inset 0 1px 0 rgba(255,255,255,0.7)'
                : undefined,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>

            <span style={{
              fontSize: 11,
              lineHeight: 1,
              fontWeight: item.active ? 700 : 500,
              fontFamily: 'var(--font-body)',
            }}>
              {item.label}
            </span>

            {item.active && (
              <span style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: '#FF8C66',
              }} />
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}