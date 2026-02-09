// API service functions for RL-SLS

import { apiGet, apiPost } from '../api'
import { handleApiError } from '../errors'
import type {
  ApiResponse,
  PlayerStatus,
  Task,
  TaskSubmission,
  TaskHistory,
  TaskNarrative,
  PlayerNarratives,
  TaskStats,
  HealthCheck
} from '../types'

// Player ID constant (V1 single-player)
const PLAYER_ID = 1920 

export const apiService = {
  // Health Check
  async healthCheck(): Promise<HealthCheck> {
    try {
      const response = await apiGet<ApiResponse<HealthCheck>>('/health')
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Player Status
  async getPlayerStatus(): Promise<PlayerStatus> {
    try {
      const response = await apiGet<ApiResponse<PlayerStatus>>(`/player/status?playerId=${PLAYER_ID}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Current Daily Quest
  async getCurrentQuest(): Promise<Task | null> {
    try {
      const response = await apiGet<ApiResponse<{ task: Task | null }>>(`/tasks/current?playerId=${PLAYER_ID}`)
      return response.data.task
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Submit Task Evidence
  async submitTaskEvidence(taskId: number, evidence: string): Promise<TaskSubmission> {
    try {
      const response = await apiPost<ApiResponse<TaskSubmission>>(
        `/tasks/${taskId}/submit`,
        { playerId: PLAYER_ID, evidence }
      )
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Task History
  async getTaskHistory(): Promise<TaskHistory> {
    try {
      const response = await apiGet<ApiResponse<TaskHistory>>(`/tasks/history?playerId=${PLAYER_ID}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Task Narrative
  async getTaskNarrative(taskLogId: number): Promise<TaskNarrative> {
    try {
      const response = await apiGet<ApiResponse<TaskNarrative>>(`/tasks/${taskLogId}/narrative`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // All Player Narratives
  async getPlayerNarratives(): Promise<PlayerNarratives> {
    try {
      const response = await apiGet<ApiResponse<PlayerNarratives>>(`/player/narratives?playerId=${PLAYER_ID}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  // Task Statistics
  async getTaskStats(): Promise<TaskStats> {
    try {
      const response = await apiGet<ApiResponse<TaskStats>>(`/player/task-stats?playerId=${PLAYER_ID}`)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
}