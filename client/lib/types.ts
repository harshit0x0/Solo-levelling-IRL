// TypeScript interfaces for RL-SLS API

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface Player {
  id: number
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS'
  level: number
  totalXp: number
}

export interface PlayerStats {
  physical: number
  intelligence: number
  discipline: number
  charisma: number
  confidence: number
  creativity: number
}

export interface PlayerStatus {
  player: Player
  stats: PlayerStats
}

export interface TaskLog {
  id: number
  status: 'pending' | 'success' | 'failed' | 'missed'
  evidence: string | null
  aiVerdict: string | null
}

export interface Task {
  id: number
  type: 'daily'
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  targetStat: string
  xpReward: number
  deadline: string
  taskLogs: TaskLog[]
}

export interface TaskSubmission {
  taskLog: {
    id: number
    status: 'success' | 'failed'
    evidence: string
    aiVerdict: string
    task: Task
    narrative: {
      id: number
      narrative: string
      createdAt: string
    }
  }
}

export interface TaskHistory {
  taskLogs: Array<{
    id: number
    status: 'pending' | 'success' | 'failed' | 'missed'
    evidence: string | null
    aiVerdict: string | null
    task: {
      description: string
      difficulty: string
      targetStat: string
      xpReward: number
      deadline: string
    }
  }>
}

export interface TaskNarrative {
  id: number
  taskLogId: number
  narrative: string
  createdAt: string
}

export interface PlayerNarratives {
  narratives: Array<{
    id: number
    narrative: string
    createdAt: string
    taskLog: {
      status: 'success' | 'failed'
      aiVerdict: string
      task: {
        description: string
        difficulty: string
        targetStat: string
      }
    }
  }>
}

export interface TaskStats {
  overall: {
    total: number
    completed: number
    failed: number
    missed: number
    successRate: number
  }
  recent: {
    total: number
    completed: number
    failed: number
    missed: number
    successRate: number
  }
}

export interface HealthCheck {
  status: 'ok'
  database: 'connected'
}