import models from '../models';
import { Player } from '../models/Player';
import { Rank } from '../models/Player';

const { Player: PlayerModel } = models;

/**
 * XP thresholds for each rank (from Draft2)
 * Rank is derived from lifetime XP total
 */
const RANK_XP_THRESHOLDS: Record<Rank, { min: number; max?: number }> = {
  E: { min: 0, max: 999 },
  D: { min: 1000, max: 4999 },
  C: { min: 5000, max: 14999 },
  B: { min: 15000, max: 39999 },
  A: { min: 40000, max: 99999 },
  S: { min: 100000, max: 249999 },
  SS: { min: 250000 }, // No upper bound
};

/**
 * Calculates the XP required for a given level
 * Formula from Draft2: xpRequired(level) = 100 * level^1.5
 *
 * @param level - Target level (1-based)
 * @returns XP required to reach this level
 */
export function calculateXpRequired(level: number): number {
  if (level < 1) {
    throw new Error('Level must be >= 1');
  }
  return Math.round(100 * Math.pow(level, 1.5));
}

/**
 * Calculates the current level based on total XP
 * Level is relative within the current rank
 *
 * @param totalXp - Player's total lifetime XP
 * @returns Current level (1-based)
 */
export function calculateLevel(totalXp: number): number {
  let level = 1;

  // Keep increasing level until we can't afford the next one
  while (true) {
    const nextXpRequired = calculateXpRequired(level + 1);
    if (totalXp < nextXpRequired) {
      break;
    }
    level++;
  }

  return level;
}

/**
 * Determines rank based on total lifetime XP
 * Rank is derived from XP thresholds (from Draft2)
 *
 * @param totalXp - Player's total lifetime XP
 * @returns Current rank
 */
export function calculateRank(totalXp: number): Rank {
  // Handle negative XP (due to penalties)
  if (totalXp < 0) {
    return 'E';
  }

  for (const [rank, threshold] of Object.entries(RANK_XP_THRESHOLDS) as [Rank, { min: number; max?: number }][] ) {
    if (totalXp >= threshold.min && (threshold.max === undefined || totalXp <= threshold.max)) {
      return rank;
    }
  }

  // Should never reach here if thresholds are comprehensive
  throw new Error(`Invalid XP amount: ${totalXp}`);
}

/**
 * Recalculates and updates a player's level and rank based on their current total XP
 *
 * @param player - Player instance to update
 * @returns Updated Player instance
 */
export async function recalculateLevelAndRank(player: Player): Promise<Player> {
  const newLevel = calculateLevel(player.totalXp);
  const newRank = calculateRank(player.totalXp);

  await player.update({
    level: newLevel,
    rank: newRank,
  });

  return player.reload();
}

/**
 * Adds XP to a player and recalculates their level and rank
 * XP is lifetime total and never decreases
 *
 * @param playerId - Player ID
 * @param xpAmount - XP amount to add (must be positive)
 * @returns Updated Player instance
 */
export async function addXp(playerId: number, xpAmount: number): Promise<Player> {
  // Allow negative XP for penalties (XP loss)

  if (xpAmount === 0) {
    // No change needed
    const player = await PlayerModel.findByPk(playerId);
    if (!player) {
      throw new Error(`Player not found: ${playerId}`);
    }
    return player;
  }

  const player = await PlayerModel.findByPk(playerId);
  if (!player) {
    throw new Error(`Player not found: ${playerId}`);
  }

  // Update total XP
  const newTotalXp = player.totalXp + xpAmount;
  await player.update({ totalXp: newTotalXp });

  // Recalculate level and rank based on new total XP
  return recalculateLevelAndRank(player);
}

/**
 * Gets XP progress within current rank
 * Returns percentage progress (0-100) toward next rank
 *
 * @param totalXp - Player's total XP
 * @returns Progress percentage toward next rank
 */
export function getRankProgress(totalXp: number): number {
  const currentRank = calculateRank(totalXp);
  const threshold = RANK_XP_THRESHOLDS[currentRank];

  if (!threshold.max) {
    // SS rank has no upper bound
    return 100;
  }

  const rankStart = threshold.min;
  const rankEnd = threshold.max;
  const rankRange = rankEnd - rankStart;
  const currentProgress = totalXp - rankStart;

  return Math.round((currentProgress / rankRange) * 100);
}

/**
 * Gets XP required for next level
 *
 * @param currentLevel - Current level
 * @returns XP required for next level
 */
export function getXpForNextLevel(currentLevel: number): number {
  return calculateXpRequired(currentLevel + 1);
}
