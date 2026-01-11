import models from '../src/models';
import {
  addXp,
  calculateLevel,
  calculateRank,
  calculateXpRequired,
  recalculateLevelAndRank,
  getRankProgress,
  getXpForNextLevel
} from '../src/services/xp.service';

describe('XP Service', () => {
  let playerId: number;

  beforeEach(async () => {
    const player = await models.Player.create({
      rank: 'E',
      level: 1,
      totalXp: 0,
    });
    playerId = player.id;
  });

  describe('calculateXpRequired', () => {
    it('should calculate XP required for level 1', () => {
      expect(calculateXpRequired(1)).toBe(100);
    });

    it('should calculate XP required for level 5', () => {
      // 100 * 5^1.5 = 100 * 11.1803... ≈ 1118
      expect(calculateXpRequired(5)).toBe(1118);
    });

    it('should calculate XP required for level 20', () => {
      // 100 * 20^1.5 = 100 * 89.4427... ≈ 8944
      expect(calculateXpRequired(20)).toBe(8944);
    });

    it('should throw error for level < 1', () => {
      expect(() => calculateXpRequired(0)).toThrow('Level must be >= 1');
    });
  });

  describe('calculateLevel', () => {
    it('should return level 1 for 0 XP', () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it('should return level 1 for 99 XP', () => {
      expect(calculateLevel(99)).toBe(1);
    });

    it('should return level 1 for 100 XP', () => {
      expect(calculateLevel(100)).toBe(1); // Level 1 requires 100 XP
    });

    it('should return level 2 for 283 XP', () => {
      expect(calculateLevel(283)).toBe(2); // Level 2 requires 283 XP
    });

    it('should return level 5 for 1118 XP', () => {
      expect(calculateLevel(1118)).toBe(5);
    });

    it('should return level 3 for 520 XP', () => {
      expect(calculateLevel(520)).toBe(3); // Level 3 requires 520 XP
    });

    it('should handle high XP amounts', () => {
      expect(calculateLevel(100000)).toBeGreaterThan(20);
    });
  });

  describe('calculateRank', () => {
    it('should return E rank for 0 XP', () => {
      expect(calculateRank(0)).toBe('E');
    });

    it('should return E rank for 999 XP', () => {
      expect(calculateRank(999)).toBe('E');
    });

    it('should return D rank for 1000 XP', () => {
      expect(calculateRank(1000)).toBe('D');
    });

    it('should return D rank for 4999 XP', () => {
      expect(calculateRank(4999)).toBe('D');
    });

    it('should return C rank for 5000 XP', () => {
      expect(calculateRank(5000)).toBe('C');
    });

    it('should return B rank for 15000 XP', () => {
      expect(calculateRank(15000)).toBe('B');
    });

    it('should return A rank for 40000 XP', () => {
      expect(calculateRank(40000)).toBe('A');
    });

    it('should return S rank for 100000 XP', () => {
      expect(calculateRank(100000)).toBe('S');
    });

    it('should return S rank for 249999 XP', () => {
      expect(calculateRank(249999)).toBe('S');
    });

    it('should return SS rank for 250000+ XP', () => {
      expect(calculateRank(250000)).toBe('SS');
      expect(calculateRank(1000000)).toBe('SS');
    });
  });

  describe('addXp', () => {
    it('should add XP and update level/rank', async () => {
      const updatedPlayer = await addXp(playerId, 100);

      expect(updatedPlayer.totalXp).toBe(100);
      expect(updatedPlayer.level).toBe(1); // Level 1 requires 100 XP
      expect(updatedPlayer.rank).toBe('E');
    });

    it('should promote to D rank when reaching 1000 XP', async () => {
      const updatedPlayer = await addXp(playerId, 1000);

      expect(updatedPlayer.totalXp).toBe(1000);
      expect(updatedPlayer.rank).toBe('D');
    });

    it('should handle multiple XP additions', async () => {
      await addXp(playerId, 500);
      const player = await addXp(playerId, 500);

      expect(player.totalXp).toBe(1000);
      expect(player.rank).toBe('D');
    });

    it('should throw error for negative XP', async () => {
      await expect(addXp(playerId, -10)).rejects.toThrow('XP amount must be positive');
    });

    it('should handle 0 XP addition', async () => {
      const player = await addXp(playerId, 0);
      expect(player.totalXp).toBe(0);
    });

    it('should throw error for non-existent player', async () => {
      await expect(addXp(99999, 100)).rejects.toThrow('Player not found');
    });
  });

  describe('recalculateLevelAndRank', () => {
    it('should recalculate level and rank from current XP', async () => {
      // Manually set XP (bypassing addXp)
      const player = await models.Player.findByPk(playerId);
      await player?.update({ totalXp: 5000 });

      const updatedPlayer = await recalculateLevelAndRank(player!);

      expect(updatedPlayer.rank).toBe('C'); // 5000 XP = C rank
      expect(updatedPlayer.level).toBeGreaterThan(1);
    });
  });

  describe('getRankProgress', () => {
    it('should return 0% at rank start', () => {
      expect(getRankProgress(0)).toBe(0); // E rank start
      expect(getRankProgress(1000)).toBe(0); // D rank start
      expect(getRankProgress(5000)).toBe(0); // C rank start
    });

    it('should return 100% at rank end (except SS)', () => {
      expect(getRankProgress(999)).toBeCloseTo(100, 0); // E rank end
      expect(getRankProgress(4999)).toBeCloseTo(100, 0); // D rank end
      expect(getRankProgress(14999)).toBeCloseTo(100, 0); // C rank end
    });

    it('should calculate progress within rank', () => {
      // E rank: 0-999 (1000 XP range)
      expect(getRankProgress(500)).toBe(50); // Halfway through E rank

      // D rank: 1000-4999 (4000 XP range)
      expect(getRankProgress(3000)).toBe(50); // Halfway through D rank
    });

    it('should return 100% for SS rank', () => {
      expect(getRankProgress(250000)).toBe(100);
      expect(getRankProgress(1000000)).toBe(100);
    });
  });

  describe('getXpForNextLevel', () => {
    it('should return XP required for next level', () => {
      expect(getXpForNextLevel(1)).toBe(calculateXpRequired(2)); // Level 1 → 2
      expect(getXpForNextLevel(5)).toBe(calculateXpRequired(6)); // Level 5 → 6
    });
  });

  describe('Integration: Level progression within ranks', () => {
    it('should show level progression independent of ranks', async () => {
      // Add enough XP to reach high levels but stay in same rank
      await addXp(playerId, 10000); // C rank, but many levels
      const player = await models.Player.findByPk(playerId);

      expect(player?.rank).toBe('C');
      expect(player?.level).toBeGreaterThan(10);
    });

    it('should maintain level progression across rank boundaries', async () => {
      // Start at D rank
      await addXp(playerId, 2000);
      let player = await models.Player.findByPk(playerId);
      const levelAtDRank = player?.level || 0;

      // Advance to C rank
      await addXp(playerId, 5000);
      player = await models.Player.findByPk(playerId);

      expect(player?.rank).toBe('C');
      // Level should continue from previous (not reset)
      expect(player?.level).toBeGreaterThanOrEqual(levelAtDRank);
    });
  });
});
