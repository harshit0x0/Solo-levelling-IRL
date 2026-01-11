import { StatType } from '../models/Task';

export interface JudgeResponse {
  verdict: 'success' | 'fail';
  xp: number;
  statChanges: Record<string, number>;
  comment: string;
}

const VALID_STAT_NAMES: StatType[] = [
  'physical',
  'intelligence',
  'discipline',
  'charisma',
  'confidence',
  'creativity',
];

export function validateJudgeResponse(data: unknown): JudgeResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Judge response must be an object');
  }

  const response = data as Record<string, unknown>;

  // Validate verdict
  if (!('verdict' in response)) {
    throw new Error('Judge response must include "verdict" field');
  }
  if (response.verdict !== 'success' && response.verdict !== 'fail') {
    throw new Error('Verdict must be "success" or "fail"');
  }

  const verdict = response.verdict as 'success' | 'fail';

  // Validate xp
  if (!('xp' in response)) {
    throw new Error('Judge response must include "xp" field');
  }
  if (typeof response.xp !== 'number' || response.xp < 0 || !Number.isInteger(response.xp)) {
    throw new Error('XP must be a non-negative integer');
  }

  const xp = response.xp;

  // Validate statChanges
  if (!('statChanges' in response)) {
    throw new Error('Judge response must include "statChanges" field');
  }
  if (typeof response.statChanges !== 'object' || response.statChanges === null || Array.isArray(response.statChanges)) {
    throw new Error('statChanges must be an object');
  }

  const statChanges = response.statChanges as Record<string, unknown>;

  // Validate fail conditions
  if (verdict === 'fail') {
    if (xp !== 0) {
      throw new Error('If verdict is "fail", xp must be 0');
    }
    if (Object.keys(statChanges).length > 0) {
      throw new Error('If verdict is "fail", statChanges must be empty');
    }
  }

  // Validate success conditions
  if (verdict === 'success') {
    if (xp === 0) {
      throw new Error('If verdict is "success", xp must be greater than 0');
    }

    // Validate stat names and values
    for (const [statName, statValue] of Object.entries(statChanges)) {
      if (!VALID_STAT_NAMES.includes(statName as StatType)) {
        throw new Error(`Invalid stat name: ${statName}. Must be one of: ${VALID_STAT_NAMES.join(', ')}`);
      }
      if (typeof statValue !== 'number' || !Number.isInteger(statValue)) {
        throw new Error(`Stat change for ${statName} must be an integer`);
      }
    }
  }

  // Validate comment
  if (!('comment' in response)) {
    throw new Error('Judge response must include "comment" field');
  }
  if (typeof response.comment !== 'string') {
    throw new Error('Comment must be a string');
  }

  const comment = response.comment;

  return {
    verdict,
    xp,
    statChanges: statChanges as Record<string, number>,
    comment,
  };
}
