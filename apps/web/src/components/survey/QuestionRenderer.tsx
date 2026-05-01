'use client';

import React from 'react';
import { SurveyQuestion } from '@/types/survey.types';

import { LikertQuestion } from './questions/LikertQuestion';
import { StarRatingQuestion } from './questions/StarRatingQuestion';
import { YesNoQuestion } from './questions/YesNoQuestion';
import { NpsQuestion } from './questions/NpsQuestion';
import { NumberInputQuestion } from './questions/NumberInputQuestion';
import { SingleChoiceQuestion } from './questions/SingleChoiceQuestion';
import { MultiChoiceQuestion } from './questions/MultiChoiceQuestion';
import { RankingQuestion } from './questions/RankingQuestion';
import { MatrixQuestion } from './questions/MatrixQuestion';
import { OpenTextQuestion } from './questions/OpenTextQuestion';

interface QuestionRendererProps {
  question: SurveyQuestion;
  value: any;
  onChange: (val: any) => void;
  language: 'tr' | 'en';
  disabled?: boolean;
}

export function QuestionRenderer({ question, value, onChange, language, disabled }: QuestionRendererProps) {
  switch (question.question_type) {
    case 'likert5':
      return <LikertQuestion max={5} value={value} onChange={onChange} disabled={disabled} />;
    case 'likert10':
      return <LikertQuestion max={10} value={value} onChange={onChange} disabled={disabled} />;
    case 'star_rating':
      return <StarRatingQuestion value={value} onChange={onChange} disabled={disabled} />;
    case 'yes_no':
      return <YesNoQuestion value={value} onChange={onChange} disabled={disabled} />;
    case 'nps':
      return <NpsQuestion value={value} onChange={onChange} disabled={disabled} />;
    case 'number_input':
      return <NumberInputQuestion question={question} value={value} onChange={onChange} disabled={disabled} />;
    case 'single_choice':
      return <SingleChoiceQuestion question={question} value={value} onChange={onChange} language={language} disabled={disabled} />;
    case 'multi_choice':
      return <MultiChoiceQuestion question={question} value={value} onChange={onChange} language={language} disabled={disabled} />;
    case 'ranking':
      return <RankingQuestion question={question} value={value} onChange={onChange} language={language} disabled={disabled} />;
    case 'matrix':
      return <MatrixQuestion question={question} value={value} onChange={onChange} language={language} disabled={disabled} />;
    case 'open_text':
      return <OpenTextQuestion value={value} onChange={onChange} language={language} disabled={disabled} />;
    default:
      return <div className="p-4 text-red-500">Unsupported question type: {question.question_type}</div>;
  }
}
