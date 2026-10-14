import type { LessonDetailDTO } from '../types/lesson-content.types';
import { MOCK_LESSON_8_DRAFT } from '../../../management/admin/content/data/mockLessonEditorData';
import { adaptEditorDraftToDetailDTO } from '../adapters/lesson-player.adapter';
import { lesson8Data } from '../data/lesson8';

/**
 * Service for fetching normalized lesson content (LessonDetailDTO).
 * Simulates future Spring Boot REST API: GET /api/v1/lessons/{lessonId}
 */
class LessonContentService {
  /**
   * Fetch normalized lesson details by ID.
   * Returns normalized LessonDetailDTO derived from CMS Authoring Draft,
   * with fallback to legacy lesson8Data if needed.
   */
  async getLessonDetail(lessonId: string = 'les-8'): Promise<LessonDetailDTO> {
    // In mock mode, resolve Lesson 8 draft or fallback
    try {
      if (lessonId === 'les-8' || lessonId === '8' || !lessonId) {
        return adaptEditorDraftToDetailDTO(MOCK_LESSON_8_DRAFT);
      }

      // If other ID requested, return Lesson 8 as default demonstration content
      return adaptEditorDraftToDetailDTO(MOCK_LESSON_8_DRAFT);
    } catch (error) {
      console.warn('[LessonContentService] Error resolving draft, falling back to legacy bridge:', error);
      return this.legacyFallbackBridge(lesson8Data);
    }
  }

  /**
   * Fallback bridge from legacy LessonData to normalized LessonDetailDTO
   */
  private legacyFallbackBridge(legacy: typeof lesson8Data): LessonDetailDTO {
    return {
      id: String(legacy.id),
      courseLevelId: 'level-hsk-2',
      unitId: `unit-${legacy.unitNumber}`,
      unitNumber: legacy.unitNumber,
      lessonNumber: legacy.lessonNumber,
      status: 'PUBLISHED',
      hskLevel: {
        id: `level-hsk-${legacy.hskLevel}`,
        code: `HSK${legacy.hskLevel}`,
        name: `HSK ${legacy.hskLevel}`,
        standardCode: 'HSK_3_0',
        standardVersion: '3.0',
      },
      intro: {
        titleZh: legacy.hanziTitle,
        titleVi: legacy.vietnameseTitle,
        pinyinTitle: legacy.pinyinTitle,
        summary: legacy.vietnameseTitle,
        durationMinutes: legacy.durationMinutes,
        xpReward: legacy.xpReward,
        objectives: legacy.objectives,
        contextDialogueSnippet: legacy.contextDialogueSnippet
          ? {
              hanzi: legacy.contextDialogueSnippet.hanzi,
              pinyin: legacy.contextDialogueSnippet.pinyin,
              meaningVi: legacy.contextDialogueSnippet.meaning,
            }
          : undefined,
      },
      vocabularies: legacy.vocabulary.map((v) => ({
        id: `voc-${v.id}`,
        lessonId: String(legacy.id),
        vocabularyId: `v-${v.id}`,
        simplified: v.hanzi,
        pinyin: v.pinyin,
        meaningVi: v.meaning,
        partOfSpeech: v.partOfSpeech,
        isCoreWord: true,
        displayOrder: v.id,
        customExampleZh: v.exampleHanzi,
        customExamplePinyin: v.examplePinyin,
        customExampleVi: v.exampleMeaning,
      })),
      grammars: [
        {
          id: 'gram-primary',
          lessonId: String(legacy.id),
          grammarPointId: 'gp-1',
          code: 'HSK2_G01',
          title: legacy.grammar.title,
          explanation: legacy.grammar.explanation,
          structureFormula: legacy.grammar.patternFormula,
          displayOrder: 1,
          examples: legacy.grammar.examples.map((ex) => ({
            zh: ex.hanzi,
            pinyin: ex.pinyin,
            meaningVi: ex.meaning,
          })),
          commonMistake: legacy.grammar.commonMistake,
          quickPractice: legacy.grammar.quickPractice,
        },
      ],
      dialogue: {
        id: 'diag-fallback',
        title: legacy.dialogue.title,
        situationVi: legacy.dialogue.situation,
        lines: legacy.dialogue.lines.map((l) => ({
          id: String(l.id),
          speakerName: l.speakerName,
          speakerRole: l.speakerRole,
          zh: l.hanzi,
          pinyin: l.pinyin,
          meaningVi: l.meaning,
          displayOrder: l.id,
        })),
      },
      listenings: [
        {
          id: 'lis-fallback',
          title: 'Luyện nghe hiểu',
          audioUrl: '',
          transcriptZh: legacy.listening.audioHanzi,
          transcriptPinyin: legacy.listening.audioPinyin,
          transcriptVi: legacy.listening.audioMeaning,
          prompt: legacy.listening.prompt,
          options: legacy.listening.options,
          explanation: legacy.listening.explanation,
          displayOrder: 1,
        },
      ],
      exercises: [
        ...legacy.exercises.map((e, idx) => ({
          id: `lex-p-${e.id}`,
          lessonId: String(legacy.id),
          exerciseId: `ex-${e.id}`,
          section: 'PRACTICE' as const,
          displayOrder: idx + 1,
          exercise: {
            id: String(e.id),
            type: e.type,
            title: e.title,
            instruction: e.instruction,
            promptHanzi: e.promptHanzi,
            promptPinyin: e.promptPinyin,
            promptVietnamese: e.promptVietnamese,
            options: e.options,
            correctOptionIndex: e.correctOptionIndex,
            matchingPairs: e.matchingPairs,
            sentenceTokens: e.sentenceTokens,
            correctSentence: e.correctSentence,
            explanation: e.explanation,
          },
        })),
        ...legacy.quiz.map((q, idx) => ({
          id: `lex-q-${q.id}`,
          lessonId: String(legacy.id),
          exerciseId: `ex-q-${q.id}`,
          section: 'QUIZ' as const,
          displayOrder: idx + 1,
          points: 10,
          exercise: {
            id: `q-${q.id}`,
            type: 'multiple-choice' as const,
            title: `Câu hỏi ${q.id}`,
            instruction: q.question,
            promptHanzi: q.hanzi,
            promptPinyin: q.pinyin,
            promptVietnamese: q.question,
            options: q.options,
            correctOptionIndex: q.correctIndex,
            explanation: q.explanation,
          },
        })),
      ],
    };
  }
}

export const lessonContentService = new LessonContentService();
