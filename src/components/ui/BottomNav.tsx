/**
 * BottomNav — navegação inferior do app.
 * Presente em todas as telas do responsável e da adm.
 *
 * Cada perfil tem seus próprios itens de navegação —
 * passados via prop para manter o componente reutilizável.
 */

type NavItem = {
  label: string
  icon: string
  href: string
  ativo?: boolean
}

type BottomNavProps = {
  itens: NavItem[]
}

export function BottomNav({ itens }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFFDF9]"
      style={{ boxShadow: '0 -4px 16px rgba(180, 140, 120, 0.12)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {itens.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition-all duration-200 ${
              item.ativo ? 'text-[#FF8C66]' : 'text-[#8C7060]'
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>

            <span
              className={`text-[10px] ${
                item.ativo ? 'font-semibold' : 'font-medium'
              }`}
            >
              {item.label}
            </span>

            {item.ativo && (
              <span className="h-1 w-1 rounded-full bg-[#FF8C66]" />
            )}
          </a>
        ))}
      </div>
    </nav>
  )
}