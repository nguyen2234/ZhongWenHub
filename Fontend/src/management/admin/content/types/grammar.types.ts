import type { ContentStatus } from './common-content.types';

export interface GrammarExample {
  zh: string;
  pinyin: string;
  meaningVi: string;
}

export interface GrammarCommonMistake {
  wrong: string;
  right: string;
  note: string;
}

export interface GrammarPoint {
  id: string;
  hskLevelId: string;
  code: string; // e.g. 'HSK1_G01', 'HSK2_G05'
  title: string;
  structureFormula: string;
  explanation: string;
  commonMistake?: GrammarCommonMistake;
  examples: GrammarExample[];
  status: ContentStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface GrammarFilters {
  search: string;
  hskLevelId: string; // 'ALL' or specific levelId
  status: 'ALL' | ContentStatus;
}

export interface UpdateGrammarDTO {
  hskLevelId: string;
  code: string;
  title: string;
  structureFormula: string;
  explanation: string;
  commonMistake?: GrammarCommonMistake;
  examples: GrammarExample[];
  status: ContentStatus;
}
