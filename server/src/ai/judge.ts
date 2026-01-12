import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { TaskAttributes, Difficulty } from '../models/Task';
import { StatsAttributes } from '../models/Stats';
import { validateJudgeResponse, JudgeResponse } from './validation';

// Load environment variables from root
const envPath = path.resolve(__dirname, '../../..', '.env');
dotenv.config({ path: envPath });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const JUDGE_PROMPT = `You are the Solo Leveling System acting as an automated Judge.

Your role is to determine whether a real-life task was completed satisfactorily based ONLY on the provided evidence.

Judging Principles:
- Be strict and objective.
- Do NOT reward intentions, excuses, effort, or partial completion.
- Consistency matters more than intensity.
- For text-only evidence, accept success ONLY if the evidence is a bit specific or a bit quantified. Otherwise, verdict = "fail".
- If evidence is very vague, or does not meet the task difficulty by medium margin, the verdict MUST be "fail"
- Do NOT be motivational, empathetic, or encouraging.
- Do NOT explain rules.
- Do NOT give advice.

Decision Procedure (follow in order):
1. Check if the evidence clearly proves the task was completed.
2. Check if the evidence quality matches the stated task difficulty.
3. If either check fails, verdict = "fail".
4. Only if BOTH checks pass, verdict = "success".

XP and Stat Rules:
- If verdict = "fail":
  - xp MUST be 0
  - statChanges MUST be an empty object {}
- If verdict = "success":
  - xp MUST be reasonable for the task difficulty (low difficulty = low xp, high difficulty = higher xp, but never extreme)
  - statChanges MUST be small, realistic, and directly related to the target stat
  - target stat MUST be one of: physical, intelligence, discipline, charisma, confidence, creativity
- When uncertain, default to "fail".

Output Rules (CRITICAL):
- Output MUST be a single valid JSON object.
- Output NOTHING except JSON.
- No explanations, no markdown, no comments, no extra text.
- verdict MUST be exactly "success" or "fail" (lowercase).
- If verdict is "fail", xp MUST be 0.

JSON Schema (must match exactly):
{
  "verdict": "success" or "fail",
  "xp": number,
  "statChanges": { "statName": number },
  "comment": string
}

The comment must be short, neutral, and system-like.

Judge the task now.`
;


// Default XP mapping for fallback (TODO: Enhance with more sophisticated logic)
const DEFAULT_XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 20,
  medium: 50,
  hard: 100,
  extreme: 200,
};

export interface JudgeTaskParams {
  task: TaskAttributes;
  playerStats: StatsAttributes;
  evidence: string;
}

/**
 * Judges a task completion using AI, with deterministic fallback on failure.
 * 
 * @param params - Task metadata, player stats, and user evidence
 * @returns JudgeResponse with verdict, XP, stat changes, and comment
 */
export async function judgeTask(params: JudgeTaskParams): Promise<JudgeResponse> {
  const { task, playerStats, evidence } = params;

  try {
    // Build the prompt with task and player information
    const taskInfo = `
Task Type: ${task.type}
Difficulty: ${task.difficulty}
Description: ${task.description}
Target Stat: ${task.targetStat}
XP Reward: ${task.xpReward}
Deadline: ${ typeof task.deadline == "string" ? task.deadline : task.deadline.toISOString()}
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

    const evidenceInfo = `
User Evidence:
${evidence}
`;
    console.log(evidence)

    // Call OpenAI API
    let completion: OpenAI.Chat.Completions.ChatCompletion;
    try {
    completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: JUDGE_PROMPT,
        },
        {
          role: 'user',
          content: `${taskInfo}\n${statsInfo}\n${evidenceInfo}`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent, strict judgments
      response_format: { type: 'json_object' },
    });
    } catch (error) {
      throw new Error(`Failed to call OpenAI API: ${error}`);
    }

    // Log the completion
    console.log(completion.choices[0]?.message?.content);

    const responseContent = completion.choices[0]?.message?.content;
    console.log(responseContent);
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
    const validatedResponse = validateJudgeResponse(parsedResponse);
    return validatedResponse;
  } catch (error) {
    // Fallback to deterministic rules
    console.error('AI Judge failed, using deterministic fallback:', error);
    return getDeterministicFallback(task);
  }
}

/**
 * Deterministic fallback when AI fails.
 * TODO: Enhance with more sophisticated logic (e.g., evidence analysis, stat-based adjustments)
 */
function getDeterministicFallback(task: TaskAttributes): JudgeResponse {
  const defaultXp = DEFAULT_XP_BY_DIFFICULTY[task.difficulty];

  return {
    verdict: 'success',
    xp: defaultXp,
    statChanges: {
      [task.targetStat]: 1, // Small stat increase
    },
    comment: 'Task evaluated using system fallback.',
  };
}
