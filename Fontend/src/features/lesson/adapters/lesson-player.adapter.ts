import type {
  LessonDetailDTO,
  ExerciseDTO,
} from '../types/lesson-content.types';
import type { LessonEditorDraft } from '../../../management/admin/content/types/lesson-editor.types';
import type {
  LessonData,
  VocabularyItem,
  GrammarData,
  DialogueLine,
  ListeningData,
  ExerciseItem,
  QuizQuestionItem,
} from '../types';
import type { SharedExerciseItem } from '../../exercise-engine/types';

/**
 * Exercise DTO -> SharedExerciseItem (React UI engine contract)
 */
export function adaptExerciseDtoToShared(dto: ExerciseDTO): SharedExerciseItem {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    instruction: dto.instruction,
    promptHanzi: dto.promptHanzi,
    promptPinyin: dto.promptPinyin,
    promptVietnamese: dto.promptVietnamese,
    audioUrl: dto.audioUrl,
    options: dto.options,
    correctOptionIndex: dto.correctOptionIndex,
    matchingPairs: dto.matchingPairs,
    sentenceTokens: dto.sentenceTokens,
    correctSentence: dto.correctSentence,
    explanation: dto.explanation,
    xpReward: dto.xpReward,
  };
}

/**
 * Exercise DTO -> Legacy ExerciseItem for ExerciseStep view model
 */
export function adaptExerciseDtoToLegacy(
  dto: ExerciseDTO,
  idFallback: number = 1
): ExerciseItem {
  const parsedId = parseInt(dto.id.replace(/\D/g, ''), 10);
  return {
    id: Number.isFinite(parsedId) && parsedId > 0 ? parsedId : idFallback,
    type: dto.type as ExerciseItem['type'],
    title: dto.title,
    instruction: dto.instruction,
    promptHanzi: dto.promptHanzi,
    promptPinyin: dto.promptPinyin,
    promptVietnamese: dto.promptVietnamese,
    options: dto.options,
    correctOptionIndex: dto.correctOptionIndex,
    matchingPairs: dto.matchingPairs,
    sentenceTokens: dto.sentenceTokens,
    correctSentence: dto.correctSentence,
    explanation: dto.explanation,
  };
}

/**
 * Exercise DTO (section QUIZ) -> QuizQuestionItem for QuizStep view model
 */
export function adaptQuizExerciseToLegacy(
  dto: ExerciseDTO,
  index: number
): QuizQuestionItem {
  return {
    id: index + 1,
    question: dto.promptVietnamese || dto.instruction || dto.title,
    hanzi: dto.promptHanzi,
    pinyin: dto.promptPinyin,
    options: dto.options || [],
    correctIndex: dto.correctOptionIndex ?? 0,
    explanation: dto.explanation,
  };
}

/**
 * LessonEditorDraft (Admin CMS Aggregate) -> LessonDetailDTO (Transport Contract)
 * Bridges authoring draft into the single unified normalized representation.
 */
export function adaptEditorDraftToDetailDTO(
  draft: LessonEditorDraft
): LessonDetailDTO {
  return {
    id: draft.lessonId,
    courseLevelId: 'level-hsk-2',
    unitId: draft.unitId,
    unitNumber: 2,
    lessonNumber: draft.lessonNumber,
    status: draft.status,
    hskLevel: {
      id: 'level-hsk-2',
      code: 'HSK2',
      name: 'HSK 2',
      standardCode: 'HSK_3_0',
      standardVersion: '3.0',
    },
    intro: {
      titleZh: draft.intro.titleZh,
      titleVi: draft.intro.titleVi,
      pinyinTitle: draft.intro.pinyinTitle,
      summary: draft.intro.summary,
      durationMinutes: draft.intro.durationMinutes,
      xpReward: draft.intro.xpReward,
      objectives: draft.intro.objectives,
      contextDialogueSnippet: draft.intro.contextDialogueSnippet
        ? {
            hanzi: draft.intro.contextDialogueSnippet.hanzi,
            pinyin: draft.intro.contextDialogueSnippet.pinyin,
            meaningVi: draft.intro.contextDialogueSnippet.meaningVi,
          }
        : undefined,
    },
    vocabularies: (draft.vocabularies || []).map((lv) => {
      const vocab = lv.vocabulary;
      const firstEx = vocab?.examples?.[0];
      return {
        id: lv.id,
        lessonId: lv.lessonId,
        vocabularyId: lv.vocabularyId,
        simplified: vocab?.simplified || '—',
        traditional: vocab?.traditional,
        pinyin: vocab?.pinyin || '',
        meaningVi: vocab?.meaningVi || '',
        partOfSpeech: vocab?.partOfSpeech,
        audioUrl: vocab?.audioUrl,
        isCoreWord: lv.isCoreWord,
        displayOrder: lv.displayOrder,
        customExampleZh: lv.customExampleZh || firstEx?.zh || '',
        customExamplePinyin: lv.customExamplePinyin || firstEx?.pinyin || '',
        customExampleVi: lv.customExampleVi || firstEx?.meaningVi || '',
      };
    }),
    grammars: (draft.grammars || []).map((lg) => {
      const gp = lg.grammarPoint;
      return {
        id: lg.id,
        lessonId: lg.lessonId,
        grammarPointId: lg.grammarPointId,
        code: gp?.code || 'HSK',
        title: gp?.title || 'Điểm ngữ pháp',
        explanation: lg.lessonNotes || gp?.explanation || '',
        structureFormula: gp?.structureFormula || 'S + V + O',
        displayOrder: lg.displayOrder,
        lessonNotes: lg.lessonNotes,
        examples: (gp?.examples || []).map((ex) => ({
          zh: ex.zh,
          pinyin: ex.pinyin,
          meaningVi: ex.meaningVi,
        })),
        commonMistake: gp?.commonMistake,
        quickPractice: lg.quickPractice,
      };
    }),
    dialogue: {
      id: draft.dialogue?.id || 'diag-default',
      title: draft.dialogue?.title || 'Hội thoại bài học',
      situationZh: draft.dialogue?.situationZh,
      situationVi: draft.dialogue?.situationVi,
      audioUrl: draft.dialogue?.audioUrl,
      lines: (draft.dialogue?.lines || []).map((l) => ({
        id: l.id,
        speakerName: l.speakerName,
        speakerRole: l.speakerRole,
        zh: l.zh,
        pinyin: l.pinyin,
        meaningVi: l.meaningVi,
        audioUrl: l.audioUrl,
        displayOrder: l.displayOrder,
      })),
    },
    listenings: (draft.listenings || []).map((lis) => ({
      id: lis.id,
      title: lis.title,
      audioUrl: lis.audioUrl,
      transcriptZh: lis.transcriptZh,
      transcriptPinyin: lis.transcriptPinyin,
      transcriptVi: lis.transcriptVi,
      prompt: lis.prompt,
      options: lis.options,
      explanation: lis.explanation,
      displayOrder: lis.displayOrder,
    })),
    exercises: (draft.exercises || []).map((e) => ({
      id: e.id,
      lessonId: e.lessonId,
      exerciseId: e.exerciseId,
      section: e.section,
      displayOrder: e.displayOrder,
      points: e.points,
      exercise: {
        id: String(e.exercise.id),
        type: e.exercise.type,
        title: e.exercise.title,
        instruction: e.exercise.instruction,
        promptHanzi: e.exercise.promptHanzi,
        promptPinyin: e.exercise.promptPinyin,
        promptVietnamese: e.exercise.promptVietnamese,
        audioUrl: e.exercise.audioUrl,
        options: e.exercise.options,
        correctOptionIndex: e.exercise.correctOptionIndex,
        matchingPairs: e.exercise.matchingPairs,
        sentenceTokens: e.exercise.sentenceTokens,
        correctSentence: e.exercise.correctSentence,
        explanation: e.exercise.explanation,
        xpReward: e.exercise.xpReward,
      },
    })),
  };
}

/**
 * Normalized LessonDetailDTO -> Student Player Presentation Models (LessonData)
 *
 * NOTE: streakDays is an account/global metric injected from UserLearningSummaryDTO.
 * It is NOT owned by LessonDetailDTO.
 */
export function adaptLessonDetailToPlayer(
  lesson: LessonDetailDTO,
  streakDays: number = 0
): LessonData {
  const numericHsk = parseInt(lesson.hskLevel.code.replace(/\D/g, ''), 10) || 1;
  const parsedLessonId = parseInt(lesson.id.replace(/\D/g, ''), 10) || lesson.lessonNumber;

  // 1. Vocabulary Step Presentation
  const vocabulary: VocabularyItem[] = (lesson.vocabularies || []).map(
    (v, idx) => ({
      id: idx + 1,
      hanzi: v.simplified,
      pinyin: v.pinyin,
      meaning: v.meaningVi,
      exampleHanzi: v.customExampleZh || '',
      examplePinyin: v.customExamplePinyin || '',
      exampleMeaning: v.customExampleVi || '',
      hskLevel: numericHsk,
      partOfSpeech: v.partOfSpeech,
    })
  );

  // 2. Grammar Step Presentation
  const primaryGrammar = lesson.grammars?.[0];
  const grammar: GrammarData = {
    title: primaryGrammar?.title || 'Điểm ngữ pháp trọng tâm',
    subtitle: primaryGrammar?.explanation || 'Cấu trúc bài học',
    patternFormula: primaryGrammar?.structureFormula || 'S + V + O',
    patternBlocks: [
      {
        label: 'Cấu trúc',
        sublabel: primaryGrammar?.code || lesson.hskLevel.code,
        color: 'var(--primary)',
      },
      {
        label: 'Công thức',
        sublabel: primaryGrammar?.structureFormula || '',
        color: 'var(--xp)',
      },
    ],
    explanation:
      primaryGrammar?.lessonNotes ||
      primaryGrammar?.explanation ||
      'Giải thích ngữ pháp chi tiết.',
    examples: (primaryGrammar?.examples || []).map((ex) => ({
      hanzi: ex.zh,
      pinyin: ex.pinyin,
      meaning: ex.meaningVi,
    })),
    commonMistake: {
      wrong:
        primaryGrammar?.commonMistake?.wrong ||
        'Lỗi đặt sai trật tự từ trong câu.',
      right:
        primaryGrammar?.commonMistake?.right ||
        'Trật tự chuẩn xác theo ngữ pháp.',
      note:
        primaryGrammar?.commonMistake?.note ||
        'Chú ý vị trí hư từ và trợ động từ.',
    },
    quickPractice: {
      question:
        primaryGrammar?.quickPractice?.question || '我 ___ 学习汉语。',
      pinyin: primaryGrammar?.quickPractice?.pinyin || 'Wǒ ___ xuéxí Hànyǔ.',
      blankWordTranslation:
        primaryGrammar?.quickPractice?.blankWordTranslation || 'muốn',
      options: primaryGrammar?.quickPractice?.options || [
        '想',
        '是',
        '有',
        '在',
      ],
      correctIndex: primaryGrammar?.quickPractice?.correctIndex ?? 0,
      explanation:
        primaryGrammar?.quickPractice?.explanation ||
        'Dùng trợ động từ để diễn đạt nguyện vọng.',
    },
  };

  // 3. Dialogue Step Presentation
  const dialogueLines: DialogueLine[] = (lesson.dialogue?.lines || []).map(
    (l, idx) => ({
      id: idx + 1,
      speaker: idx % 2 === 0 ? 'A' : 'B',
      speakerName: l.speakerName || `Người ${idx % 2 === 0 ? 'A' : 'B'}`,
      speakerRole: l.speakerRole || '',
      hanzi: l.zh,
      pinyin: l.pinyin,
      meaning: l.meaningVi,
    })
  );

  const dialogue = {
    title: lesson.dialogue?.title || 'Hội thoại bài học',
    situation:
      lesson.dialogue?.situationVi ||
      lesson.dialogue?.situationZh ||
      'Bối cảnh giao tiếp',
    lines: dialogueLines,
  };

  // 4. Listening Step Presentation
  const primaryListening = lesson.listenings?.[0];
  const listening: ListeningData = {
    audioHanzi: primaryListening?.transcriptZh || '',
    audioPinyin: primaryListening?.transcriptPinyin || '',
    audioMeaning: primaryListening?.transcriptVi || '',
    prompt:
      primaryListening?.prompt ||
      'Lắng nghe đoạn ghi âm sau và chọn đáp án chính xác:',
    options: (primaryListening?.options || []).map((o, idx) => ({
      id: o.id || idx + 1,
      text: o.text,
      isCorrect: o.isCorrect,
    })),
    explanation:
      primaryListening?.explanation || 'Giải thích theo nội dung nghe.',
  };

  // 5. Practice Exercises (section: PRACTICE)
  const practiceExercises: ExerciseItem[] = (lesson.exercises || [])
    .filter((e) => e.section === 'PRACTICE')
    .map((e, idx) => adaptExerciseDtoToLegacy(e.exercise, idx + 1));

  // 6. Quiz Questions (section: QUIZ)
  const quizQuestions: QuizQuestionItem[] = (lesson.exercises || [])
    .filter((e) => e.section === 'QUIZ')
    .map((e, idx) => adaptQuizExerciseToLegacy(e.exercise, idx));

  return {
    id: parsedLessonId,
    hskLevel: numericHsk,
    unitNumber: lesson.unitNumber || 1,
    lessonNumber: lesson.lessonNumber,
    hanziTitle: lesson.intro.titleZh,
    pinyinTitle: lesson.intro.pinyinTitle || '',
    vietnameseTitle: lesson.intro.titleVi,
    durationMinutes: lesson.intro.durationMinutes,
    xpReward: lesson.intro.xpReward,
    streakDays,
    objectives: lesson.intro.objectives,
    contextDialogueSnippet: lesson.intro.contextDialogueSnippet
      ? {
          hanzi: lesson.intro.contextDialogueSnippet.hanzi,
          pinyin: lesson.intro.contextDialogueSnippet.pinyin,
          meaning: lesson.intro.contextDialogueSnippet.meaningVi,
        }
      : undefined,
    vocabulary,
    grammar,
    dialogue,
    listening,
    exercises: practiceExercises,
    quiz: quizQuestions,
  };
}

/**
 * LessonEditorDraft -> LessonData (Used by Admin Studio Live Preview)
 */
export function adaptEditorDraftToPlayer(
  draft: LessonEditorDraft,
  streakDays: number = 7
): LessonData {
  const detailDTO = adaptEditorDraftToDetailDTO(draft);
  return adaptLessonDetailToPlayer(detailDTO, streakDays);
}

/**
 * Shared LessonPlayerAdapter
 * Single source of truth for both Admin Live Preview and Student Player mapping.
 */
export class LessonPlayerAdapter {
  static adaptLessonDetail(
    detail: LessonDetailDTO,
    streakDays: number = 0
  ): LessonData {
    return adaptLessonDetailToPlayer(detail, streakDays);
  }

  static adaptEditorDraft(
    draft: LessonEditorDraft,
    streakDays: number = 7
  ): LessonData {
    return adaptEditorDraftToPlayer(draft, streakDays);
  }

  // Admin Studio Live Preview compatibility delegates
  static toIntroStepData(draft: LessonEditorDraft): LessonData {
    return adaptEditorDraftToPlayer(draft);
  }

  static toVocabularyStepData(draft: LessonEditorDraft): VocabularyItem[] {
    return adaptEditorDraftToPlayer(draft).vocabulary;
  }

  static toGrammarStepData(draft: LessonEditorDraft): GrammarData {
    return adaptEditorDraftToPlayer(draft).grammar;
  }

  static toDialogueStepData(draft: LessonEditorDraft): {
    title: string;
    situation: string;
    lines: DialogueLine[];
  } {
    return adaptEditorDraftToPlayer(draft).dialogue;
  }

  static toListeningStepData(draft: LessonEditorDraft): ListeningData {
    return adaptEditorDraftToPlayer(draft).listening;
  }

  static toPracticeStepData(draft: LessonEditorDraft): ExerciseItem[] {
    return adaptEditorDraftToPlayer(draft).exercises;
  }

  static toQuizStepData(draft: LessonEditorDraft): ExerciseItem[] {
    const quizExercises = (draft.exercises || []).filter(
      (e) => e.section === 'QUIZ'
    );
    if (quizExercises.length === 0) {
      return [
        {
          id: 1,
          type: 'multiple-choice',
          title: 'Câu hỏi kiểm tra mẫu',
          instruction: 'Chọn đáp án chính xác:',
          promptVietnamese: 'Chọn câu trả lời đúng cho câu hỏi kiểm tra',
          options: ['Đáp án A', 'Đáp án B', 'Đáp án C'],
          correctOptionIndex: 0,
          explanation: 'Giải thích chi tiết câu hỏi kiểm tra.',
        },
      ];
    }
    return quizExercises.map((qe, idx) => {
      const ex = qe.exercise;
      return {
        id: idx + 1,
        type: ex.type as ExerciseItem['type'],
        title: ex.title,
        instruction: `${ex.instruction} (+${qe.points ?? 10} điểm)`,
        promptHanzi: ex.promptHanzi,
        promptPinyin: ex.promptPinyin,
        promptVietnamese: ex.promptVietnamese,
        options: ex.options,
        correctOptionIndex: ex.correctOptionIndex,
        matchingPairs: ex.matchingPairs,
        sentenceTokens: ex.sentenceTokens,
        correctSentence: ex.correctSentence,
        explanation: ex.explanation,
      };
    });
  }

  static toQuizStepQuestions(draft: LessonEditorDraft): QuizQuestionItem[] {
    return adaptEditorDraftToPlayer(draft).quiz;
  }
}
