import models from '../models';
import { Task, Difficulty, StatType, TaskType } from '../models/Task';
import { TaskLog, TaskStatus } from '../models/TaskLog';
import { Op } from 'sequelize';
import { addXp } from './xp.service';
import { applyStatChange } from './stat.service';
import { judgeTask } from '../ai/judge';
import { JudgeResponse } from '../ai/validation';
import { generateQuestSuggestion, QuestGeneratorParams } from '../ai/quest-generator';
import { generateNarrative } from '../ai/narrator';
import { Rank } from '../models/Player';

const { Task: TaskModel, TaskLog: TaskLogModel, Narrative: NarrativeModel } = models;

/**
 * AI result interface for task resolution
 */
export interface TaskResolution {
  success: boolean;
  xpAwarded: number;
  statChanges: Partial<Record<StatType, number>>;
  feedback?: string;
}

/**
 * Task templates for different types and difficulties
 */
const TASK_TEMPLATES = {
  daily: {
    easy: {
      xpRange: [20, 30] as [number, number],
      statBonus: 0.5,
    },
    medium: {
      xpRange: [31, 35] as [number, number],
      statBonus: 1,
    },
    hard: {
      xpRange: [36, 40] as [number, number],
      statBonus: 1.5,
    },
    extreme: {
      xpRange: [50, 60] as [number, number],
      statBonus: 2,
    },
  },
};

/**
 * Daily quest descriptions by stat type
 */
const DAILY_QUEST_DESCRIPTIONS: Record<StatType, string[]> = {
  physical: [
    'Complete a 30-minute workout or exercise routine',
    'Take a 45-minute walk or run',
    'Do 50 push-ups or bodyweight exercises',
  ],
  intelligence: [
    'Read for 45 minutes on a challenging topic',
    'Learn something new - tutorial, course, or book chapter',
    'Solve 5-10 logic puzzles or brain teasers',
  ],
  discipline: [
    'Maintain a consistent routine for 2 hours',
    'Complete all planned tasks for the day',
    'Follow through on a commitment you made',
  ],
  charisma: [
    'Have a meaningful conversation with someone new',
    'Practice public speaking or presentation skills',
    'Help someone with a problem or give advice',
  ],
  confidence: [
    'Try something outside your comfort zone',
    'Speak up in a meeting or group setting',
    'Take initiative on a task without being asked',
  ],
  creativity: [
    'Create something new - art, music, writing, or code',
    'Brainstorm solutions to a problem creatively',
    'Learn a new creative skill or technique',
  ],
};

/**
 * Finds the weakest stat for a player
 */
async function getWeakestStat(playerId: number): Promise<StatType> {
  const stats = await models.Stats.findOne({
    where: { playerId },
  });

  if (!stats) {
    throw new Error(`Stats not found for player ${playerId}`);
  }

  const statValues = {
    physical: stats.physical,
    intelligence: stats.intelligence,
    discipline: stats.discipline,
    charisma: stats.charisma,
    confidence: stats.confidence,
    creativity: stats.creativity,
  };

  // Find the stat with the lowest value
  let weakestStat: StatType = 'physical';
  let lowestValue = statValues.physical;

  for (const [stat, value] of Object.entries(statValues) as [StatType, number][]) {
    if (value < lowestValue) {
      lowestValue = value;
      weakestStat = stat;
    }
  }

  return weakestStat;
}

/**
 * Generates a random description for a given stat type
 */
function getRandomDescription(statType: StatType): string {
  const descriptions = DAILY_QUEST_DESCRIPTIONS[statType];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

/**
 * Calculates XP reward for a task
 */
function calculateXpReward(difficulty: Difficulty, baseXp: number): number {
  const multipliers = {
    easy: 1.0,
    medium: 1.5,
    hard: 2.5,
    extreme: 4.0,
  };
  return Math.round(baseXp * multipliers[difficulty]);
}

/**
 * Gets recent task history for a player (last 21 days)
 */
async function getRecentTaskHistory(playerId: number, days: number = 21): Promise<TaskLog[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const taskLogs = await TaskLogModel.findAll({
    where: {
      playerId,
      createdAt: {
        [Op.gte]: cutoffDate,
      },
    },
    include: [
      {
        model: TaskModel,
        as: 'task',
        required: true,
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return taskLogs;
}

/**
 * Calculates difficulty scaling based on recent failures and rank
 */
function calculateDifficultyScaling(recentFailures: number, rank: Rank): Difficulty {
  // Base difficulty starts at easy
  let difficulty: Difficulty = 'easy';

  // Adjust based on recent failures
  // More failures = easier tasks to build confidence
  if (recentFailures === 0) {
    // No failures, can increase difficulty
    if (rank === 'E' || rank === 'D') {
      difficulty = 'easy';
    } else if (rank === 'C' || rank === 'B') {
      difficulty = 'medium';
    } else if (rank === 'A' || rank === 'S') {
      difficulty = 'hard';
    } else {
      difficulty = 'extreme';
    }
  } else if (recentFailures <= 2) {
    // Few failures, maintain current level
    if (rank === 'E' || rank === 'D') {
      difficulty = 'easy';
    } else {
      difficulty = 'medium';
    }
  } else if (recentFailures <= 5) {
    // Moderate failures, reduce difficulty
    difficulty = 'easy';
  } else {
    // Many failures, keep it easy
    difficulty = 'easy';
  }

  return difficulty;
}

/**
 * Counts recent failures from task history
 */
function countRecentFailures(taskLogs: TaskLog[]): number {
  return taskLogs.filter((log) => log.status === 'failed' || log.status === 'missed').length;
}

/**
 * Generates a daily task for a player using deterministic-first approach with AI enhancement
 * Flow: Identify weakest stat → Check recent history → Calculate difficulty → Request AI suggestion → Persist task
 *
 * @param playerId - Player ID
 * @returns Created Task instance
 */
export async function generateDailyTask(playerId: number): Promise<Task> {
  // Step 1: Identify weakest stat (mandatory targeting)
  const weakestStat = await getWeakestStat(playerId);

  // Step 2: Get player info
  const player = await models.Player.findByPk(playerId);
  if (!player) {
    throw new Error(`Player not found: ${playerId}`);
  }

  const playerStats = await models.Stats.findOne({
    where: { playerId },
  });
  if (!playerStats) {
    throw new Error(`Stats not found for player ${playerId}`);
  }

  // Step 3: Check recent task history (last 21 days)
  const recentTaskLogs = await getRecentTaskHistory(playerId, 21);
  const recentFailures = countRecentFailures(recentTaskLogs);

  // Step 4: Calculate difficulty scaling based on failures and rank
  const desiredDifficulty = calculateDifficultyScaling(recentFailures, player.rank);

  // Step 5: Request AI suggestion (deterministic-first: we specify stat and difficulty)
  let questSuggestion;
  try {
    const questParams: QuestGeneratorParams = {
      playerStats,
      recentFailures,
      rank: player.rank,
      weakestStat,
      desiredDifficulty,
    };
    questSuggestion = await generateQuestSuggestion(questParams);
  } catch (error) {
    console.error('Quest Generator AI failed, using fallback:', error);
    // Fallback: use deterministic description
    questSuggestion = {
      type: 'daily' as TaskType,
      description: getRandomDescription(weakestStat),
      difficulty: desiredDifficulty,
      targetStat: weakestStat,
    };
  }

  // Ensure weakness targeting is mandatory (override AI if needed)
  const finalTargetStat = questSuggestion.targetStat === weakestStat ? weakestStat : weakestStat;
  const finalDifficulty = questSuggestion.difficulty;

  // Step 6: Calculate XP reward
  const template = TASK_TEMPLATES.daily[finalDifficulty] || TASK_TEMPLATES.daily.easy;
  const baseXp = Math.floor(Math.random() * (template.xpRange[1] - template.xpRange[0] + 1)) + template.xpRange[0];
  const xpReward = calculateXpReward(finalDifficulty, baseXp);

  // Step 7: Set deadline to end of today
  const deadline = new Date();
  deadline.setHours(23, 59, 59, 999);

  // Step 8: Persist task
  const task = await TaskModel.create({
    type: questSuggestion.type,
    difficulty: finalDifficulty,
    description: questSuggestion.description,
    targetStat: finalTargetStat,
    xpReward,
    deadline,
  });

  // Create pending task log
  await TaskLogModel.create({
    taskId: task.id,
    playerId,
    status: 'pending',
  });

  return task;
}

/**
 * Submits evidence for a task and creates a TaskLog entry
 *
 * @param taskId - Task ID
 * @param playerId - Player ID
 * @param evidence - Evidence text from player
 * @returns Created TaskLog instance
 */
export async function submitTask(
  taskId: number,
  playerId: number,
  evidence: string
): Promise<TaskLog> {
  // Verify task exists and belongs to player
  const task = await TaskModel.findByPk(taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  // Check if task is still active (not past deadline)
  if (new Date() > task.deadline) {
    throw new Error('Task deadline has passed');
  }

  // Ensure there isn't already a pending log for this task/player
  const existingTaskLog = await TaskLogModel.findOne({
    where: {
      taskId,
      playerId,
      status: 'pending',
    },
  });

  if (existingTaskLog) {
    if (!existingTaskLog.evidence) {
      await existingTaskLog.update({ evidence });
    }
    return existingTaskLog;
  }

  const taskLog = await TaskLogModel.create({
    taskId,
    playerId,
    status: 'pending',
    evidence,
  });

  return taskLog;
}

/**
 * Converts AI Judge response to TaskResolution format
 */
function convertJudgeResponseToResolution(judgeResponse: JudgeResponse): TaskResolution {
  return {
    success: judgeResponse.verdict === 'success',
    xpAwarded: judgeResponse.xp,
    statChanges: judgeResponse.statChanges as Partial<Record<StatType, number>>,
    feedback: judgeResponse.comment,
  };
}

/**
 * Judges a task using AI and resolves it automatically
 * This is the main entry point for task evaluation after submission.
 * Flow: Task Service → AI Judge → Validation → Stat/XP Services → DB
 *
 * @param taskLogId - TaskLog ID to judge and resolve
 * @returns Updated TaskLog instance
 */
export async function judgeAndResolveTask(taskLogId: number): Promise<TaskLog> {
  // Fetch task log with task and player info
  const taskLog = await TaskLogModel.findByPk(taskLogId, {
    include: [
      {
        model: TaskModel,
        as: 'task',
        required: true,
      },
    ],
  });

  if (!taskLog) {
    throw new Error(`TaskLog not found: ${taskLogId}`);
  }

  // Type assertion needed because Sequelize include doesn't update TypeScript types
  const task = (taskLog as any).task as Task;
  if (!task) {
    throw new Error(`Task not found for TaskLog ${taskLogId}`);
  }

  if (taskLog.status !== 'pending') {
    throw new Error(`TaskLog ${taskLogId} is not pending (current status: ${taskLog.status})`);
  }

  if (!taskLog.evidence) {
    throw new Error(`TaskLog ${taskLogId} has no evidence to judge`);
  }

  // Fetch player stats
  const playerStats = await models.Stats.findOne({
    where: { playerId: taskLog.playerId },
  });

  if (!playerStats) {
    throw new Error(`Stats not found for player ${taskLog.playerId}`);
  }

  // Call AI Judge (validation happens inside judgeTask)
  // Flow: Task Service → AI Judge → Validation → Stat/XP Services → DB
  const judgeResponse: JudgeResponse = await judgeTask({
    task,
    playerStats,
    evidence: taskLog.evidence,
  });

  // Convert JudgeResponse to TaskResolution
  const resolution = convertJudgeResponseToResolution(judgeResponse);

  // Generate narrative using Narrator AI (no stat/XP impact)
  let narrativeText: string | null = null;
  try {
    narrativeText = await generateNarrative({
      task,
      playerStats,
      verdict: judgeResponse.verdict,
      context: `Task ${judgeResponse.verdict === 'success' ? 'completed' : 'failed'}.`,
    });
  } catch (error) {
    console.error('Narrator AI failed, skipping narrative:', error);
    // Continue without narrative - it's optional
  }

  // Resolve task (applies XP and stat changes via services, not directly)
  return await resolveTask(taskLog, resolution, narrativeText);
}

/**
 * Resolves a task based on AI judgment and applies rewards/penalties
 *
 * @param taskLog - TaskLog instance
 * @param resolution - AI resolution result
 * @param narrative - Optional narrative text from Narrator AI
 * @returns Updated TaskLog instance
 */
export async function resolveTask(
  taskLog: TaskLog,
  resolution: TaskResolution,
  narrative?: string | null
): Promise<TaskLog> {
  const { success, xpAwarded, statChanges, feedback } = resolution;

  // Update task log status
  const newStatus: TaskStatus = success ? 'completed' : 'failed';
  await taskLog.update({
    status: newStatus,
    aiVerdict: feedback || (success ? 'Task completed successfully' : 'Task requirements not met'),
  });

  // Store narrative if provided (no stat/XP impact)
  if (narrative) {
    await NarrativeModel.create({
      taskLogId: taskLog.id,
      narrative,
    });
  }

  if (success) {
    // Apply rewards via XP service (not directly mutating DB)
    await addXp(taskLog.playerId, xpAwarded);

    // Apply stat changes via stat service (not directly mutating DB)
    if (statChanges && Object.keys(statChanges).length > 0) {
      await applyStatChange(taskLog.playerId, statChanges);
    }
  }

  return taskLog.reload({
    include: [
      {
        model: TaskModel,
        as: 'task',
      },
      {
        model: NarrativeModel,
        as: 'narrative',
      },
    ],
  });
}

/**
 * Gets active tasks for a player (not completed, failed, or missed)
 *
 * @param playerId - Player ID
 * @returns Array of active Task instances
 */
export async function getActiveTasks(playerId: number): Promise<Task[]> {
  const tasks = await TaskModel.findAll({
    where: {
      deadline: {
        [Op.gt]: new Date(),
      },
    },
    include: [
      {
        model: TaskLogModel,
        as: 'taskLogs',
        where: {
          playerId,
          status: 'pending',
        },
        required: true,
      },
    ],
  });

  return tasks;
}

/**
 * Checks for missed tasks and marks them as missed
 * Called by daily cron job
 *
 * @param playerId - Player ID
 * @returns Array of missed TaskLog instances
 */
export async function checkAndMarkMissedTasks(playerId: number): Promise<TaskLog[]> {
  const now = new Date();

  // Find pending tasks that are past deadline
  const missedTaskLogs = await TaskLogModel.findAll({
    where: {
      playerId,
      status: 'pending',
    },
    include: [
      {
        model: TaskModel,
        as: 'task',
        where: {
          deadline: {
            [Op.lt]: now,
          },
        },
        required: true,
      },
    ],
  });

  if (missedTaskLogs.length === 0) {
    return [];
  }

  const taskLogIds = missedTaskLogs.map((taskLog) => taskLog.id);

  // Bulk mark as missed to avoid N+1 updates
  await TaskLogModel.update(
    { status: 'missed' },
    {
      where: {
        id: taskLogIds,
      },
    }
  );

  // Reload the updated task logs to return fresh instances
  const missedTasks = await TaskLogModel.findAll({
    where: {
      id: taskLogIds,
    },
    include: [
      {
        model: TaskModel,
        as: 'task',
      },
    ],
  });

  return missedTasks;
}


/**
 * Gets task history (task logs) for a player
 *
 * @param playerId - Player ID
 * @returns Array of TaskLog instances with associated Task
 */
export async function getTaskHistory(playerId: number): Promise<TaskLog[]> {
  const taskLogs = await TaskLogModel.findAll({
    where: {
      playerId,
    },
    include: [
      {
        model: TaskModel,
        as: 'task',
        required: true,
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return taskLogs;
}

/**
 * Gets narrative for a specific task log
 *
 * @param taskLogId - TaskLog ID
 * @returns Narrative instance or null if not found
 */
export async function getTaskNarrative(taskLogId: number) {
  const narrative = await NarrativeModel.findOne({
    where: {
      taskLogId,
    },
  });

  return narrative;
}

/**
 * Gets all narratives for a player's completed tasks
 *
 * @param playerId - Player ID
 * @returns Array of narratives with associated task logs
 */
export async function getPlayerNarratives(playerId: number) {
  const narratives = await NarrativeModel.findAll({
    include: [
      {
        model: TaskLogModel,
        as: 'taskLog',
        where: {
          playerId,
        },
        include: [
          {
            model: TaskModel,
            as: 'task',
            required: true,
          },
        ],
        required: true,
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return narratives;
}

/**
 * Gets task statistics for a player
 *
 * @param playerId - Player ID
 * @returns Task statistics including success rate, recent failures, etc.
 */
export async function getPlayerTaskStats(playerId: number) {
  const now = new Date();
  const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

  // Get all task logs for the player
  const allTaskLogs = await TaskLogModel.findAll({
    where: {
      playerId,
    },
  });

  // Get recent task logs (last 21 days)
  const recentTaskLogs = await TaskLogModel.findAll({
    where: {
      playerId,
      createdAt: {
        [Op.gte]: twentyOneDaysAgo,
      },
    },
  });

  const totalTasks = allTaskLogs.length;
  const completedTasks = allTaskLogs.filter(log => log.status === 'completed').length;
  const failedTasks = allTaskLogs.filter(log => log.status === 'failed').length;
  const missedTasks = allTaskLogs.filter(log => log.status === 'missed').length;

  const recentTotal = recentTaskLogs.length;
  const recentCompleted = recentTaskLogs.filter(log => log.status === 'completed').length;
  const recentFailed = recentTaskLogs.filter(log => log.status === 'failed').length;
  const recentMissed = recentTaskLogs.filter(log => log.status === 'missed').length;

  return {
    overall: {
      total: totalTasks,
      completed: completedTasks,
      failed: failedTasks,
      missed: missedTasks,
      successRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    },
    recent: {
      total: recentTotal,
      completed: recentCompleted,
      failed: recentFailed,
      missed: recentMissed,
      successRate: recentTotal > 0 ? (recentCompleted / recentTotal) * 100 : 0,
    },
  };
}