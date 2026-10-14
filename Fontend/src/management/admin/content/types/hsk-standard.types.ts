export interface HskStandard {
  id: string;
  code: string;
  name: string;
  version: string;
  description: string;
  active: boolean;
}

export interface HskLevel {
  id: string;
  standardId: string;
  levelCode: string; // e.g. 'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'HSK7_9'
  name: string; // e.g. 'HSK 1', 'HSK 2', 'HSK 7–9'
  orderIndex: number;
  targetVocabularyCount: number;
  targetCharacterCount: number;
  colorToken: string;
  active: boolean;
}

export interface UpdateHskLevelDTO {
  name: string;
  targetVocabularyCount: number;
  targetCharacterCount: number;
  active: boolean;
}
