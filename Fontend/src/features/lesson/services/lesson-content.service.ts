import type { LessonDetailDTO } from '../types/lesson-content.types';
import { MOCK_LESSON_8_DRAFT } from '../../../management/admin/content/data/mockLessonEditorData';
import { adaptEditorDraftToDetailDTO } from '../adapters/lesson-player.adapter';
import { lesson8Data } from '../data/lesson8';
import { httpClient } from '../../../core/api/client/http-client';
import { adaptBackendExerciseToShared } from '../../exercise-engine';

/**
 * Service for fetching normalized lesson content (LessonDetailDTO).
 * Connects to ASP.NET Core REST API: GET /api/v1/content/lessons/{lessonId}
 */
function isIsolatedTestRuntime(): boolean {
  const mode = (import.meta as any)?.env?.MODE;
  const g = globalThis as any;
  const nodeEnv = g?.process?.env?.NODE_ENV;
  const isBun = typeof g?.Bun !== 'undefined';
  return mode === 'test' || nodeEnv === 'test' || isBun;
}

class LessonContentService {
  /**
   * Fetch normalized lesson details by ID.
   * Connects to live Backend SQL Server API. Mock fixture fallback is strictly isolated to unit-test runtimes.
   */
  async getLessonDetail(lessonId: string = 'les-1'): Promise<LessonDetailDTO> {
    // 1. Always attempt to fetch from live Backend API
    if (lessonId) {
      try {
        let apiTargetId = lessonId;
        const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId);
        if (!isGuid) {
          const { findLessonMetadata } = await import('../../learning/data/curriculumData');
          const meta = findLessonMetadata(lessonId);
          if (meta?.dbId) {
            apiTargetId = meta.dbId;
          }
        }

        const live = await httpClient.get<any>(`/content/lessons/${apiTargetId}`);
        if (live && live.id) {
          return this.adaptLiveBackendToDetailDTO(live);
        }
        throw new Error('Dữ liệu bài học trả về từ máy chủ không hợp lệ.');
      } catch (error: any) {
        // If 404 (e.g. DRAFT lesson hidden from Student, or not found), do not mask it with fake data!
        if (error?.status === 404 || error?.statusCode === 404) {
          throw new Error('Bài học không tồn tại hoặc chưa được phát hành (Draft).');
        }
        if (!isIsolatedTestRuntime()) {
          throw new Error(
            error?.message || 'Không thể tải nội dung bài học từ máy chủ. Vui lòng thử lại.'
          );
        }
        console.warn('[LessonContentService] Isolated test runtime API unavailable, using test fixture:', error);
      }
    }

    if (!isIsolatedTestRuntime()) {
      throw new Error('Không tìm thấy mã bài học hợp lệ.');
    }

    // 2. Isolated test-runtime fixture resolution only (never used in browser runtime)
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
            standardCode: 'HSK_2_0',
            standardVersion: '2.0',
          };
        }
      }
      return detail;
    } catch (error) {
      console.warn('[LessonContentService] Error resolving test fixture, falling back to legacy bridge:', error);
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
          let quickPractice: any;
          if (g.practiceJson) {
            try {
              const qp = typeof g.practiceJson === 'string' ? JSON.parse(g.practiceJson) : g.practiceJson;
              if (qp && typeof qp === 'object' && Array.isArray(qp.options) && qp.options.length > 0) {
                quickPractice = {
                  question: qp.question || qp.prompt || '',
                  pinyin: qp.pinyin || '',
                  blankWordTranslation: qp.blankWordTranslation || '',
                  options: qp.options.map(String),
                  correctIndex: typeof qp.correctIndex === 'number' ? qp.correctIndex : 0,
                  explanation: qp.explanation || '',
                };
              }
            } catch {
              quickPractice = undefined;
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
            quickPractice,
          };
        })
      : [];

    const exercises = Array.isArray(live.exercises)
      ? live.exercises.map((e: any, idx: number, arr: any[]) => {
          const shared = adaptBackendExerciseToShared(e);
          // Allocate trailing MCQ exercises to Mini Quiz when DB exercises don't separate section,
          // so Step 7 QuizStep delivers real assessment questions and non-empty practice steps.
          const hasExplicitQuiz = arr.some((item) => item.section === 'QUIZ');
          const quizStartIdx = arr.length >= 4 ? arr.length - 2 : arr.length >= 2 ? arr.length - 1 : arr.length;
          const section: 'PRACTICE' | 'QUIZ' = hasExplicitQuiz
            ? (e.section === 'QUIZ' ? 'QUIZ' : 'PRACTICE')
            : (idx >= quizStartIdx ? 'QUIZ' : 'PRACTICE');

          return {
            id: e.id,
            lessonId: live.id,
            exerciseId: e.id,
            section,
            displayOrder: idx + 1,
            exercise: {
              id: String(shared.id),
              type: shared.type,
              title: shared.title,
              instruction: shared.instruction,
              promptHanzi: shared.promptHanzi,
              promptPinyin: shared.promptPinyin,
              promptVietnamese: shared.promptVietnamese,
              audioUrl: shared.audioUrl,
              options: shared.options || [],
              correctOptionIndex: shared.correctOptionIndex ?? 0,
              matchingPairs: shared.matchingPairs,
              sentenceTokens: shared.sentenceTokens,
              correctSentence: shared.correctSentence,
              explanation: shared.explanation,
              xpReward: shared.xpReward,
            },
          };
        })
      : [];

    let readingPassage: any = live.readingPassage;
    let dialogueLines: any[] = [];
    let dialogueTitle = `Hội thoại bài ${live.lessonNumber || ''}`;
    let dialogueSituation = live.summary || 'Tình huống giao tiếp cơ bản';
    let dialogueAudioUrl: string | undefined;

    if (live.dialogueJson) {
      try {
        const parsed = typeof live.dialogueJson === 'string' ? JSON.parse(live.dialogueJson) : live.dialogueJson;
        if (parsed) {
          if (!readingPassage && parsed.readingPassage) {
            readingPassage = parsed.readingPassage;
          }
          if (parsed.title) {
            dialogueTitle = parsed.title;
          }
          if (parsed.audioUrl) {
            dialogueAudioUrl = parsed.audioUrl;
          }
          if (parsed.situationVi || parsed.situation || parsed.topic) {
            dialogueSituation = parsed.situationVi || parsed.situation || parsed.topic;
          }
          const rawLines = Array.isArray(parsed.lines) ? parsed.lines : Array.isArray(parsed) ? parsed : [];
          dialogueLines = rawLines.map((l: any, idx: number) => ({
            id: String(l.id || idx + 1),
            speakerName: l.speakerName || l.speaker || (idx % 2 === 0 ? 'Người A' : 'Người B'),
            speakerRole: l.speakerRole || '',
            zh: l.zh || l.hanzi || '',
            pinyin: l.pinyin || '',
            meaningVi: l.meaningVi || l.meaning || '',
            audioUrl: l.audioUrl || undefined,
            displayOrder: l.displayOrder || idx + 1,
          }));
        }
      } catch {
        // ignore JSON parse error
      }
    }

    let listenings: any[] = [];
    if (live.listeningJson) {
      try {
        const parsed = typeof live.listeningJson === 'string' ? JSON.parse(live.listeningJson) : live.listeningJson;
        if (Array.isArray(parsed)) {
          listenings = parsed;
        } else if (parsed && Array.isArray(parsed.items)) {
          listenings = parsed.items;
        } else if (parsed && typeof parsed === 'object') {
          const qs = Array.isArray(parsed.questions) ? parsed.questions : [];
          const primaryQ = qs[0] || {};
          listenings = [
            {
              id: `listen-${live.id}`,
              title: parsed.title || `Nghe hiểu bài ${live.lessonNumber || ''}`,
              audioUrl: parsed.audioUrl || undefined,
              transcriptZh: parsed.scriptHanzi || parsed.transcriptZh || '',
              transcriptPinyin: parsed.scriptPinyin || parsed.transcriptPinyin || '',
              transcriptVi: parsed.scriptVietnamese || parsed.transcriptVi || '',
              prompt: primaryQ.question || parsed.prompt || 'Nghe đoạn hội thoại và chọn đáp án đúng:',
              options: Array.isArray(primaryQ.options)
                ? primaryQ.options.map((opt: any, idx: number) => ({
                    id: idx + 1,
                    text: String(opt),
                    isCorrect: idx === (typeof primaryQ.correctOptionIndex === 'number' ? primaryQ.correctOptionIndex : 0),
                  }))
                : [],
              explanation: primaryQ.explanation || parsed.explanation || 'Đối chiếu lại lời thoại và phiên âm.',
            },
          ];
        }
      } catch {
        // ignore JSON parse error
      }
    }

    const resolvedHskLevel =
      typeof live.hskLevel === 'number' && live.hskLevel > 0
        ? live.hskLevel
        : typeof live.course?.hskLevel === 'number' && live.course.hskLevel > 0
        ? live.course.hskLevel
        : (() => {
            const m = String(live.courseTitle || '').match(/HSK\s*(\d+)/i);
            return m ? parseInt(m[1], 10) : 1;
          })();

    return {
      id: live.id,
      courseLevelId: `level-hsk-${resolvedHskLevel}`,
      unitId: live.unitId || 'unit-1',
      unitNumber: live.unitNumber || 1,
      lessonNumber: live.lessonNumber,
      status: live.status,
      hskLevel: {
        id: `level-hsk-${resolvedHskLevel}`,
        code: `HSK${resolvedHskLevel}`,
        name: `HSK ${resolvedHskLevel}`,
        standardCode: 'HSK_2_0',
        standardVersion: '2.0',
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
        title: dialogueTitle,
        situationVi: dialogueSituation,
        audioUrl: dialogueAudioUrl,
        lines: dialogueLines,
      },
      listenings,
      exercises,
      readingPassage,
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
        standardCode: 'HSK_2_0',
        standardVersion: '2.0',
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
