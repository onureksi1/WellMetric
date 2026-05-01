import { SurveyQuestion } from '@/types/survey.types';

export function buildAnswerItem(question: SurveyQuestion, value: any): any {
  const base = { question_id: question.id };

  if (value === undefined || value === null || value === '') {
    return base; // Return empty base if no answer (validation will catch it later if required)
  }

  switch (question.question_type) {
    case 'likert5':
    case 'likert10':
    case 'star_rating':
    case 'yes_no':
    case 'nps':
      return { ...base, answer_value: value };

    case 'number_input':
      return { ...base, answer_number: value };

    case 'open_text':
      return { ...base, answer_text: value };

    case 'single_choice':
      return { ...base, answer_option_id: value };

    case 'multi_choice':
      return { ...base, answer_option_ids: Array.isArray(value) ? value : [value] };

    case 'ranking':
      return { ...base, answer_ranking: Array.isArray(value) ? value : [value] };

    case 'matrix':
      // value should be an array of { rowId, val }
      if (Array.isArray(value)) {
        return {
          ...base,
          answer_matrix: value.map((item: any) => ({
            row_id: item.rowId,
            value: item.val
          }))
        };
      }
      return base;

    default:
      return base;
  }
}
