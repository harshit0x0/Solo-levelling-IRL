import { judgeTask } from '../../src/ai/judge';
import { TaskAttributes } from '../../src/models/Task';
import { StatsAttributes } from '../../src/models/Stats';

// Skip integration tests if API key is not set
const shouldRunIntegrationTests = !!process.env.OPENAI_API_KEY;

describe('AI Judge Module - Integration Tests', () => {
  const mockTask: TaskAttributes = {
    id: 1,
    type: 'daily',
    difficulty: 'medium',
    description: 'Complete a 30-minute workout',
    targetStat: 'physical',
    xpReward: 50,
    deadline: new Date('2024-12-31T23:59:59Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPlayerStats: StatsAttributes = {
    id: 1,
    playerId: 1,
    physical: 40,
    intelligence: 50,
    discipline: 60,
    charisma: 45,
    confidence: 55,
    creativity: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(() => {
    if (!shouldRunIntegrationTests) {
      console.log('Skipping integration tests: OPENAI_API_KEY not set');
    }
  });

  describe('Real API Calls', () => {
    it(
      'should return valid response for clear success evidence',
      async () => {
        if (!shouldRunIntegrationTests) {
          return;
        }

        const result = await judgeTask({
          task: mockTask,
          playerStats: mockPlayerStats,
          evidence: 'I completed a 30-minute workout at the gym. I did 3 sets of bench press (10 reps each), 3 sets of squats (12 reps each), and 20 minutes on the treadmill. Here is a photo of me at the gym: [photo would be here].',
        });

        // Validate structure
        expect(['success', 'fail']).toContain(result.verdict);
        expect(typeof result.xp).toBe('number');
        expect(result.xp).toBeGreaterThanOrEqual(0);
        expect(typeof result.statChanges).toBe('object');
        expect(typeof result.comment).toBe('string');

        // If success, validate success conditions
        if (result.verdict === 'success') {
          expect(result.xp).toBeGreaterThan(0);
          expect(Object.keys(result.statChanges).length).toBeGreaterThan(0);
        }

        // If fail, validate fail conditions
        if (result.verdict === 'fail') {
          expect(result.xp).toBe(0);
          expect(Object.keys(result.statChanges).length).toBe(0);
        }

        console.log('Real API Response:', JSON.stringify(result, null, 2));
      },
      30000 // 30 second timeout for API call
    );

    it(
      'should return fail for vague/low-effort evidence',
      async () => {
        if (!shouldRunIntegrationTests) {
          return;
        }

        const result = await judgeTask({
          task: mockTask,
          playerStats: mockPlayerStats,
          evidence: 'I tried to work out but got tired.',
        });

        // Should likely fail, but we just validate structure
        expect(['success', 'fail']).toContain(result.verdict);
        expect(typeof result.xp).toBe('number');
        expect(typeof result.statChanges).toBe('object');
        expect(typeof result.comment).toBe('string');

        // Validate fail conditions if verdict is fail
        if (result.verdict === 'fail') {
          expect(result.xp).toBe(0);
          expect(Object.keys(result.statChanges).length).toBe(0);
        }

        console.log('Real API Response (vague evidence):', JSON.stringify(result, null, 2));
      },
      30000
    );

    it(
      'should return valid response for different task types',
      async () => {
        if (!shouldRunIntegrationTests) {
          return;
        }

        const intelligenceTask: TaskAttributes = {
          ...mockTask,
          type: 'daily',
          difficulty: 'easy',
          description: 'Read a chapter from a non-fiction book',
          targetStat: 'intelligence',
          xpReward: 20,
        };

        const result = await judgeTask({
          task: intelligenceTask,
          playerStats: mockPlayerStats,
          evidence: 'I read Chapter 5 of "Atomic Habits" by James Clear. The chapter was about the 1% rule and how small changes compound over time. I took notes on key concepts.',
        });

        expect(['success', 'fail']).toContain(result.verdict);
        expect(typeof result.xp).toBe('number');
        expect(typeof result.statChanges).toBe('object');
        expect(typeof result.comment).toBe('string');

        console.log('Real API Response (intelligence task):', JSON.stringify(result, null, 2));
      },
      30000
    );

    it(
      'should handle different difficulty levels correctly',
      async () => {
        if (!shouldRunIntegrationTests) {
          return;
        }

        const hardTask: TaskAttributes = {
          ...mockTask,
          difficulty: 'hard',
          description: 'Complete a 2-hour intensive study session with detailed notes',
          targetStat: 'intelligence',
          xpReward: 100,
        };

        const result = await judgeTask({
          task: hardTask,
          playerStats: mockPlayerStats,
          evidence: 'I studied for 2 hours on advanced TypeScript patterns. Created 15 pages of detailed notes covering generics, conditional types, and mapped types. Reviewed 3 complex code examples and wrote my own implementations.',
        });

        expect(['success', 'fail']).toContain(result.verdict);
        
        // If success, XP should be higher for hard difficulty
        if (result.verdict === 'success') {
          expect(result.xp).toBeGreaterThan(0);
          // Hard tasks should generally give more XP than easy/medium
          expect(result.xp).toBeGreaterThanOrEqual(50);
        }

        console.log('Real API Response (hard task):', JSON.stringify(result, null, 2));
      },
      30000
    );
  });
});