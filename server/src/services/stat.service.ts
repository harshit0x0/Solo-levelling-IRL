import models from '../models';
import { Stats, StatsAttributes } from '../models/Stats';
import { Op } from 'sequelize';

const { Stats: StatsModel, TaskLog, Task } = models;

type StatType = keyof Omit<StatsAttributes, 'id' | 'playerId' | 'createdAt' | 'updatedAt'>;

/**
 * Stat change deltas - relative changes to apply to stats
 */
export interface StatChanges {
  physical?: number;
  intelligence?: number;
  discipline?: number;
  charisma?: number;
  confidence?: number;
  creativity?: number;
}

/**
 * Daily decay rates per stat (from Draft2)
 * 
 * Note: Since stats are stored as integers, small decimal decay rates
 * will round to 0 on individual days. Decay will accumulate over multiple
 * days (e.g., -0.2/day × 5 days = -1.0 total). This is acceptable for V1.
 */
const DAILY_DECAY_RATES: Record<StatType, number> = {
  discipline: -0.2,
  physical: -0.1,
  intelligence: -0.05,
  confidence: -0.1,
  charisma: -0.05,
  creativity: -0.05,
};

/**
 * Clamps a stat value between 0 and 100
 * Rounds to nearest integer since stats are stored as integers
 */
function clampStat(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Checks if player completed a daily quest today
 */
async function hasCompletedDailyQuestToday(playerId: number): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const completedDaily = await TaskLog.findOne({
    where: {
      playerId,
      status: 'completed',
      createdAt: {
        [Op.between]: [startOfDay, endOfDay],
      },
    },
    include: [
      {
        model: Task,
        as: 'task',
        where: {
          type: 'daily',
        },
        required: true,
      },
    ],
  });

  return completedDaily !== null;
}

/**
 * Applies stat changes (relative deltas) to a player's stats
 * Clamps all values to 0-100 range
 * 
 * @param playerId - Player ID
 * @param changes - Object with stat deltas (e.g., { discipline: +1, confidence: -0.5 })
 * @returns Updated Stats instance
 */
export async function applyStatChange(
  playerId: number,
  changes: StatChanges
): Promise<Stats> {
  const stats = await StatsModel.findOne({
    where: { playerId },
  });

  if (!stats) {
    throw new Error(`Stats not found for player ${playerId}`);
  }

  // Apply relative changes
  const updatedStats: Partial<StatsAttributes> = {
    physical: clampStat(stats.physical + (changes.physical || 0)),
    intelligence: clampStat(stats.intelligence + (changes.intelligence || 0)),
    discipline: clampStat(stats.discipline + (changes.discipline || 0)),
    charisma: clampStat(stats.charisma + (changes.charisma || 0)),
    confidence: clampStat(stats.confidence + (changes.confidence || 0)),
    creativity: clampStat(stats.creativity + (changes.creativity || 0)),
  };

  // Update stats
  await stats.update(updatedStats);

  return stats.reload();
}

/**
 * Applies daily stat decay to a player
 * Skips decay if player completed a daily quest today (per Draft2)
 * 
 * @param playerId - Player ID
 * @returns Updated Stats instance, or null if decay was skipped
 */
export async function applyDailyDecay(playerId: number): Promise<Stats | null> {
  // Check if daily quest was completed today
  const completedDaily = await hasCompletedDailyQuestToday(playerId);
  
  if (completedDaily) {
    // Daily quests prevent stat decay (Draft2)
    return null;
  }

  const stats = await StatsModel.findOne({
    where: { playerId },
  });

  if (!stats) {
    throw new Error(`Stats not found for player ${playerId}`);
  }

  // Apply decay rates
  const changes: StatChanges = {
    discipline: DAILY_DECAY_RATES.discipline,
    physical: DAILY_DECAY_RATES.physical,
    intelligence: DAILY_DECAY_RATES.intelligence,
    confidence: DAILY_DECAY_RATES.confidence,
    charisma: DAILY_DECAY_RATES.charisma,
    creativity: DAILY_DECAY_RATES.creativity,
  };

  return applyStatChange(playerId, changes);
}
