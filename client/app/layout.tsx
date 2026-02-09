import type { Metadata } from 'next'
import { BottomNavigation } from '@/components'
import './globals.css'

export const metadata: Metadata = {
  title: 'RL-SLS - Real Solo Leveling',
  description: 'A real-life gamification system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="min-h-screen bg-black text-white font-mono text-sm relative">
        {/* Subtle background grid */}
        <div className="fixed inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        <div className="max-w-[430px] mx-auto min-h-screen pb-20">
          {children}
          <BottomNavigation />
        </div>
      </body>
    </html>
  )
}
