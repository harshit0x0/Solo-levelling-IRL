import '../tests/setup';
import models from '../src/models';
import { runDailyDecayJob } from '../src/jobs/dailyDecay.job';
import { applyDailyDecay } from '../src/services/stat.service';
import { checkAndMarkMissedTasks, generateDailyTask, judgeAndResolveTask } from '../src/services/task.service';
import { applyMissPenalty } from '../src/services/penalty.service';

// Mock the services
jest.mock('../src/services/stat.service');
jest.mock('../src/services/task.service');
jest.mock('../src/services/penalty.service');

describe('Daily Decay Job', () => {
  let testPlayer: any;

  beforeEach(async () => {
    // Create a test player with stats
    testPlayer = await models.Player.create({
      rank: 'E',
      level: 1,
      totalXp: 0,
    });

    await models.Stats.create({
      playerId: testPlayer.id,
      physical: 50,
      intelligence: 50,
      discipline: 50,
      charisma: 50,
      confidence: 50,
      creativity: 50,
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should process daily flow for a player', async () => {
    // Mock service functions
    (judgeAndResolveTask as jest.Mock).mockResolvedValue(undefined);
    (applyDailyDecay as jest.Mock).mockResolvedValue(undefined);
    (checkAndMarkMissedTasks as jest.Mock).mockResolvedValue([]);
    (generateDailyTask as jest.Mock).mockResolvedValue({ id: 1 });

    await runDailyDecayJob();

    // Verify services were called
    expect(applyDailyDecay).toHaveBeenCalledWith(testPlayer.id);
    expect(checkAndMarkMissedTasks).toHaveBeenCalledWith(testPlayer.id);
    expect(generateDailyTask).toHaveBeenCalledWith(testPlayer.id);
  });

  it('should apply penalties when missed tasks are found', async () => {
    const mockMissedTask = { id: 1, playerId: testPlayer.id };
    
    (judgeAndResolveTask as jest.Mock).mockResolvedValue(undefined);
    (applyDailyDecay as jest.Mock).mockResolvedValue(undefined);
    (checkAndMarkMissedTasks as jest.Mock).mockResolvedValue([mockMissedTask]);
    (applyMissPenalty as jest.Mock).mockResolvedValue(undefined);
    (generateDailyTask as jest.Mock).mockResolvedValue({ id: 1 });

    await runDailyDecayJob();

    expect(applyMissPenalty).toHaveBeenCalledWith(expect.any(Number));
  });

  it('should skip player on error and continue with others', async () => {
    const testPlayer2 = await models.Player.create({
      rank: 'E',
      level: 1,
      totalXp: 0,
    });

    await models.Stats.create({
      playerId: testPlayer2.id,
      physical: 50,
      intelligence: 50,
      discipline: 50,
      charisma: 50,
      confidence: 50,
      creativity: 50,
    });

    // First player fails, second succeeds
    (applyDailyDecay as jest.Mock)
      .mockRejectedValueOnce(new Error('Test error'))
      .mockResolvedValueOnce(undefined);
    
    (judgeAndResolveTask as jest.Mock).mockResolvedValue(undefined);
    (checkAndMarkMissedTasks as jest.Mock).mockResolvedValue([]);
    (generateDailyTask as jest.Mock).mockResolvedValue({ id: 1 });

    await runDailyDecayJob();

    // Second player should still be processed
    expect(applyDailyDecay).toHaveBeenCalledTimes(2);
    expect(generateDailyTask).toHaveBeenCalledTimes(1); // Only second player
  });
});
