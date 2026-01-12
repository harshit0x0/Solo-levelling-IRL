import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { TaskAttributes } from '../models/Task';
import { StatsAttributes } from '../models/Stats';

// Load environment variables from root
const envPath = path.resolve(__dirname, '../../..', '.env');
dotenv.config({ path: envPath });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const NARRATOR_PROMPT = `You are the Solo Leveling System acting as an automated Narrator.

Your role is to generate short, neutral, system-like narrative feedback about task completion or failure.

Narrative Principles:
- Be strict and objective, not motivational.
- Keep it brief (1-2 sentences maximum).
- Use a neutral, system-like tone.
- Do NOT include stat changes, XP amounts, or game mechanics.
- Do NOT be encouraging, empathetic, or motivational.
- Do NOT explain rules or give advice.
- Focus on the outcome, not the process.

Output Rules (CRITICAL):
- Output MUST be a single valid JSON object.
- Output NOTHING except JSON.
- No explanations, no markdown, no comments, no extra text.

JSON Schema (must match exactly):
{
  "narrative": "string (short narrative text, 1-2 sentences)"
}

Generate the narrative now.`;

export interface NarratorParams {
  task: TaskAttributes;
  playerStats: StatsAttributes;
  verdict: 'success' | 'fail';
  context?: string;
}

/**
 * Generates narrative feedback using AI
 * This has NO stat or XP impact - purely narrative
 * 
 * @param params - Context for narrative generation
 * @returns Narrative text string
 */
export async function generateNarrative(params: NarratorParams): Promise<string> {
  const { task, playerStats, verdict, context } = params;

  try {
    const taskInfo = `
Task: ${task.description}
Difficulty: ${task.difficulty}
Target Stat: ${task.targetStat}
Verdict: ${verdict}
`;

    const statsInfo = `
Player Stats:
- Physical: ${playerStats.physical}
- Intelligence: ${playerStats.intelligence}
- Discipline: ${playerStats.discipline}
- Charisma: ${playerStats.charisma}
- Confidence: ${playerStats.confidence}
- Creativity: ${playerStats.creativity}
`;

    const contextInfo = context ? `\nContext: ${context}` : '';

    // Call OpenAI API
    let completion: OpenAI.Chat.Completions.ChatCompletion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: NARRATOR_PROMPT,
          },
          {
            role: 'user',
            content: `${taskInfo}\n${statsInfo}${contextInfo}\n\nGenerate a brief narrative for this ${verdict} verdict.`,
          },
        ],
        temperature: 0.5, // Moderate creativity
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
    const validatedResponse = validateNarrativeResponse(parsedResponse);
    return validatedResponse;
  } catch (error) {
    // Fallback to simple deterministic message
    console.error('Narrator AI failed, using deterministic fallback:', error);
    return getDeterministicNarrativeFallback(verdict);
  }
}

/**
 * Validates narrative response
 */
function validateNarrativeResponse(data: unknown): string {
  if (!data || typeof data !== 'object') {
    throw new Error('Narrative response must be an object');
  }

  const response = data as Record<string, unknown>;

  if (!('narrative' in response) || typeof response.narrative !== 'string' || response.narrative.trim().length === 0) {
    throw new Error('Invalid or missing narrative field');
  }

  return response.narrative as string;
}

/**
 * Deterministic fallback when AI fails
 */
function getDeterministicNarrativeFallback(verdict: 'success' | 'fail'): string {
  if (verdict === 'success') {
    return 'Task completed.';
  }
  return 'Task requirements not met.';
}
