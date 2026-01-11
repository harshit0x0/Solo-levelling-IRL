import { judgeTask } from '../../src/ai/judge';
import { TaskAttributes } from '../../src/models/Task';
import { StatsAttributes } from '../../src/models/Stats';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

describe('AI Judge Module', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('judgeTask - Success Cases', () => {
    it('should return success verdict with valid AI response', async () => {
      const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                verdict: 'success',
                xp: 50,
                statChanges: {
                  physical: 2,
                },
                comment: 'Task completed satisfactorily.',
              }),
            },
          },
        ],
      });

      mockOpenAI.prototype.chat = {
        completions: {
          create: mockCreate,
        },
      } as any;

      const result = await judgeTask({
        task: mockTask,
        playerStats: mockPlayerStats,
        evidence: 'I completed a 30-minute workout at the gym. Here are photos of me exercising.',
      });

      expect(result.verdict).toBe('success');
      expect(result.xp).toBe(50);
      expect(result.statChanges.physical).toBe(2);
      expect(result.comment).toBe('Task completed satisfactorily.');
    });

    it('should return fail verdict with valid AI response', async () => {
      const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                verdict: 'fail',
                xp: 0,
                statChanges: {},
                comment: 'Evidence insufficient.',
              }),
            },
          },
        ],
      });

      mockOpenAI.prototype.chat = {
        completions: {
          create: mockCreate,
        },
      } as any;

      const result = await judgeTask({
        task: mockTask,
        playerStats: mockPlayerStats,
        evidence: 'I tried to work out but got tired.',
      });

      expect(result.verdict).toBe('fail');
      expect(result.xp).toBe(0);
      expect(Object.keys(result.statChanges).length).toBe(0);
      expect(result.comment).toBe('Evidence insufficient.');
    });
  });

  describe('judgeTask - Validation Failures', () => {
    it('should fallback when AI returns invalid verdict', async () => {
      const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                verdict: 'maybe', // Invalid verdict
                xp: 50,
                statChanges: { physical: 2 },
                comment: 'Test',
              }),
            },
          },
        ],
      });

      mockOpenAI.prototype.chat = {
        completions: {
          create: mockCreate,
        },
      } as any;

      const result = await judgeTask({
        task: mockTask,
        playerStats: mockPlayerStats,
        evidence: 'Test evidence',
      });

      // Should fallback to deterministic response
      expect(result.verdict).toBe('success');
      expect(result.xp).toBe(50); // Default for medium difficulty
      expect(result.comment).toContain('fallback');
    });

    it('should fallback when fail verdict has non-zero XP', async () => {
      const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                verdict: 'fail',
                xp: 10, // Invalid: should be 0 for fail
                statChanges: {},
                comment: 'Test',
              }),
            },
          },
        ],
      });

      mockOpenAI.prototype.chat = {
        completions: {
          create: mockCreate,
        },
      } as any;

      const result = await judgeTask({
        task: mockTask,
        playerStats: mockPlayerStats,
        evidence: 'Test evidence',
      });

      // Should fallback
      expect(result.verdict).toBe('success');
      expect(result.xp).toBe(50);
    });

    it('should fallback when fail verdict has stat changes', async () => {
      const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                verdict: 'fail',
                xp: 0,
                statChanges: { physical: 1 }, // Invalid: should be empty for fail
                comment: 'Test',
              }),
            },
          },
        ],
      });

      mockOpenAI.prototype.chat = {
        completions: {
          create: mockCreate,
        },
      } as any;

      const result = await judgeTask({
        task: mockTask,
        playerStats: mockPlayerStats,
        evidence: 'Test evidence',
      });

      // Should fallback
      expect(result.verdict).toBe('success');
      expect(result.xp).toBe(50);
    });

    it('should fallback when AI returns invalid stat name', async () => {
      const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                verdict: 'success',
                xp: 50,
                statChanges: {
                  invalidStat: 2, // Invalid stat name
                },
                comment: 'Test',
              }),
            },
          },
        ],
      });

      mockOpenAI.prototype.chat = {
        completions: {
          create: mockCreate,
        },
      } as any;

      const result = await judgeTask({
        task: mockTask,
        playerStats: mockPlayerStats,
        evidence: 'Test evidence',
      });

      // Should fallback
      expect(result.verdict).toBe('success');
      expect(result.xp).toBe(50);
    });
  });

  describe('judgeTask - API Error Handling', () => {
    it('should fallback when OpenAI API throws an error', async () => {
      const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));

      mockOpenAI.prototype.chat = {
        completions: {
          create: mockCreate,
        },
      } as any;

      const result = await judgeTask({
        task: mockTask,
        playerStats: mockPlayerStats,
        evidence: 'Test evidence',
      });

      // Should fallback to deterministic response
      expect(result.verdict).toBe('success');
      expect(result.xp).toBe(50); // Default for medium difficulty
      expect(result.statChanges[mockTask.targetStat]).toBe(1);
      expect(result.comment).toContain('fallback');
    });

    it('should fallback when OpenAI returns no content', async () => {
      const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      mockOpenAI.prototype.chat = {
        completions: {
          create: mockCreate,
        },
      } as any;

      const result = await judgeTask({
        task: mockTask,
        playerStats: mockPlayerStats,
        evidence: 'Test evidence',
      });

      // Should fallback
      expect(result.verdict).toBe('success');
      expect(result.xp).toBe(50);
    });

    it('should fallback when JSON parsing fails', async () => {
      const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Invalid JSON response',
            },
          },
        ],
      });

      mockOpenAI.prototype.chat = {
        completions: {
          create: mockCreate,
        },
      } as any;

      const result = await judgeTask({
        task: mockTask,
        playerStats: mockPlayerStats,
        evidence: 'Test evidence',
      });

      // Should fallback
      expect(result.verdict).toBe('success');
      expect(result.xp).toBe(50);
    });
  });

  describe('judgeTask - Deterministic Fallback', () => {
    it('should use correct default XP for different difficulties', async () => {
      const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));

      mockOpenAI.prototype.chat = {
        completions: {
          create: mockCreate,
        },
      } as any;

      const difficulties: Array<{ difficulty: TaskAttributes['difficulty']; expectedXp: number }> = [
        { difficulty: 'easy', expectedXp: 20 },
        { difficulty: 'medium', expectedXp: 50 },
        { difficulty: 'hard', expectedXp: 100 },
        { difficulty: 'extreme', expectedXp: 200 },
      ];

      for (const { difficulty, expectedXp } of difficulties) {
        const result = await judgeTask({
          task: { ...mockTask, difficulty },
          playerStats: mockPlayerStats,
          evidence: 'Test evidence',
        });

        expect(result.xp).toBe(expectedXp);
        expect(result.statChanges[mockTask.targetStat]).toBe(1);
      }
    });
  });
});
