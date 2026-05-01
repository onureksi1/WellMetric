import { SurveyQuestion } from '../../survey/entities/survey-question.entity';
import { SurveyQuestionRow } from '../../survey/entities/survey-question-row.entity';

export interface AnswerInput {
  answer_value?: number;
  answer_number?: number;
  answer_option_id?: string;
  answer_row_id?: string;
}

export function calculateScore(question: SurveyQuestion, answer: AnswerInput, row?: SurveyQuestionRow): number | null {
  let score: number | null = null;
  const { answer_value, answer_number, answer_option_id, answer_row_id } = answer;

  switch (question.question_type) {
    case 'likert5':
      if (answer_value !== undefined && answer_value >= 1 && answer_value <= 5) {
        score = ((answer_value - 1) / 4) * 100;
      }
      break;

    case 'likert10':
      if (answer_value !== undefined && answer_value >= 1 && answer_value <= 10) {
        score = ((answer_value - 1) / 9) * 100;
      }
      break;

    case 'star_rating':
      if (answer_value !== undefined && answer_value >= 1 && answer_value <= 5) {
        score = ((answer_value - 1) / 4) * 100;
      }
      break;

    case 'yes_no':
      if (answer_value === 0 || answer_value === 1) {
        score = answer_value === 1 ? 100 : 0;
      }
      break;

    case 'nps':
      if (answer_value !== undefined && answer_value >= 0 && answer_value <= 10) {
        score = (answer_value / 10) * 100;
      }
      break;

    case 'number_input':
      if (answer_number !== undefined && question.number_min !== null && question.number_max !== null) {
        const range = question.number_max - question.number_min;
        if (range > 0) {
          let s = ((answer_number - question.number_min) / range) * 100;
          score = Math.max(0, Math.min(100, s));
        }
      }
      break;

    case 'single_choice':
      if (answer_option_id && question.options) {
        const option = question.options.find(o => o.id === answer_option_id);
        score = option?.value ?? null;
      }
      break;

    case 'matrix':
      if (answer_row_id && row && answer_value !== undefined && answer_value >= 1 && answer_value <= 5) {
        score = ((answer_value - 1) / 4) * 100;
      }
      break;

    case 'multi_choice':
    case 'ranking':
    case 'open_text':
      return null;
  }

  // Reverse score for the question
  if (score !== null && question.is_reversed) {
    score = 100 - score;
  }

  // Reverse score specifically for the matrix row if applicable
  if (score !== null && answer_row_id && row && row.is_reversed) {
    // If both question and row are reversed, it mathematically flips twice, but usually matrix questions 
    // are not reversed at the question level if rows have their own reversal. 
    // Assuming standard implementation:
    score = 100 - score;
  }

  if (score !== null) {
    return Math.round(score * 100) / 100;
  }
  return null;
}

export function calculateTenureMonths(startDate: Date): number {
  return Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
}
