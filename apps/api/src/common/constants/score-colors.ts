export const SCORE_COLORS = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
  INSUFFICIENT: 'insufficient',
};

export function getScoreColor(score: number | null): string {
  if (score === null) return SCORE_COLORS.INSUFFICIENT;
  if (score >= 70) return SCORE_COLORS.GREEN;
  if (score >= 50) return SCORE_COLORS.YELLOW;
  return SCORE_COLORS.RED;
}
