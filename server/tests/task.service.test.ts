import models from '../src/models';
import {
  generateDailyTask,
  submitTask,
  resolveTask,
  checkAndMarkMissedTasks
} from '../src/services/task.service';

describe('Task Service', () => {
  let playerId: number;

  beforeEach(async () => {
    const player = await models.Player.create({
      rank: 'E',
      level: 1,
      totalXp: 0,
    });

    await models.Stats.create({
      playerId: player.id,
      physical: 30, // Make this the weakest stat
      intelligence: 50,
      discipline: 50,
      charisma: 50,
      confidence: 50,
      creativity: 50,
    });

    playerId = player.id;
  });

  describe('generateDailyTask', () => {
    it('should generate a daily task biased toward weakest stat', async () => {
      const task = await generateDailyTask(playerId);

      expect(task.type).toBe('daily');
      expect(task.difficulty).toBe('easy');
      expect(task.targetStat).toBe('physical'); // Should target weakest stat
      expect(task.xpReward).toBeGreaterThanOrEqual(20);
      expect(task.xpReward).toBeLessThanOrEqual(40);
      expect(task.deadline).toBeInstanceOf(Date);
    });

    it('should create task with proper deadline', async () => {
      const task = await generateDailyTask(playerId);
      const now = new Date();

      // Deadline should be end of today
      expect(task.deadline.getDate()).toBe(now.getDate());
      expect(task.deadline.getHours()).toBe(23);
      expect(task.deadline.getMinutes()).toBe(59);
    });

    it('should throw error if stats not found', async () => {
      await expect(generateDailyTask(99999)).rejects.toThrow(/Stats not found/);
    });
  });

  describe('submitTask', () => {
    it('should submit evidence and create task log', async () => {
      const task = await generateDailyTask(playerId);
      const evidence = 'Completed my workout routine';

      const taskLog = await submitTask(task.id, playerId, evidence);

      expect(taskLog.taskId).toBe(task.id);
      expect(taskLog.playerId).toBe(playerId);
      expect(taskLog.status).toBe('pending');
      expect(taskLog.evidence).toBe(evidence);
    });

    it('should throw error for non-existent task', async () => {
      await expect(submitTask(99999, playerId, 'evidence')).rejects.toThrow('Task not found');
    });

    it('should throw error for past deadline', async () => {
      const task = await generateDailyTask(playerId);

      // Manually set deadline to past
      await task.update({ deadline: new Date(Date.now() - 1000) });

      await expect(submitTask(task.id, playerId, 'evidence')).rejects.toThrow('Task deadline has passed');
    });
  });

  describe('resolveTask', () => {
    it('should resolve successful task and apply rewards', async () => {
      const task = await generateDailyTask(playerId);
      const taskLog = await submitTask(task.id, playerId, 'Completed successfully');

      const resolution = {
        success: true,
        xpAwarded: 25,
        statChanges: { physical: 1, discipline: 0.5 },
        feedback: 'Great job!',
      };

      const resolvedTaskLog = await resolveTask(taskLog, resolution);

      expect(resolvedTaskLog.status).toBe('completed');
      expect(resolvedTaskLog.aiVerdict).toBe('Great job!');

      // Check XP was added
      const player = await models.Player.findByPk(playerId);
      expect(player?.totalXp).toBe(25);

      // Check stats were updated
      const stats = await models.Stats.findOne({ where: { playerId } });
      expect(stats?.physical).toBe(31); // 30 + 1
      expect(stats?.discipline).toBe(51); // 50 + 0.5 = 50.5 → rounds to 51
    });

    it('should resolve failed task without applying rewards', async () => {
      const task = await generateDailyTask(playerId);
      const taskLog = await submitTask(task.id, playerId, 'Did not complete');

      const resolution = {
        success: false,
        xpAwarded: 0,
        statChanges: {},
        feedback: 'Requirements not met',
      };

      const resolvedTaskLog = await resolveTask(taskLog, resolution);

      expect(resolvedTaskLog.status).toBe('failed');
      expect(resolvedTaskLog.aiVerdict).toBe('Requirements not met');

      // Check no XP was added
      const player = await models.Player.findByPk(playerId);
      expect(player?.totalXp).toBe(0);
    });
  });

  describe('checkAndMarkMissedTasks', () => {
    it('should mark overdue tasks as missed', async () => {
      const task = await generateDailyTask(playerId);
      await submitTask(task.id, playerId, 'Will complete later');

      // Set deadline to past
      await task.update({ deadline: new Date(Date.now() - 1000) });

      const missedTasks = await checkAndMarkMissedTasks(playerId);

      expect(missedTasks).toHaveLength(1);
      expect(missedTasks[0].status).toBe('missed');
    });

    it('should not mark active tasks as missed', async () => {
      const task = await generateDailyTask(playerId);
      await submitTask(task.id, playerId, 'Still active');

      const missedTasks = await checkAndMarkMissedTasks(playerId);

      expect(missedTasks).toHaveLength(0);
    });
  });
});
