export interface ExamQuestion {
  id: string;
  section: 'Nghe hiểu' | 'Đọc hiểu' | 'Viết';
  questionNumber: number;
  prompt: string;
  pinyin?: string;
  audioText?: string;
  options: string[];
  correctOptionIndex: number;
}

export interface HSKExam {
  id: string;
  title: string;
  hskLevel: number;
  durationMinutes: number;
  totalQuestions: number;
  passingScore: number;
  sections: {
    name: 'Nghe hiểu' | 'Đọc hiểu' | 'Viết';
    questionCount: number;
    durationMinutes: number;
  }[];
  questions: ExamQuestion[];
}

export interface ExamAttemptResult {
  examId: string;
  score: number;
  maxScore: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  answers: Record<string, number>;
}
