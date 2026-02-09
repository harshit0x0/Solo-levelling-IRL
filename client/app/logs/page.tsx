'use client'

import { useState, useEffect } from 'react'
import { apiService } from '@/lib'
import { LoadingPage, NoTaskHistory, StatusIndicator, DifficultyBadge } from '@/components'
import type { TaskHistory } from '@/lib'

export default function LogsPage() {
  const [taskHistory, setTaskHistory] = useState<TaskHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTaskHistory = async () => {
      try {
        setLoading(true)
        const history = await apiService.getTaskHistory()
        setTaskHistory(history)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load task history')
      } finally {
        setLoading(false)
      }
    }

    fetchTaskHistory()
  }, [])

  if (loading) {
    return <LoadingPage />
  }

  if (error) {
    return (
      <main className="p-4">
        <div className="border border-gray-600 p-4 mb-4">
          <div className="text-center text-cyan-400 font-bold">SYSTEM LOGS</div>
          <div className="border-b border-gray-600 mt-2"></div>
        </div>
        <div className="border border-red-600 p-4">
          <div className="text-red-400 font-bold text-center mb-2">SYSTEM ERROR</div>
          <div className="border-b border-red-600 mb-4"></div>
          <div className="text-red-300 text-sm text-center">
            {error}
          </div>
        </div>
      </main>
    )
  }

  if (!taskHistory || taskHistory.taskLogs.length === 0) {
    return (
      <main className="p-4">
        <h1 className="text-xl font-bold mb-6">Quest History</h1>
        <NoTaskHistory />
      </main>
    )
  }

  return (
    <main className="p-4">
      <div className="border border-cyan-400/50 p-6 mb-6 relative bg-gradient-to-b from-cyan-900/10 to-transparent"
           style={{boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)'}}>
        <div className="absolute top-2 left-2 w-2 h-2 border-l-2 border-t-2 border-cyan-400/60"></div>
        <div className="absolute top-2 right-2 w-2 h-2 border-r-2 border-t-2 border-cyan-400/60"></div>

        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-300 mb-1"
               style={{textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'}}>
            SYSTEM LOGS
          </div>
          <div className="text-xs text-cyan-400/70 tracking-wider">MISSION HISTORY</div>
        </div>
        <div className="border-b border-cyan-400/30 mt-4"
             style={{boxShadow: '0 1px 3px rgba(0, 255, 255, 0.2)'}}></div>
      </div>
      <div className="space-y-4">
        {/* Task history list */}
        <div className="space-y-4">
          {taskHistory.taskLogs.map((taskLog, index) => (
            <div key={taskLog.id} className={`border p-4 relative ${
              taskLog.status === 'success'
                ? 'border-green-400/50 bg-green-900/5'
                : taskLog.status === 'failed'
                ? 'border-red-400/50 bg-red-900/5'
                : 'border-yellow-400/50 bg-yellow-900/5'
            }`}
                 style={{
                   boxShadow: taskLog.status === 'success'
                     ? '0 0 10px rgba(34, 197, 94, 0.1)'
                     : taskLog.status === 'failed'
                     ? '0 0 10px rgba(239, 68, 68, 0.1)'
                     : '0 0 10px rgba(234, 179, 8, 0.1)'
                 }}>
              <div className="absolute top-2 left-2 w-1 h-1 border-l border-t border-current/60"></div>

              <div className="flex justify-between items-center mb-3">
                <div className="text-xs text-current/60 font-mono">LOG #{String(index + 1).padStart(3, '0')}</div>
                <div className={`text-xs font-bold px-2 py-1 border ${
                  taskLog.status === 'success'
                    ? 'border-green-400 text-green-400'
                    : taskLog.status === 'failed'
                    ? 'border-red-400 text-red-400'
                    : 'border-yellow-400 text-yellow-400'
                }`}
                     style={{
                       textShadow: taskLog.status === 'success'
                         ? '0 0 5px rgba(34, 197, 94, 0.4)'
                         : taskLog.status === 'failed'
                         ? '0 0 5px rgba(239, 68, 68, 0.4)'
                         : '0 0 5px rgba(234, 179, 8, 0.4)'
                     }}>
                  {taskLog.status.toUpperCase()}
                </div>
              </div>

              <div className="text-cyan-400 text-sm mb-3 font-mono"
                   style={{textShadow: '0 0 5px rgba(0, 255, 255, 0.3)'}}>
                {taskLog.task.targetStat.toUpperCase()} | {taskLog.task.difficulty.toUpperCase()} | +{taskLog.task.xpReward} XP
              </div>

              <div className="text-white text-sm mb-3 leading-relaxed">{taskLog.task.description}</div>

              {taskLog.aiVerdict && (
                <div className="border-t border-current/20 pt-3 mt-3">
                  <div className="text-current/60 text-xs mb-2 font-bold tracking-wider">AI JUDGMENT:</div>
                  <div className="text-white text-sm bg-black/30 p-3 border border-current/10 rounded">
                    {taskLog.aiVerdict}
                  </div>
                </div>
              )}

              {taskLog.evidence && (
                <div className="border-t border-current/20 pt-3 mt-3">
                  <div className="text-current/60 text-xs mb-2 font-bold tracking-wider">PLAYER INPUT:</div>
                  <div className="text-gray-300 text-sm bg-black/20 p-3 border border-current/10 rounded font-mono">
                    {taskLog.evidence}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}