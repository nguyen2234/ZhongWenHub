export interface GrammarExample {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

export interface GrammarPracticeExercise {
  prompt: string;
  scrambledWords?: string[];
  standardAnswer: string;
  acceptableAnswers?: string[];
  hint?: string;
  explanation: string;
}

export interface GrammarPoint {
  id: string;
  title: string;
  pinyinTitle: string;
  hskLevel: number; // 1 to 6
  category: 'cơ bản' | 'câu chữ' | 'trợ từ' | 'liên từ' | 'bổ ngữ' | 'phó từ';
  structure: string;
  explanation: string;
  examples: GrammarExample[];
  usageNote?: string;
  difficulty: 'Dễ' | 'Trung bình' | 'Khá';
  practice?: GrammarPracticeExercise;
}
