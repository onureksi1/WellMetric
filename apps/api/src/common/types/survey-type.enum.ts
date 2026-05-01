export enum SurveyType {
  GLOBAL = 'global',
  CUSTOM = 'custom',
  PULSE = 'pulse',
}

export enum SurveyFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

export enum QuestionType {
  LIKERT5 = 'likert5',
  OPEN_TEXT = 'open_text',
  YES_NO = 'yes_no',
  MULTIPLE_CHOICE = 'multiple_choice',
}

export enum AssignmentStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  DRAFT = 'draft',
}

export enum ActionStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
