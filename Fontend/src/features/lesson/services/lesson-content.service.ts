import type { LessonDetailDTO } from '../types/lesson-content.types';
import { MOCK_LESSON_8_DRAFT } from '../../../management/admin/content/data/mockLessonEditorData';
import { adaptEditorDraftToDetailDTO } from '../adapters/lesson-player.adapter';
import { lesson8Data } from '../data/lesson8';
import { httpClient } from '../../../core/api/client/http-client';

/**
 * Service for fetching normalized lesson content (LessonDetailDTO).
 * Connects to ASP.NET Core REST API: GET /api/v1/content/lessons/{lessonId}
 */
class LessonContentService {
  /**
   * Fetch normalized lesson details by ID.
   * Connects to live Backend SQL Server API with graceful fallback to mock data.
   */
  async getLessonDetail(lessonId: string = 'les-1'): Promise<LessonDetailDTO> {
    // 1. Always attempt to fetch from live Backend API for any lessonId
    if (lessonId) {
      try {
        const live = await httpClient.get<any>(`/content/lessons/${lessonId}`);
        if (live && live.id) {
          return this.adaptLiveBackendToDetailDTO(live);
        }
      } catch (error: any) {
        // If 404 (e.g. DRAFT lesson hidden from Student, or not found), do not mask it with fake data!
        if (error?.status === 404 || error?.statusCode === 404) {
          throw new Error('Bài học không tồn tại hoặc chưa được phát hành (Draft).');
        }
        console.warn('[LessonContentService] Live API fetch failed, checking local mocks:', error);
      }
    }

    // 2. In mock mode / local dev without API, resolve metadata from curriculumData
    try {
      const detail = adaptEditorDraftToDetailDTO(MOCK_LESSON_8_DRAFT);
      if (lessonId) {
        const { findLessonMetadata } = await import('../../learning/data/curriculumData');
        const lessonMeta = findLessonMetadata(lessonId);
        if (lessonMeta) {
          detail.id = lessonMeta.id;
          detail.lessonNumber = lessonMeta.lessonNumber;
          detail.intro.titleZh = lessonMeta.hanzi;
          detail.intro.pinyinTitle = lessonMeta.pinyin;
          detail.intro.titleVi = lessonMeta.meaning;
          detail.intro.summary = lessonMeta.summary;
          detail.intro.xpReward = lessonMeta.xpReward;
          detail.hskLevel = {
            id: `level-hsk-${lessonMeta.hskLevel}`,
            code: `HSK${lessonMeta.hskLevel}`,
            name: `HSK ${lessonMeta.hskLevel}`,
            standardCode: 'HSK_3_0',
            standardVersion: '3.0',
          };
        }
      }
      return detail;
    } catch (error) {
      console.warn('[LessonContentService] Error resolving draft, falling back to legacy bridge:', error);
      return this.legacyFallbackBridge(lesson8Data);
    }
  }

  /**
   * Adapts live Backend API response to LessonDetailDTO
   */
  private adaptLiveBackendToDetailDTO(live: any): LessonDetailDTO {
    const vocabularies = Array.isArray(live.vocabularies)
      ? live.vocabularies.map((v: any, idx: number) => {
          let exampleZh = '';
          let exampleVi = '';
          let examplePinyin = '';
          if (v.examplesJson) {
            try {
              const parsed = JSON.parse(v.examplesJson);
              if (Array.isArray(parsed) && parsed.length > 0) {
                exampleZh = parsed[0].zh || '';
                examplePinyin = parsed[0].pinyin || '';
                exampleVi = parsed[0].meaningVi || '';
              }
            } catch {
              // ignore
            }
          }
          return {
            id: v.id,
            lessonId: live.id,
            vocabularyId: v.id,
            simplified: v.hanzi,
            traditional: v.traditional,
            pinyin: v.pinyin,
            meaningVi: v.meaningVi,
            partOfSpeech: v.partOfSpeech,
            audioUrl: v.audioUrl,
            isCoreWord: true,
            displayOrder: idx + 1,
            customExampleZh: exampleZh,
            customExamplePinyin: examplePinyin,
            customExampleVi: exampleVi,
          };
        })
      : [];

    const grammars = Array.isArray(live.grammarPoints)
      ? live.grammarPoints.map((g: any, idx: number) => {
          let examples: any[] = [];
          if (g.examplesJson) {
            try {
              examples = JSON.parse(g.examplesJson);
            } catch {
              examples = [];
            }
          }
          return {
            id: g.id,
            lessonId: live.id,
            grammarPointId: g.id,
            code: g.code,
            title: g.title,
            explanation: g.explanation,
            structureFormula: g.structureFormula,
            displayOrder: idx + 1,
            examples,
          };
        })
      : [];

    const exercises = Array.isArray(live.exercises)
      ? live.exercises.map((e: any, idx: number) => {
          let options: string[] = [];
          if (e.optionsJson) {
            try {
              options = JSON.parse(e.optionsJson);
            } catch {
              options = [];
            }
          }
          return {
            id: e.id,
            lessonId: live.id,
            exerciseId: e.id,
            section: 'PRACTICE' as const,
            displayOrder: idx + 1,
            exercise: {
              id: e.id,
              type: e.type,
              title: e.title,
              instruction: e.instruction,
              promptHanzi: e.promptHanzi,
              promptPinyin: e.promptPinyin,
              promptVietnamese: e.promptVietnamese,
              options,
              correctOptionIndex: e.correctOptionIndex ?? 0,
              explanation: e.explanation,
            },
          };
        })
      : [];

    return {
      id: live.id,
      courseLevelId: 'level-hsk-1',
      unitId: 'unit-1',
      unitNumber: 1,
      lessonNumber: live.lessonNumber,
      status: live.status,
      hskLevel: {
        id: 'level-hsk-1',
        code: 'HSK1',
        name: 'HSK 1',
        standardCode: 'HSK_3_0',
        standardVersion: '3.0',
      },
      intro: {
        titleZh: live.titleZh,
        titleVi: live.titleVi,
        pinyinTitle: live.pinyin || '',
        summary: live.summary || '',
        durationMinutes: live.durationMinutes || 20,
        xpReward: live.xpReward || 50,
        objectives: [
          'Nắm vững từ vựng và câu giao tiếp chuẩn trong bài học',
          'Luyện tập phát âm và áp dụng ngữ pháp vào hội thoại thực tế',
        ],
      },
      vocabularies,
      grammars,
      dialogue: {
        id: `diag-${live.id}`,
        title: `Hội thoại bài ${live.lessonNumber}`,
        situationVi: live.summary || 'Tình huống giao tiếp hàng ngày',
        lines: [
          {
            id: '1',
            speakerName: '王明',
            speakerRole: 'Học sinh',
            zh: live.titleZh,
            pinyin: live.pinyin || '',
            meaningVi: live.titleVi,
            displayOrder: 1,
          },
        ],
      },
      listenings: [],
      exercises,
    };
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
