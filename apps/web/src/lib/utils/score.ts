import { SCORE_LEVELS } from '../constants/dimensions';

export const getScoreLevel = (score: number | null) => {
  if (score === null) return null;
  if (score >= SCORE_LEVELS.GOOD.min) return SCORE_LEVELS.GOOD;
  if (score >= SCORE_LEVELS.WARNING.min) return SCORE_LEVELS.WARNING;
  return SCORE_LEVELS.CRITICAL;
};

export const getScoreColor = (score: number | null) => {
  const level = getScoreLevel(score);
  return level ? level.color : 'text-gray-400';
};

export const formatScore = (score: number | null) => {
  if (score === null) return '--';
  return Math.round(score).toString();
};
