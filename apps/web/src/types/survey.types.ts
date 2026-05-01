export type QuestionType = 
  | 'likert5' 
  | 'likert10' 
  | 'star_rating' 
  | 'yes_no' 
  | 'nps' 
  | 'number_input' 
  | 'single_choice' 
  | 'multi_choice' 
  | 'ranking' 
  | 'matrix' 
  | 'open_text';

export type DimensionType = 'physical' | 'mental' | 'social' | 'financial' | 'work' | 'overall';

export interface QuestionOption {
  id: string;
  label_tr: string;
  label_en: string | null;
  value: number;
  order_index: number;
}

export interface QuestionRow {
  id: string;
  label_tr: string;
  label_en: string | null;
  dimension: DimensionType | null;
  is_reversed: boolean;
  weight: number;
  order_index: number;
}

export interface SurveyQuestion {
  id: string;
  dimension: DimensionType;
  question_text_tr: string;
  question_text_en: string | null;
  question_type: QuestionType;
  is_reversed: boolean;
  weight: number;
  order_index: number;
  is_required: boolean;
  number_min: number | null;
  number_max: number | null;
  number_step: number | null;
  matrix_label_tr: string | null;
  matrix_label_en: string | null;
  options: QuestionOption[];
  rows: QuestionRow[];
}

export interface SurveyToken {
  id: string;
  token: string;
  survey_id: string;
  company_id: string;
  department_id: string | null;
  expires_at: string | null;
  is_used: boolean;
  language: 'tr' | 'en';
}

export interface SurveyTokenResponse {
  token: SurveyToken;
  survey: {
    id: string;
    title_tr: string;
    title_en: string | null;
    is_anonymous: boolean;
    questions: SurveyQuestion[];
  };
  company: {
    name: string;
    logo_url: string | null;
  };
}
