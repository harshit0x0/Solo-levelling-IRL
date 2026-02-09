'use client'

// Bottom navigation component

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigationItems = [
  {
    name: 'STATUS',
    href: '/status',
    label: 'STATUS'
  },
  {
    name: 'QUESTS',
    href: '/quests',
    label: 'QUESTS'
  },
  {
    name: 'LOGS',
    href: '/logs',
    label: 'LOGS'
  }
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-cyan-400/30 px-2 py-3"
         style={{boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)'}}>
      <div className="flex justify-around items-center max-w-[430px] mx-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-center px-4 py-3 border-2 transition-all duration-200 font-mono text-sm min-h-[44px] ${
                isActive
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-900/20'
                  : 'border-gray-600/50 text-gray-400 hover:border-cyan-400/50 hover:text-cyan-300'
              }`}
              style={{
                textShadow: isActive ? '0 0 8px rgba(0, 255, 255, 0.6)' : 'none',
                boxShadow: isActive ? '0 0 15px rgba(0, 255, 255, 0.3)' : 'none'
              }}
            >
              [{item.label}]
            </Link>
          )
        })}
      </div>
    </nav>
  )
}