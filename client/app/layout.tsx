import type { Metadata } from 'next'
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
      <body className="min-h-screen bg-black text-white">
        <div className="max-w-[430px] mx-auto min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
