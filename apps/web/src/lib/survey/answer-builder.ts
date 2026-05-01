import { SurveyQuestion } from '@/types/survey.types';

export function buildSubmitDto(
  answers: Record<string, any>,
  questions: SurveyQuestion[]
) {
  const formattedAnswers = questions.map((question) => {
    const value = answers[question.id];
    const base = { question_id: question.id };

    if (value === undefined || value === null) {
        return base;
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
        return { ...base, answer_option_ids: Array.isArray(value) ? value : [] };

      case 'ranking':
        return { ...base, answer_ranking: Array.isArray(value) ? value : [] };

      case 'matrix':
        // matrix value is { [rowId]: value }
        return {
          ...base,
          answer_matrix: Object.entries(value || {}).map(([row_id, val]) => ({
            row_id,
            value: val,
          })),
        };

      default:
        return base;
    }
  });

  return {
    answers: formattedAnswers.filter((a) => Object.keys(a).length > 1), // Only send answered
  };
}
