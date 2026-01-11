import models from '../models';
import { Task, Difficulty, StatType } from '../models/Task';
import { TaskLog, TaskStatus } from '../models/TaskLog';
import { Op } from 'sequelize';
import { addXp } from './xp.service';
import { applyStatChange } from './stat.service';

const { Task: TaskModel, TaskLog: TaskLogModel } = models;

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
 * Generates a daily task for a player, biased toward their weakest stat
 *
 * @param playerId - Player ID
 * @returns Created Task instance
 */
export async function generateDailyTask(playerId: number): Promise<Task> {
  const weakestStat = await getWeakestStat(playerId);

  // For now, always generate easy difficulty daily tasks
  const difficulty: Difficulty = 'easy';
  const template = TASK_TEMPLATES.daily[difficulty];

  // Random XP within range
  const baseXp = Math.floor(Math.random() * (template.xpRange[1] - template.xpRange[0] + 1)) + template.xpRange[0];
  const xpReward = calculateXpReward(difficulty, baseXp);

  // Set deadline to end of today
  const deadline = new Date();
  deadline.setHours(23, 59, 59, 999);

  const task = await TaskModel.create({
    type: 'daily',
    difficulty,
    description: getRandomDescription(weakestStat),
    targetStat: weakestStat,
    xpReward,
    deadline,
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
 * Resolves a task based on AI judgment and applies rewards/penalties
 *
 * @param taskLog - TaskLog instance
 * @param resolution - AI resolution result
 * @returns Updated TaskLog instance
 */
export async function resolveTask(
  taskLog: TaskLog,
  resolution: TaskResolution
): Promise<TaskLog> {
  const { success, xpAwarded, statChanges, feedback } = resolution;

  // Update task log status
  const newStatus: TaskStatus = success ? 'completed' : 'failed';
  await taskLog.update({
    status: newStatus,
    aiVerdict: feedback || (success ? 'Task completed successfully' : 'Task requirements not met'),
  });

  if (success) {
    // Apply rewards
    await addXp(taskLog.playerId, xpAwarded);

    // Apply stat changes if any
    if (Object.keys(statChanges).length > 0) {
      await applyStatChange(taskLog.playerId, statChanges);
    }
  }

  return taskLog.reload({
    include: [
      {
        model: TaskModel,
        as: 'task',
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
