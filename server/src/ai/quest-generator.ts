import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { TaskType, Difficulty, StatType } from '../models/Task';
import { StatsAttributes } from '../models/Stats';
import { Rank } from '../models/Player';

// Load environment variables from root
const envPath = path.resolve(__dirname, '../../..', '.env');
dotenv.config({ path: envPath });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const QUEST_GENERATOR_PROMPT = `You are the Solo Leveling System acting as a Quest Generator.

Your role is to suggest a task/quest for a player based on their current stats, recent failures, rank, and target stat.

Generation Principles:
- Generate tasks that are realistic, actionable, and appropriate for the player's rank and stat level.
- Tasks should be challenging but achievable.
- Daily tasks should be achievable within one day only.
- Consider recent failures - if player has many failures, suggest slightly easier tasks.
- Bias toward the target stat (weakest stat) but make it natural and engaging.
- Do NOT be motivational or encouraging - be neutral and system-like.
- Do NOT explain rules or give advice.

Input Context:
- Player stats (current values 0-100)
- Recent failures (count and types)
- Player rank (E|D|C|B|A|S|SS)
- Target stat (must be targeted)
- Desired difficulty level

Output Rules (CRITICAL):
- Output MUST be a single valid JSON object.
- Output NOTHING except JSON.
- No explanations, no markdown, no comments, no extra text.

JSON Schema (must match exactly):
{
  "type": "daily" | "weekly" | "dungeon" | "boss",
  "description": "string (clear, specific task description)",
  "difficulty": "easy" | "medium" | "hard" | "extreme",
  "targetStat": "physical" | "intelligence" | "discipline" | "charisma" | "confidence" | "creativity"
}

The description must be:
- Clear and specific
- Actionable (player knows exactly what to do)
- Appropriate for the difficulty level
- Related to the target stat

Generate the quest now.`;

export interface QuestSuggestion {
  type: TaskType;
  description: string;
  difficulty: Difficulty;
  targetStat: StatType;
}

export interface QuestGeneratorParams {
  playerStats: StatsAttributes;
  recentFailures: number;
  rank: Rank;
  weakestStat: StatType;
  desiredDifficulty: Difficulty;
}

/**
 * Generates a quest suggestion using AI
 * 
 * @param params - Player context for quest generation
 * @returns QuestSuggestion with type, description, difficulty, and targetStat
 */
export async function generateQuestSuggestion(params: QuestGeneratorParams): Promise<QuestSuggestion> {
  const { playerStats, recentFailures, rank, weakestStat, desiredDifficulty } = params;

  try {
    const statsInfo = `
Player Stats:
- Physical: ${playerStats.physical}
- Intelligence: ${playerStats.intelligence}
- Discipline: ${playerStats.discipline}
- Charisma: ${playerStats.charisma}
- Confidence: ${playerStats.confidence}
- Creativity: ${playerStats.creativity}
`;

    const contextInfo = `
Player Context:
- Rank: ${rank}
- Recent Failures (last 21 days): ${recentFailures}
- Target Stat: ${weakestStat}
- Desired Difficulty: ${desiredDifficulty}
`;

    // Call OpenAI API
    let completion: OpenAI.Chat.Completions.ChatCompletion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: QUEST_GENERATOR_PROMPT,
          },
          {
            role: 'user',
            content: `${statsInfo}\n${contextInfo}\n\nGenerate a quest targeting ${weakestStat} stat with ${desiredDifficulty} difficulty.`,
          },
        ],
        temperature: 0.7, // Slightly higher for creativity
        response_format: { type: 'json_object' },
      });
    } catch (error) {
      throw new Error(`Failed to call OpenAI API: ${error}`);
    }

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    // Parse JSON response
    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      throw new Error(`Failed to parse JSON response: ${parseError}`);
    }

    // Validate response structure
    const validatedResponse = validateQuestSuggestion(parsedResponse, weakestStat);
    return validatedResponse;
  } catch (error) {
    // Fallback to deterministic rules
    console.error('Quest Generator AI failed, using deterministic fallback:', error);
    return getDeterministicQuestFallback(weakestStat, desiredDifficulty);
  }
}

/**
 * Validates quest suggestion response
 */
function validateQuestSuggestion(data: unknown, requiredTargetStat: StatType): QuestSuggestion {
  if (!data || typeof data !== 'object') {
    throw new Error('Quest suggestion must be an object');
  }

  const response = data as Record<string, unknown>;

  // Validate type
  if (!('type' in response) || !['daily', 'weekly', 'dungeon', 'boss'].includes(response.type as string)) {
    throw new Error('Invalid or missing type field');
  }

  // Validate description
  if (!('description' in response) || typeof response.description !== 'string' || response.description.trim().length === 0) {
    throw new Error('Invalid or missing description field');
  }

  // Validate difficulty
  if (!('difficulty' in response) || !['easy', 'medium', 'hard', 'extreme'].includes(response.difficulty as string)) {
    throw new Error('Invalid or missing difficulty field');
  }

  // Validate targetStat
  const validStats: StatType[] = ['physical', 'intelligence', 'discipline', 'charisma', 'confidence', 'creativity'];
  if (!('targetStat' in response) || !validStats.includes(response.targetStat as StatType)) {
    throw new Error('Invalid or missing targetStat field');
  }

  // Ensure targetStat matches required stat (weakness targeting is mandatory)
  const targetStat = response.targetStat as StatType;
  if (targetStat !== requiredTargetStat) {
    console.warn(`AI suggested targetStat ${targetStat} but required ${requiredTargetStat}, overriding`);
  }

  return {
    type: response.type as TaskType,
    description: response.description as string,
    difficulty: response.difficulty as Difficulty,
    targetStat: requiredTargetStat, // Override to ensure weakness targeting
  };
}

/**
 * Deterministic fallback when AI fails
 */
function getDeterministicQuestFallback(targetStat: StatType, difficulty: Difficulty): QuestSuggestion {
  const fallbackDescriptions: Record<StatType, Record<Difficulty, string>> = {
    physical: {
      easy: 'Complete a 20-minute workout routine',
      medium: 'Complete a 45-minute workout with strength training',
      hard: 'Complete a 90-minute intensive workout session',
      extreme: 'Complete a 2-hour cross-training session',
    },
    intelligence: {
      easy: 'Read for 30 minutes on a new topic',
      medium: 'Read and take notes on a challenging chapter',
      hard: 'Study for 2 hours and create detailed notes',
      extreme: 'Complete an intensive 4-hour study session',
    },
    discipline: {
      easy: 'Maintain a consistent routine for 1 hour',
      medium: 'Follow a strict schedule for 3 hours',
      hard: 'Maintain discipline for 6 hours without deviation',
      extreme: 'Complete a full day of disciplined routine',
    },
    charisma: {
      easy: 'Have a meaningful conversation with someone',
      medium: 'Practice public speaking for 30 minutes',
      hard: 'Lead a group discussion or presentation',
      extreme: 'Organize and host a social event',
    },
    confidence: {
      easy: 'Try one new thing outside your comfort zone',
      medium: 'Take initiative on a challenging task',
      hard: 'Speak up in a high-stakes situation',
      extreme: 'Take on a leadership role in a difficult situation',
    },
    creativity: {
      easy: 'Create something new - art, writing, or code',
      medium: 'Complete a creative project with multiple components',
      hard: 'Create and refine a complex creative work',
      extreme: 'Complete a major creative project from concept to finish',
    },
  };

  return {
    type: 'daily',
    description: fallbackDescriptions[targetStat][difficulty],
    difficulty,
    targetStat,
  };
}
