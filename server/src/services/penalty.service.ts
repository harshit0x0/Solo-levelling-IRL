import models from '../models';
import { Penalty } from '../models/Penalty';
import { Difficulty } from '../models/Task';
import { Op } from 'sequelize';
import { applyStatChange } from './stat.service';
import { addXp } from './xp.service';

const { Penalty: PenaltyModel } = models;

/**
 * Difficulty multipliers for PSI calculation
 */
const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  extreme: 4,
};

/**
 * Calculates Penalty Severity Index (PSI)
 * PSI = missedTasks * difficulty * streakFactor
 *
 * @param playerId - Player ID
 * @returns PSI score
 */
export async function calculatePSI(playerId: number): Promise<number> {
  // Get recent missed tasks (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentMissedTasks = await models.TaskLog.findAll({
    where: {
      playerId,
      status: 'missed',
      createdAt: {
        [Op.gte]: sevenDaysAgo,
      },
    },
    include: [
      {
        model: models.Task,
        as: 'task',
        required: true,
      },
    ],
  });

  if (recentMissedTasks.length === 0) {
    return 0;
  }

  // Calculate base PSI: sum of (difficulty * 1) for each missed task
  let psi = 0;
  for (const taskLog of recentMissedTasks) {
    const taskLogWithTask = taskLog as typeof taskLog & { task: { difficulty: Difficulty } };
    const difficulty = taskLogWithTask.task.difficulty;
    psi += DIFFICULTY_MULTIPLIERS[difficulty];
  }

  // Apply streak factor (simple version: bonus for consecutive misses)
  const streakFactor = Math.min(recentMissedTasks.length * 0.1 + 1, 2.0);
  psi *= streakFactor;

  return Math.floor(psi); // Round down to nearest integer
}

/**
 * Applies penalty based on PSI score
 *
 * @param playerId - Player ID
 * @param psi - Penalty Severity Index
 * @returns Applied penalty type
 */
export async function applyPenalty(playerId: number, psi: number): Promise<string> {
  if (psi < 5) {
    // Warning - no actual penalty
    await PenaltyModel.create({
      playerId,
      reason: 'missed_task',
      severity: psi,
    });
    return 'warning';
  }

  if (psi >= 5 && psi < 10) {
    // Stat decay
    await applyStatChange(playerId, {
      discipline: -1, // Additional discipline penalty
      confidence: -0.5,
    });

    await PenaltyModel.create({
      playerId,
      reason: 'missed_task',
      severity: psi,
    });
    return 'stat_decay';
  }

  if (psi >= 10 && psi < 20) {
    // XP loss
    await addXp(playerId, -Math.round(psi * 2)); // Lose XP based on PSI
    await PenaltyModel.create({
      playerId,
        reason: 'xp_loss',
        severity: psi,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 1 day
      });
    return 'xp_loss';
  }

  if (psi >= 20) {
    // Rank lock
    const lockDays = Math.min(Math.floor(psi / 5), 30); // Max 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + lockDays);

    await PenaltyModel.create({
      playerId,
      reason: 'rank_lock',
      severity: psi,
      expiresAt,
    });
    return 'rank_lock';
  }

  return 'none';
}

/**
 * Applies penalty for a missed task
 * Called when a task deadline passes without submission
 *
 * @param playerId - Player ID
 * @returns Penalty result
 */
export async function applyMissPenalty(playerId: number): Promise<{
  psi: number;
  penalty: string;
  details: string;
}> {
  const psi = await calculatePSI(playerId);

  // If there are no recent missed tasks, don't apply or record any penalty
  if (psi === 0) {
    return {
      psi,
      penalty: 'none',
      details: 'No penalty applied.',
    };
  }

  const penalty = await applyPenalty(playerId, psi);

  let details = '';
  switch (penalty) {
    case 'warning':
      details = 'Warning issued for missed tasks.';
      break;
    case 'stat_decay':
      details = 'Stats reduced due to missed tasks.';
      break;
    case 'xp_loss':
      details = `Lost XP due to missed tasks. Penalty expires in 24 hours.`;
      break;
    case 'rank_lock':
      details = `Rank progression locked due to severe penalties.`;
      break;
    default:
      details = 'No penalty applied.';
  }

  return { psi, penalty, details };
}

/**
 * Checks if a player has an active rank lock penalty
 *
 * @param playerId - Player ID
 * @returns True if rank is locked
 */
export async function isRankLocked(playerId: number): Promise<boolean> {
  const activeRankLock = await PenaltyModel.findOne({
    where: {
      playerId,
      reason: 'rank_lock',
      expiresAt: {
        [Op.gt]: new Date(),
      },
    },
  });

  return activeRankLock !== null;
}

/**
 * Gets active penalties for a player
 *
 * @param playerId - Player ID
 * @returns Array of active Penalty instances
 */
export async function getActivePenalties(playerId: number): Promise<Penalty[]> {
  return await PenaltyModel.findAll({
    where: {
      playerId,
      [Op.or]: [
        { expiresAt: null }, // Permanent penalties
        { expiresAt: { [Op.gt]: new Date() } }, // Not yet expired
      ],
    },
    order: [['createdAt', 'DESC']],
  });
}

/**
 * Cleans up expired penalties
 * Called by daily cron job
 *
 * @returns Number of penalties cleaned up
 */
export async function cleanupExpiredPenalties(): Promise<number> {
  const result = await PenaltyModel.destroy({
    where: {
      expiresAt: {
        [Op.lt]: new Date(),
      },
    },
  });

  return result;
}
