import models from '../src/models';

describe('Model Associations', () => {
  it('should create Player with associated Stats (1:1 relationship)', async () => {
    // Create a player
    const player = await models.Player.create({
      rank: 'E',
      level: 1,
      totalXp: 0,
    });

    // Verify player was created with an id
    expect(player.id).toBeDefined();
    expect(player.id).toBeGreaterThan(0);

    // Create associated stats
    const stats = await models.Stats.create({
      playerId: player.id,
      physical: 50,
      intelligence: 50,
      discipline: 50,
      charisma: 50,
      confidence: 50,
      creativity: 50,
    });

    expect(stats.playerId).toBe(player.id);

    // Test association: Player → Stats
    const playerWithStats = await models.Player.findByPk(player.id, {
      include: [{ model: models.Stats, as: 'stats' }],
    });

    expect(playerWithStats).toBeDefined();
    expect(playerWithStats).not.toBeNull();
    
    if (playerWithStats) {
      expect(playerWithStats.stats).toBeDefined();
      expect(playerWithStats.stats).not.toBeNull();
      if (playerWithStats.stats) {
        expect(playerWithStats.stats.playerId).toBe(player.id);
        expect(playerWithStats.stats.physical).toBe(50);
      }
    }
  });

  it('should maintain referential integrity (Stats requires Player)', async () => {
    // Try to create Stats without a valid playerId
    await expect(
      models.Stats.create({
        playerId: 99999, // Non-existent player
        physical: 50,
        intelligence: 50,
        discipline: 50,
        charisma: 50,
        confidence: 50,
        creativity: 50,
      })
    ).rejects.toThrow();
  });
});
