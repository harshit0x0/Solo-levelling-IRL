import models from '../models';

/**
 * Gets player status including player info, stats, rank, and level
 *
 * @param playerId - Player ID
 * @returns Player with associated stats
 */
export async function getPlayerStatus(playerId: number) {
  const player = await models.Player.findByPk(playerId, {
    include: [
      {
        model: models.Stats,
        as: 'stats',
        required: false,
      },
    ],
  });

  if (!player) {
    throw new Error(`Player not found: ${playerId}`);
  }

  const playerStats = {
      "physical": player.stats?.physical,
      "intelligence": player.stats?.intelligence,
      "discipline": player.stats?.discipline,
      "charisma": player.stats?.charisma,
      "confidence": player.stats?.confidence,
      "creativity": player.stats?.creativity,
  }

  return {
    player: {
      id: player.id,
      rank: player.rank,
      level: player.level,
      totalXp: player.totalXp,
    },
    stats: playerStats || null,
  };
}