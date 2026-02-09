'use client'

import { useState, useEffect } from 'react'
import { apiService } from '@/lib'
import { LoadingPage } from '@/components'
import type { PlayerStatus } from '@/lib'

// ASCII progress bar renderer
function renderAsciiBar(value: number, max: number): string {
  const percentage = Math.round((Math.abs(value) / max) * 10)
  const filled = '█'.repeat(percentage)
  const empty = '░'.repeat(10 - percentage)
  return `[${filled}${empty}]`
}

export default function StatusPage() {
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlayerStatus = async () => {
      try {
        setLoading(true)
        const status = await apiService.getPlayerStatus()
        setPlayerStatus(status)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load player status')
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerStatus()
  }, [])

  if (loading) {
    return <LoadingPage />
  }

  if (error) {
    return (
      <main className="p-4">
        <div className="border border-gray-600 p-4">
          <div className="text-center mb-4 text-cyan-400 font-bold">PLAYER STATUS</div>
          <div className="border-b border-gray-600 mb-4"></div>
          <div className="border border-red-600 p-4">
            <div className="text-red-400 font-bold text-center mb-2">SYSTEM ERROR</div>
            <div className="border-b border-red-600 mb-4"></div>
            <div className="text-red-300 text-sm text-center">
              {error}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="p-4 relative">
      {/* Status container with glow */}
      <div className="border border-cyan-400/50 p-6 relative bg-gradient-to-b from-gray-900/20 to-transparent backdrop-blur-sm"
           style={{boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)'}}>
        {/* Corner decorations */}
        <div className="absolute top-2 left-2 w-2 h-2 border-l-2 border-t-2 border-cyan-400/60"></div>
        <div className="absolute top-2 right-2 w-2 h-2 border-r-2 border-t-2 border-cyan-400/60"></div>
        <div className="absolute bottom-2 left-2 w-2 h-2 border-l-2 border-b-2 border-cyan-400/60"></div>
        <div className="absolute bottom-2 right-2 w-2 h-2 border-r-2 border-b-2 border-cyan-400/60"></div>

        <div className="text-center mb-6">
          <div className="text-xl font-bold text-cyan-300 mb-2"
               style={{textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'}}>
            PLAYER STATUS
          </div>
          {/* <div className="text-xs text-cyan-400/70 tracking-wider">SYSTEM ANALYSIS</div> */}
        </div>
        <div className="border-b border-cyan-400/30 mb-6"
             style={{boxShadow: '0 1px 3px rgba(0, 255, 255, 0.2)'}}></div>

        {playerStatus && (
          <div className="space-y-2">
            {/* Rank Display */}
            <div className="text-center py-2">
              <div className="text-cyan-400/70 text-xs font-bold tracking-widest mb-2">CURRENT RANK</div>
              <div className="text-4xl font-black text-purple-300 mb-1"
                   style={{textShadow: '0 0 20px rgba(147, 51, 234, 0.6)'}}>
                {playerStatus.player.rank}
              </div>
              {/* <div className="text-xs text-purple-400/60">SYSTEM AUTHORIZATION</div> */}
            </div>

            {/* Level and XP */}
            <div className="bg-gray-900/30 px-4 py-2 border border-cyan-400/20 rounded"
                 style={{boxShadow: 'inset 0 0 10px rgba(0, 255, 255, 0.1)'}}>
              <div className="text-cyan-400/70 text-xs font-bold mb-2 text-center">LEVEL PROGRESS</div>
              <div className="text-center mb-2">
                <span className="text-2xl font-bold text-cyan-300"
                      style={{textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'}}>
                  LV {playerStatus.player.level}
                </span>
              </div>
              <div className="text-center mb-3">
                <span className="text-lg font-mono text-green-400"
                      style={{textShadow: '0 0 5px rgba(34, 197, 94, 0.5)'}}>
                  {renderAsciiBar(playerStatus.player.totalXp % 100, 100)}
                </span>
              </div>
              <div className="text-center text-sm text-cyan-300">
                {playerStatus.player.totalXp % 100} / 100 XP
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-900/20 p-4 border border-purple-400/20 rounded"
                 style={{boxShadow: 'inset 0 0 10px rgba(147, 51, 234, 0.1)'}}>
              <div className="text-purple-400/70 text-xs font-bold mb-4 text-center">CORE STATS</div>
              <div className="space-y-3">
                {Object.entries(playerStatus.stats).map(([statName, value]) => (
                  <div key={statName} className="flex justify-between items-center">
                    <div className="text-cyan-400 font-bold text-sm w-24">
                      {statName.toUpperCase()}
                    </div>
                    <div className="flex-1 mx-4">
                      <span className="text-green-400 font-mono text-sm"
                            style={{textShadow: '0 0 5px rgba(34, 197, 94, 0.3)'}}>
                        {renderAsciiBar(value, 100)}
                      </span>
                    </div>
                    <div className="text-cyan-300 font-mono text-sm w-8 text-right">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}