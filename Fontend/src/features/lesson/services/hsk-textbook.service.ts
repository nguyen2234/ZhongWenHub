import { lessonContentService } from './lesson-content.service';
import { LessonPlayerAdapter } from '../adapters/lesson-player.adapter';
import { findLessonMetadata, getAllCurriculumLessons, HSK_CURRICULUM } from '../../learning/data/curriculumData';
import type { LessonReadingPassageDTO } from '../types/lesson-content.types';
import type { LessonData, DialogueLine } from '../types';

export interface TextbookVocabulary {
  id: string | number;
  orderNumber: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  partOfSpeech?: string;
  hskLevel?: number;
  radical?: string;
  strokeCount?: number;
  exampleHanzi: string;
  examplePinyin: string;
  exampleMeaning: string;
  audioUrl?: string;
}

export interface TextbookGrammar {
  id: string;
  title: string;
  structure: string;
  explanation: string;
  usageNote?: string;
  examples: {
    hanzi: string;
    pinyin: string;
    meaning: string;
  }[];
}

export interface TextbookDialogue {
  title: string;
  contextDescription: string;
  speakers: { id: string; name: string; role: string; avatarChar: string }[];
  lines: DialogueLine[];
}

export interface HskTextbookData {
  lessonId: string;
  hskLevel: number;
  unitNumber: number;
  unitTitleVi: string;
  lessonNumber: number;
  titleZh: string;
  titleVi: string;
  pinyin: string;
  summary: string;
  objectives: string[];
  durationMinutes: number;
  xpReward: number;
  vocabularies: TextbookVocabulary[];
  grammars: TextbookGrammar[];
  dialogue: TextbookDialogue;
  readingPassage?: LessonReadingPassageDTO;
  playerLessonData: LessonData;
  isAvailable: boolean;
  isDraftFallback: boolean;
}

class HskTextbookService {
  /**
   * Loads normalized Textbook data for a given lessonId.
   * Matches curriculum metadata, lesson detail DTO, authentic vocabulary items,
   * grammar points and interactive dialogue.
   */
  async getTextbookLesson(lessonId: string): Promise<HskTextbookData> {
    const detailDto = await lessonContentService.getLessonDetail(lessonId);
    const playerLessonData = LessonPlayerAdapter.adaptLessonDetail(detailDto);

    // Curriculum metadata matching
    const meta = findLessonMetadata(lessonId);
    const hskLevel = meta?.hskLevel ?? parseInt(detailDto.hskLevel.code.replace(/\D/g, ''), 10) ?? 1;
    const lessonNumber = meta?.lessonNumber ?? detailDto.lessonNumber ?? 1;
    const unitNumber = meta?.unitNumber ?? detailDto.unitNumber ?? 1;

    // Resolve Unit Title
    let unitTitleVi = `Chủ đề ${unitNumber}`;
    const levelData = HSK_CURRICULUM[hskLevel];
    if (levelData) {
      const u = levelData.units.find((item) => item.unitNumber === unitNumber);
      if (u) unitTitleVi = u.vietnameseTitle;
    }

    const isGuidId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(detailDto.id || '');
    const isDirectDraftMatch = detailDto.id === lessonId || isGuidId || lessonId === 'les-8' || lessonId === '8';
    // When live backend returns real SQL Server GUID lesson data, treat Backend as Single Source of Truth over static curriculumData fallback.
    const preferBackend = isGuidId && Boolean(detailDto.intro?.titleZh);
    const titleZh = (preferBackend ? detailDto.intro.titleZh : meta?.hanzi) ?? (isDirectDraftMatch ? detailDto.intro.titleZh : `第 ${lessonId} 课`);
    const titleVi = (preferBackend ? detailDto.intro.titleVi : meta?.meaning) ?? (isDirectDraftMatch ? detailDto.intro.titleVi : `Bài học: ${lessonId}`);
    const pinyin = (preferBackend ? detailDto.intro.pinyinTitle : meta?.pinyin) ?? (isDirectDraftMatch ? detailDto.intro.pinyinTitle : '');
    const summary = (preferBackend ? detailDto.intro.summary : meta?.summary) ?? (isDirectDraftMatch ? detailDto.intro.summary : `Nội dung chi tiết cho bài ${lessonId}`);
    const objectives = isDirectDraftMatch && detailDto.intro.objectives && detailDto.intro.objectives.length > 0
      ? detailDto.intro.objectives
      : [
          `Nắm vững các mẫu câu và từ vựng trọng tâm bài ${titleZh}`,
          `Phát âm chuẩn xác Pinyin và các thanh điệu liên quan`,
          `Ứng dụng cấu trúc vào hội thoại giao tiếp tự nhiên`,
          `Ghi nhớ từ vựng qua Spaced Repetition Flashcard`,
        ];

    // 1. Resolve authentic Vocabularies
    // PRIORITY 1: Live Backend API / Adapted Lesson Data (Single Source of Truth)
    let vocabularies: TextbookVocabulary[] = [];

    if (playerLessonData.vocabulary && playerLessonData.vocabulary.length > 0) {
      vocabularies = playerLessonData.vocabulary.map((item, idx) => ({
        id: item.id,
        orderNumber: idx + 1,
        hanzi: item.hanzi,
        pinyin: item.pinyin,
        meaning: item.meaning,
        partOfSpeech: item.partOfSpeech || 'Từ vựng',
        hskLevel,
        exampleHanzi: item.exampleHanzi,
        examplePinyin: item.examplePinyin,
        exampleMeaning: item.exampleMeaning,
        audioUrl: item.audioUrl,
      }));
    } else if (detailDto.vocabularies && detailDto.vocabularies.length > 0) {
      vocabularies = detailDto.vocabularies.map((v, idx) => ({
        id: v.id,
        orderNumber: idx + 1,
        hanzi: v.simplified,
        pinyin: v.pinyin,
        meaning: v.meaningVi,
        partOfSpeech: v.partOfSpeech || 'Từ vựng',
        hskLevel,
        exampleHanzi: v.customExampleZh || '',
        examplePinyin: v.customExamplePinyin || '',
        exampleMeaning: v.customExampleVi || '',
        audioUrl: v.audioUrl,
      }));
    }

    // 2. Resolve authentic Grammar Points
    // PRIORITY 1: Live Backend API / detailDto.grammars
    const grammars: TextbookGrammar[] = [];
    if (detailDto.grammars && detailDto.grammars.length > 0) {
      detailDto.grammars.forEach((g) => {
        grammars.push({
          id: g.id || g.grammarPointId,
          title: g.title,
          structure: g.structureFormula || '',
          explanation: g.explanation || '',
          usageNote: g.lessonNotes,
          examples: (g.examples || []).map((e: any) => ({
            hanzi: e.zh || e.hanzi || '',
            pinyin: e.pinyin || '',
            meaning: e.meaningVi || e.meaning || '',
          })),
        });
      });
    } else if (playerLessonData.grammar && playerLessonData.grammar.examples && playerLessonData.grammar.examples.length > 0) {
      grammars.push({
        id: 'gp-primary',
        title: playerLessonData.grammar.title,
        structure: playerLessonData.grammar.patternFormula,
        explanation: playerLessonData.grammar.explanation || playerLessonData.grammar.subtitle,
        usageNote: playerLessonData.grammar.commonMistake
          ? `Lưu ý: Tránh dùng sai: ${playerLessonData.grammar.commonMistake.wrong} -> Đúng: ${playerLessonData.grammar.commonMistake.right}. ${playerLessonData.grammar.commonMistake.note}`
          : undefined,
        examples: playerLessonData.grammar.examples.map((e) => ({
          hanzi: e.hanzi,
          pinyin: e.pinyin,
          meaning: e.meaning,
        })),
      });
    }

    // 3. Resolve Dialogue - No fake dialogue generation!
    const dialogueSource = playerLessonData.dialogue;
    const dialogueLines: DialogueLine[] = (dialogueSource?.lines && dialogueSource.lines.length > 0)
      ? dialogueSource.lines
      : [];

    const dialogue: TextbookDialogue = {
      title: dialogueSource?.title || `Hội thoại bài học: ${titleZh}`,
      contextDescription: dialogueSource?.situation || detailDto.intro.summary || '',
      speakers: dialogueLines.length > 0 ? [
        {
          id: 'speaker-a',
          name: dialogueLines[0]?.speakerName || 'Người A',
          role: dialogueLines[0]?.speakerRole || 'Nhân vật',
          avatarChar: dialogueLines[0]?.speakerName?.charAt(0) || 'A',
        },
        {
          id: 'speaker-b',
          name: dialogueLines.find((l) => l.speaker === 'B')?.speakerName || dialogueLines[1]?.speakerName || 'Người B',
          role: dialogueLines.find((l) => l.speaker === 'B')?.speakerRole || dialogueLines[1]?.speakerRole || 'Nhân vật',
          avatarChar: (dialogueLines.find((l) => l.speaker === 'B')?.speakerName || dialogueLines[1]?.speakerName || 'B').charAt(0) || 'B',
        },
      ] : [],
      lines: dialogueLines,
    };

    // 4. Resolve Reading Passage - Authentic backend only
    const readingPassage = detailDto.readingPassage;

    return {
      lessonId,
      hskLevel,
      unitNumber,
      unitTitleVi,
      lessonNumber,
      titleZh,
      titleVi,
      pinyin: pinyin || '',
      summary,
      objectives,
      durationMinutes: meta?.durationMinutes ?? detailDto.intro.durationMinutes ?? 15,
      xpReward: meta?.xpReward ?? detailDto.intro.xpReward ?? 50,
      vocabularies,
      grammars,
      dialogue,
      readingPassage,
      playerLessonData,
      isAvailable: true,
      isDraftFallback: !meta,
    };
  }

  /**
   * Resolve the next curriculum lesson ID in sequential learning order
   */
  getNextLessonId(currentLessonId: string): string | null {
    const all = getAllCurriculumLessons();
    const idx = all.findIndex(
      (l) => l.id === currentLessonId || String(l.lessonNumber) === currentLessonId || l.id === `les-${currentLessonId}`
    );
    if (idx >= 0 && idx < all.length - 1) {
      return all[idx + 1].id;
    }
    return null;
  }

  /**
   * Resolve the previous curriculum lesson ID in sequential learning order
   */
  getPrevLessonId(currentLessonId: string): string | null {
    const all = getAllCurriculumLessons();
    const idx = all.findIndex(
      (l) => l.id === currentLessonId || String(l.lessonNumber) === currentLessonId || l.id === `les-${currentLessonId}`
    );
    if (idx > 0) {
      return all[idx - 1].id;
    }
    return null;
  }
}

export const hskTextbookService = new HskTextbookService();
