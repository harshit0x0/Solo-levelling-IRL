/**
 * Daily Decay Job
 * 
 * Runs daily to process all players:
 * 1. Auto-judges pending tasks near deadline (within 1 hour)
 * 2. Applies stat decay
 * 3. Checks and marks missed tasks
 * 4. Applies penalties for missed tasks
 * 5. Generates new daily task
 * 
 * Schedule: Configurable via DAILY_CRON_SCHEDULE env variable (default: '0 0 * * *' - midnight UTC)
 * Example: DAILY_CRON_SCHEDULE="0 2 * * *" runs at 2 AM UTC
 */

import cron from 'node-cron';
import models from '../models';
import sequelize from '../config/database';
import { Op } from 'sequelize';
import { applyDailyDecay } from '../services/stat.service';
import { checkAndMarkMissedTasks, generateDailyTask, judgeAndResolveTask } from '../services/task.service';
import { applyMissPenalty } from '../services/penalty.service';

import { TaskLog as TaskLogModel } from '../models/TaskLog';
const { Player, TaskLog, Task } = models;

/**
 * Finds pending TaskLogs that are near deadline (within 1 hour)
 * and need to be auto-judged before the daily cron processes missed tasks
 */
async function findPendingTasksNearDeadline(playerId: number): Promise<TaskLogModel[]> {
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
  const now = new Date();

  const pendingTaskLogs = await TaskLog.findAll({
    where: {
      playerId,
      status: 'pending',
    },
    include: [
      {
        model: Task,
        as: 'task',
        where: {
          deadline: {
            [Op.gte]: now,
            [Op.lte]: oneHourFromNow,
          },
        },
        required: true,
      },
    ],
  });

  return pendingTaskLogs;
}

/**
 * Processes daily decay and task management for a single player
 * Wrapped in a transaction to ensure atomicity
 */
async function processPlayerDailyFlow(playerId: number): Promise<void> {
  const transaction = await sequelize.transaction();

  try {
    // Step 1: Auto-judge pending tasks that are near deadline
    const pendingTasksNearDeadline = await findPendingTasksNearDeadline(playerId);
    
    for (const taskLog of pendingTasksNearDeadline) {
      try {
        await judgeAndResolveTask(taskLog.id);
        console.log(`[Daily Job] Auto-judged task log ${taskLog.id} for player ${playerId}`);
      } catch (error) {
        console.error(`[Daily Job] Error auto-judging task log ${taskLog.id} for player ${playerId}:`, error);
        // Continue with other tasks even if one fails
      }
    }

    // Step 2: Apply stat decay
    await applyDailyDecay(playerId);
    console.log(`[Daily Job] Applied stat decay for player ${playerId}`);

    // Step 3: Check and mark missed tasks
    const missedTasks = await checkAndMarkMissedTasks(playerId);
    console.log(`[Daily Job] Found ${missedTasks.length} missed tasks for player ${playerId}`);

    // Step 4: Apply penalties for missed tasks
    if (missedTasks.length > 0) {
      const player = await Player.findByPk(playerId, { transaction });
      if (player) {
        await applyMissPenalty(playerId);
        console.log(`[Daily Job] Applied penalties for player ${playerId}`);
      }
    }

    // Step 5: Generate new daily task
    await generateDailyTask(playerId);
    console.log(`[Daily Job] Generated new daily task for player ${playerId}`);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Main daily cron job function
 * Fetches all players and processes daily flow for each
 * Exported for testing purposes
 */
export async function runDailyDecayJob(): Promise<void> {
  const startTime = new Date();
  console.log(`[Daily Job] Starting daily decay job at ${startTime.toISOString()}`);

  try {
    // Fetch all players
    const players = await Player.findAll();
    console.log(`[Daily Job] Found ${players.length} players to process`);

    let successCount = 0;
    let errorCount = 0;

    // Process each player
    for (const player of players) {
      try {
        await processPlayerDailyFlow(player.id);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`[Daily Job] Error processing player ${player.id}:`, error);
        // Continue with next player (skip on error)
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    console.log(
      `[Daily Job] Completed at ${endTime.toISOString()}. ` +
      `Duration: ${duration}ms. ` +
      `Success: ${successCount}, Errors: ${errorCount}`
    );
  } catch (error) {
    console.error('[Daily Job] Fatal error in daily decay job:', error);
  }
}

/**
 * Initializes and starts the daily cron job
 * Schedule is configurable via DAILY_CRON_SCHEDULE environment variable
 * Default: '0 0 * * *' (midnight every day)
 */
export function startDailyDecayJob(): void {
  const schedule = process.env.DAILY_CRON_SCHEDULE || '0 0 * * *';
  
  console.log(`[Daily Job] Scheduling daily decay job with schedule: ${schedule}`);
  
  cron.schedule(schedule, runDailyDecayJob, {
    scheduled: true,
    timezone: 'UTC',
  });

  console.log('[Daily Job] Daily decay job scheduled and started');
}
