import models from '../src/models';
import {
  calculatePSI,
  applyPenalty,
  applyMissPenalty,
  isRankLocked,
  getActivePenalties,
  cleanupExpiredPenalties
} from '../src/services/penalty.service';

describe('Penalty Service', () => {
  let playerId: number;

  beforeEach(async () => {
    const player = await models.Player.create({
      rank: 'E',
      level: 1,
      totalXp: 0,
    });

    await models.Stats.create({
      playerId: player.id,
      physical: 50,
      intelligence: 50,
      discipline: 50,
      charisma: 50,
      confidence: 50,
      creativity: 50,
    });

    playerId = player.id;
  });

  describe('calculatePSI', () => {
    it('should return 0 for player with no missed tasks', async () => {
      const psi = await calculatePSI(playerId);
      expect(psi).toBe(0);
    });

    it('should calculate PSI based on missed tasks', async () => {
      // Create a missed task
      const task = await models.Task.create({
        type: 'daily',
        difficulty: 'medium', // Multiplier = 2
        description: 'Test task',
        targetStat: 'discipline',
        xpReward: 25,
        deadline: new Date(),
      });

      await models.TaskLog.create({
        taskId: task.id,
        playerId,
        status: 'missed',
      });

      const psi = await calculatePSI(playerId);
      expect(psi).toBeGreaterThan(0);
    });
  });

  describe('applyPenalty', () => {
    it('should apply warning for low PSI', async () => {
      const penalty = await applyPenalty(playerId, 3);

      expect(penalty).toBe('warning');

      const penalties = await getActivePenalties(playerId);
      expect(penalties).toHaveLength(1);
      expect(penalties[0].reason).toBe('missed_task');
    });

    it('should apply stat decay for medium PSI', async () => {
      const penalty = await applyPenalty(playerId, 7);

      expect(penalty).toBe('stat_decay');

      // Check stats were reduced
      const stats = await models.Stats.findOne({ where: { playerId } });
      expect(stats?.discipline).toBe(49); // 50 - 1
      expect(stats?.confidence).toBe(50); // 50 - 0.5 = 49.5 → rounds to 50
    });

    it('should apply XP loss for high PSI', async () => {
      // Give player some XP first
      await models.Player.update({ totalXp: 100 }, { where: { id: playerId } });

      const penalty = await applyPenalty(playerId, 15);

      expect(penalty).toBe('xp_loss');

      // Check XP was reduced
      const player = await models.Player.findByPk(playerId);
      expect(player?.totalXp).toBeLessThan(100);
    });

    it('should apply rank lock for very high PSI', async () => {
      const penalty = await applyPenalty(playerId, 25);

      expect(penalty).toBe('rank_lock');

      const isLocked = await isRankLocked(playerId);
      expect(isLocked).toBe(true);
    });
  });

  describe('applyMissPenalty', () => {
    it('should apply appropriate penalty based on PSI', async () => {
      // Create some missed tasks to increase PSI
      for (let i = 0; i < 3; i++) {
        const task = await models.Task.create({
          type: 'daily',
          difficulty: 'hard', // Multiplier = 3
          description: `Test task ${i}`,
          targetStat: 'discipline',
          xpReward: 25,
          deadline: new Date(),
        });

        await models.TaskLog.create({
          taskId: task.id,
          playerId,
          status: 'missed',
        });
      }

      const result = await applyMissPenalty(playerId);

      expect(result.psi).toBeGreaterThan(0);
      expect(['warning', 'stat_decay', 'xp_loss', 'rank_lock']).toContain(result.penalty);
      expect(typeof result.details).toBe('string');
    });
  });

  describe('isRankLocked', () => {
    it('should return false when no rank lock exists', async () => {
      const isLocked = await isRankLocked(playerId);
      expect(isLocked).toBe(false);
    });

    it('should return true when active rank lock exists', async () => {
      await applyPenalty(playerId, 25); // Creates rank lock

      const isLocked = await isRankLocked(playerId);
      expect(isLocked).toBe(true);
    });
  });

  describe('cleanupExpiredPenalties', () => {
    it('should remove expired penalties', async () => {
      // Create an expired penalty (expired 1 minute ago)
      const expiredTime = new Date(Date.now() - 60 * 1000);
      await models.Penalty.create({
        playerId,
        reason: 'xp_loss',
        severity: 10,
        expiresAt: expiredTime,
      });

      // Check that the penalty exists but is not active
      const allPenalties = await models.Penalty.findAll({ where: { playerId } });
      expect(allPenalties.length).toBeGreaterThan(0);

      const activeBefore = await getActivePenalties(playerId);
      // The penalty should not be considered active since it's expired
      expect(activeBefore.length).toBe(0);

      const cleanedCount = await cleanupExpiredPenalties();
      expect(cleanedCount).toBeGreaterThan(0);
    });
  });
});
