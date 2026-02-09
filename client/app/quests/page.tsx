'use client'

import { useState, useEffect } from 'react'
import { apiService } from '@/lib'
import { LoadingPage, NoActiveQuest, DifficultyBadge } from '@/components'
import type { Task } from '@/lib'

export default function QuestsPage() {
  const [currentQuest, setCurrentQuest] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [evidence, setEvidence] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean
    message: string
    narrative?: string
  } | null>(null)

  useEffect(() => {
    const fetchCurrentQuest = async () => {
      try {
        setLoading(true)
        const quest = await apiService.getCurrentQuest()
        setCurrentQuest(quest)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load current quest')
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentQuest()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentQuest || !evidence.trim()) return

    try {
      setSubmitting(true)
      const result = await apiService.submitTaskEvidence(currentQuest.id, evidence.trim())

      setSubmissionResult({
        success: result.taskLog.status === 'success',
        message: result.taskLog.aiVerdict,
        narrative: result.taskLog.narrative.narrative
      })

      setEvidence('')
      // Refetch quest to see if it's completed
      const updatedQuest = await apiService.getCurrentQuest()
      setCurrentQuest(updatedQuest)
    } catch (err) {
      setSubmissionResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to submit quest'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingPage />
  }

  if (error) {
    return (
      <main className="p-4">
        <div className="border border-gray-600 py-2 px-4 mb-4">
          <div className="text-center text-cyan-400 font-bold">QUEST TERMINAL</div>
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

  if (!currentQuest) {
    return (
      <main className="p-4">
        <h1 className="text-xl font-bold mb-6">Daily Quests</h1>
        <NoActiveQuest />
      </main>
    )
  }

  return (
    <main className="p-4 relative">
      {/* Terminal header with glow */}
      <div className="border border-cyan-400/50 p-4 mb-6 relative bg-gradient-to-b from-gray-900/30 to-transparent backdrop-blur-sm"
           style={{boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)'}}>
        <div className="absolute top-2 left-2 w-2 h-2 border-l-2 border-t-2 border-cyan-400/60"></div>
        <div className="absolute top-2 right-2 w-2 h-2 border-r-2 border-t-2 border-cyan-400/60"></div>

        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-300 mb-1"
               style={{textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'}}>
            QUEST TERMINAL
          </div>
          <div className="text-xs text-cyan-400/70 tracking-wider">ACTIVE MISSIONS</div>
        </div>
        {/* <div className="border-b border-cyan-400/30 mt-4"
             style={{boxShadow: '0 1px 3px rgba(0, 255, 255, 0.2)'}}></div> */}
      </div>
      <div className="space-y-4">
        {/* Quest content */}
        <div className="border border-purple-400/50 p-6 mb-6 relative bg-gradient-to-b from-purple-900/10 to-transparent"
             style={{boxShadow: '0 0 15px rgba(147, 51, 234, 0.1)'}}>
          <div className="absolute top-2 right-2 w-2 h-2 border-r-2 border-t-2 border-purple-400/60"></div>

          <div className="font-bold text-purple-300 mb-2"
               style={{textShadow: '0 0 8px rgba(147, 51, 234, 0.5)'}}>
            DAILY QUEST
          </div>
          <div className="border-b border-purple-400/30 mb-4"
               style={{boxShadow: '0 1px 2px rgba(147, 51, 234, 0.2)'}}></div>

          <div className="text-white text-base mb-6 leading-relaxed">{currentQuest.description}</div>

          <div className="grid grid-cols-1 gap-1">
            <div className="flex justify-between items-center p-1 bg-gray-900/40 border border-purple-400/20 rounded">
              <span className="text-purple-400/70 text-sm font-bold">TARGET STAT</span>
              <span className="text-purple-300 font-mono text-sm uppercase"
                    style={{textShadow: '0 0 5px rgba(147, 51, 234, 0.3)'}}>
                {currentQuest.targetStat}
              </span>
            </div>
            <div className="flex justify-between items-center p-1 bg-gray-900/40 border border-yellow-400/20 rounded">
              <span className="text-yellow-400/70 text-sm font-bold">DIFFICULTY</span>
              <span className="text-yellow-300 font-mono text-sm"
                    style={{textShadow: '0 0 5px rgba(234, 179, 8, 0.3)'}}>
                {currentQuest.difficulty.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center p-1 bg-gray-900/40 border border-green-400/20 rounded">
              <span className="text-green-400/70 text-sm font-bold">REWARD</span>
              <span className="text-green-300 font-mono text-sm font-bold"
                    style={{textShadow: '0 0 5px rgba(34, 197, 94, 0.3)'}}>
                +{currentQuest.xpReward} XP
              </span>
            </div>
          </div>
        </div>

        {/* Evidence Submission */}
        <div className="border border-green-400/50 p-6 relative bg-gradient-to-b from-green-900/10 to-transparent"
             style={{boxShadow: '0 0 15px rgba(34, 197, 94, 0.1)'}}>
          <div className="absolute top-2 left-2 w-2 h-2 border-l-2 border-t-2 border-green-400/60"></div>
          <div className="absolute bottom-2 right-2 w-2 h-2 border-r-2 border-b-2 border-green-400/60"></div>

          <div className="text-xl font-bold text-green-300 mb-2"
               style={{textShadow: '0 0 8px rgba(34, 197, 94, 0.5)'}}>
            EVIDENCE SUBMISSION
          </div>
          <div className="border-b border-green-400/30 mb-4"
               style={{boxShadow: '0 1px 2px rgba(34, 197, 94, 0.2)'}}></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="text-green-400/70 text-xs mb-3 font-bold tracking-wider">ENTER EVIDENCE (MAX 1000 CHARS):</div>
              <div className="border-2 border-green-400/40 bg-black/80 p-4 relative"
                   style={{boxShadow: 'inset 0 0 20px rgba(34, 197, 94, 0.1)'}}>
                {/* Blinking cursor effect */}
                <div className="absolute top-4 left-4 text-green-400 text-sm font-mono animate-pulse"></div>
                {/* <div className="text-green-400 text-xs mb-2 ml-6 font-mono">COMMAND PROMPT ACTIVE</div> */}
                <textarea
                  id="evidence"
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  className="w-full bg-transparent text-green-300 placeholder-green-600/50 focus:outline-none resize-none font-mono text-sm ml-6"
                  placeholder="Type your evidence here..."
                  disabled={submitting}
                  required
                  style={{textShadow: '0 0 5px rgba(34, 197, 94, 0.3)'}}
                />
                {/* Terminal-style bottom border */}
                <div className="absolute bottom-2 left-4 right-4 h-px bg-green-400/30"
                     style={{boxShadow: '0 0 5px rgba(34, 197, 94, 0.5)'}}></div>
              </div>
              <div className="text-xs text-green-400/60 mt-2 text-right font-mono">
                {evidence.length}/1000 CHARS
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitting || !evidence.trim()}
                className="flex-1 border-2 border-green-400 text-green-400 py-3 px-4 font-mono text-sm font-bold tracking-wider hover:bg-green-400 hover:text-black disabled:border-gray-600 disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-200"
                style={{
                  textShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                  boxShadow: submitting || !evidence.trim() ? 'none' : '0 0 15px rgba(34, 197, 94, 0.3)',
                  background: submitting || !evidence.trim() ? 'transparent' : 'rgba(34, 197, 94, 0.1)'
                }}
              >
                [ {submitting ? 'PROCESSING...' : 'SUBMIT'} ]
              </button>
              <button
                type="button"
                onClick={() => setEvidence('')}
                disabled={submitting}
                className="flex-1 border-2 border-red-400 text-red-400 py-3 px-4 font-mono text-sm font-bold tracking-wider hover:bg-red-400 hover:text-black disabled:border-gray-600 disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-200"
                style={{
                  textShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                  boxShadow: submitting ? 'none' : '0 0 15px rgba(239, 68, 68, 0.3)',
                  background: submitting ? 'transparent' : 'rgba(239, 68, 68, 0.1)'
                }}
              >
                [ CLEAR ]
              </button>
            </div>
          </form>

          {submissionResult && (
            <div className={`mt-6 border-2 p-6 relative ${
              submissionResult.success
                ? 'border-green-400/50 bg-green-900/10'
                : 'border-red-400/50 bg-red-900/10'
            }`}
                 style={{
                   boxShadow: submissionResult.success
                     ? '0 0 20px rgba(34, 197, 94, 0.2)'
                     : '0 0 20px rgba(239, 68, 68, 0.2)'
                 }}>
              <div className="absolute top-2 left-2 w-2 h-2 border-l-2 border-t-2 border-current"></div>
              <div className="absolute top-2 right-2 w-2 h-2 border-r-2 border-t-2 border-current"></div>

              <div className={`text-xl font-bold mb-3 ${
                submissionResult.success ? 'text-green-300' : 'text-red-300'
              }`}
                   style={{
                     textShadow: submissionResult.success
                       ? '0 0 10px rgba(34, 197, 94, 0.5)'
                       : '0 0 10px rgba(239, 68, 68, 0.5)'
                   }}>
                SYSTEM RESPONSE
              </div>
              <div className="border-b border-current/30 mb-4"
                   style={{boxShadow: '0 1px 3px rgba(255, 255, 255, 0.1)'}}></div>

              <div className={`text-base mb-4 font-bold ${
                submissionResult.success ? 'text-green-400' : 'text-red-400'
              }`}>
                STATUS: {submissionResult.success ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
              </div>

              <div className="text-white text-sm mb-4 leading-relaxed bg-black/30 p-3 border border-current/20 rounded">
                {submissionResult.message}
              </div>

              {submissionResult.narrative && (
                <div className="border-t border-current/30 pt-4">
                  <div className="text-current/70 text-xs mb-2 font-bold tracking-wider">SYSTEM NARRATIVE:</div>
                  <div className="text-white text-sm leading-relaxed italic bg-black/20 p-3 border border-current/10 rounded">
                    "{submissionResult.narrative}"
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}