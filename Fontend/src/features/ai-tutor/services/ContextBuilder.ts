import type { AITutorContext, AITutorSource } from '../types';

export class ContextBuilder {
  /**
   * Builds an isolated, lean context payload for the current learner step.
   * Strips all heavy application state, user history, or full database tables.
   */
  static build(
    source: AITutorSource,
    data: Partial<AITutorContext> = {}
  ): AITutorContext {
    const baseContext: AITutorContext = {
      source,
      languagePreference: 'Vietnamese',
      hskLevel: data.hskLevel || 2,
    };

    if (data.lessonId) baseContext.lessonId = data.lessonId;
    if (data.lessonTitle) baseContext.lessonTitle = data.lessonTitle;
    if (data.currentStep) baseContext.currentStep = data.currentStep;
    if (data.grammarPoints && data.grammarPoints.length > 0) {
      baseContext.grammarPoints = data.grammarPoints.slice(0, 3);
    }
    if (data.vocabularyIds && data.vocabularyIds.length > 0) {
      baseContext.vocabularyIds = data.vocabularyIds.slice(0, 5);
    }
    if (data.vocabularyWord) {
      baseContext.vocabularyWord = {
        hanzi: data.vocabularyWord.hanzi,
        pinyin: data.vocabularyWord.pinyin,
        meaning: data.vocabularyWord.meaning,
      };
    }
    if (data.exerciseContext) {
      baseContext.exerciseContext = {
        exerciseId: data.exerciseContext.exerciseId,
        question: data.exerciseContext.question,
        userAnswer: data.exerciseContext.userAnswer,
        correctAnswer: data.exerciseContext.correctAnswer,
        explanation: data.exerciseContext.explanation,
        promptHanzi: data.exerciseContext.promptHanzi,
        promptPinyin: data.exerciseContext.promptPinyin,
        promptVietnamese: data.exerciseContext.promptVietnamese,
      };
    }
    if (data.weaknesses && data.weaknesses.length > 0) {
      baseContext.weaknesses = data.weaknesses.slice(0, 3);
    }

    return baseContext;
  }

  /**
   * Helper to format a friendly, non-technical context label for header
   */
  static getReadableHeader(context: AITutorContext | null): {
    title: string;
    sublabel: string;
    tag?: string;
  } {
    if (!context || context.source === 'general') {
      return {
        title: 'Trợ giảng tiếng Trung',
        sublabel: 'Chế độ hỗ trợ tự do · Hỏi bất kỳ điều gì',
        tag: 'Gia sư toàn diện',
      };
    }

    if (context.source === 'practice' || context.source === 'mistake') {
      const ex = context.exerciseContext;
      return {
        title: 'Giải đáp bài tập & lỗi sai',
        sublabel: ex ? `Trọng tâm: "${ex.question}"` : 'Củng cố điểm yếu luyện tập',
        tag: context.grammarPoints?.[0] || 'Phân tích lỗi sai',
      };
    }

    if (context.source === 'lesson') {
      return {
        title: context.lessonTitle || 'Bài 8: Bạn muốn uống gì?',
        sublabel: `HSK ${context.hskLevel || 2} · Bước: ${context.currentStep || 'Học tập'}`,
        tag: context.grammarPoints?.[0] || 'Ngữ pháp bài học',
      };
    }

    if (context.source === 'vocabulary') {
      return {
        title: context.vocabularyWord ? `Từ vựng: ${context.vocabularyWord.hanzi} (${context.vocabularyWord.pinyin})` : 'Kho từ vựng',
        sublabel: context.vocabularyWord ? `Nghĩa: "${context.vocabularyWord.meaning}"` : 'Phân tích & mở rộng từ vựng',
        tag: `HSK ${context.hskLevel || 2}`,
      };
    }

    return {
      title: 'Trợ giảng tiếng Trung',
      sublabel: 'Đồng hành theo tiến độ cá nhân',
    };
  }

  /**
   * Extract quick action chips tailored to current context
   */
  static getQuickActions(context: AITutorContext | null): string[] {
    if (!context || context.source === 'general') {
      return [
        'Hỏi ngữ pháp HSK 2',
        'Sửa giúp tôi 1 câu',
        'Phân biệt 想 và 要',
        'Luyện hội thoại quán cà phê',
      ];
    }

    if (context.source === 'practice' || context.source === 'mistake') {
      return [
        'Tại sao tôi chọn sai?',
        'Giải thích cặn kẽ đáp án đúng',
        'Cho tôi 1 câu tương tự để thử',
        'Quy tắc ngữ pháp liên quan là gì?',
      ];
    }

    if (context.source === 'lesson') {
      return [
        'Giải thích cấu trúc này giúp em',
        'Cho thêm 3 ví dụ thực tế',
        'Kiểm tra xem em hiểu chưa',
        'Luyện hội thoại về chủ đề này',
      ];
    }

    if (context.source === 'vocabulary') {
      return [
        'Giải thích chi tiết từ này',
        'Cho ví dụ đặt câu thông dụng',
        'Phân biệt với từ gần nghĩa',
        'Tạo mini quiz cho từ này',
      ];
    }

    return [
      'Hôm nay tôi nên học gì?',
      'Tổng kết ngữ pháp đã học',
      'Luyện hội thoại ngắn',
    ];
  }
}
