export interface AnswerWithWeight {
  score: number;
  weight: number;
}

export interface DimensionScore {
  dimension: string;
  score: number;
}

export class ScoreCalculator {
  static calculateQuestionScore(
    value: number,
    maxValue: number = 5,
    isReversed: boolean = false,
  ): number {
    if (maxValue <= 1) return 0;
    let normalize = ((value - 1) / (maxValue - 1)) * 100;
    normalize = Math.max(0, Math.min(100, normalize));
    return isReversed ? 100 - normalize : normalize;
  }

  static calculateDimensionScore(answers: AnswerWithWeight[]): number {
    if (answers.length === 0) return 0;
    let totalWeightedScore = 0;
    let totalWeight = 0;
    for (const answer of answers) {
      totalWeightedScore += answer.score * answer.weight;
      totalWeight += answer.weight;
    }
    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  }

  static calculateOverallScore(
    dimensions: DimensionScore[],
    weights: Record<string, number>,
  ): number {
    if (dimensions.length === 0) return 0;
    let totalWeightedScore = 0;
    let totalWeight = 0;
    for (const dim of dimensions) {
      const weight = weights[dim.dimension.toLowerCase()] || 1.0;
      totalWeightedScore += dim.score * weight;
      totalWeight += weight;
    }
    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  }
}
