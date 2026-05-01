// ── Survey ────────────────────────────────────────────────────────────────────

export type SurveyType = 'global' | 'company_specific' | 'onboarding' | 'pulse';

export type SurveyFrequency = 'once' | 'weekly' | 'monthly' | 'quarterly';

export interface Survey {
  id: string;
  companyId: string | null; // null = global survey
  titleTr: string;
  titleEn: string | null;
  descriptionTr: string | null;
  descriptionEn: string | null;
  type: SurveyType;
  frequency: SurveyFrequency | null;
  isAnonymous: boolean;
  isActive: boolean;
  throttleDays: number;
  startsAt: string | null; // ISO datetime
  endsAt: string | null; // ISO datetime
  createdBy: string | null; // user id
  createdAt: string; // ISO datetime
}

export type QuestionType =
  | 'scale_1_5'
  | 'scale_1_10'
  | 'nps'
  | 'multiple_choice'
  | 'open_ended';

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  orderIndex: number;
  type: QuestionType;
  textTr: string;
  textEn: string | null;
  isRequired: boolean;
  optionsTr: string[] | null;
  optionsEn: string[] | null;
}
