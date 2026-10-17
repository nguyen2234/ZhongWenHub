import { lessonContentService } from './lesson-content.service';
import { LessonPlayerAdapter } from '../adapters/lesson-player.adapter';
import { findLessonMetadata, getAllCurriculumLessons, HSK_CURRICULUM } from '../../learning/data/curriculumData';
import { INITIAL_VOCABULARY_LIST } from '../../vocabulary/data/vocabularyBank';
import { MOCK_GRAMMAR_POINTS } from '../../grammar/mock/mockGrammarData';
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

    const isDirectDraftMatch = detailDto.id === lessonId || lessonId === 'les-8' || lessonId === '8';
    const titleZh = meta?.hanzi ?? (isDirectDraftMatch ? detailDto.intro.titleZh : `第 ${lessonId} 课`);
    const titleVi = meta?.meaning ?? (isDirectDraftMatch ? detailDto.intro.titleVi : `Bài học: ${lessonId}`);
    const pinyin = meta?.pinyin ?? (isDirectDraftMatch ? detailDto.intro.pinyinTitle : '');
    const summary = meta?.summary ?? (isDirectDraftMatch ? detailDto.intro.summary : `Nội dung chi tiết cho bài ${lessonId}`);
    const objectives = isDirectDraftMatch && detailDto.intro.objectives && detailDto.intro.objectives.length > 0
      ? detailDto.intro.objectives
      : [
          `Nắm vững các mẫu câu và từ vựng trọng tâm bài ${titleZh}`,
          `Phát âm chuẩn xác Pinyin và các thanh điệu liên quan`,
          `Ứng dụng cấu trúc vào hội thoại giao tiếp tự nhiên`,
          `Ghi nhớ từ vựng qua Spaced Repetition Flashcard`,
        ];

    // 1. Resolve authentic Vocabularies
    // First, check matching words from INITIAL_VOCABULARY_LIST
    const bankMatches = INITIAL_VOCABULARY_LIST.filter(
      (v) => (v.lessonId === lessonNumber && v.hskLevel === hskLevel) ||
             (meta?.vocabularyIds && meta.vocabularyIds.includes(v.id))
    );

    let vocabularies: TextbookVocabulary[] = [];

    if (bankMatches.length > 0) {
      vocabularies = bankMatches.map((item, idx) => ({
        id: item.id,
        orderNumber: idx + 1,
        hanzi: item.hanzi,
        pinyin: item.pinyin,
        meaning: item.primaryMeaning || item.meanings[0] || '',
        partOfSpeech: item.wordType,
        hskLevel: item.hskLevel,
        radical: item.radical,
        strokeCount: item.strokeCount,
        exampleHanzi: item.examples[0]?.hanzi || '',
        examplePinyin: item.examples[0]?.pinyin || '',
        exampleMeaning: item.examples[0]?.meaning || '',
      }));
    } else if (playerLessonData.vocabulary && playerLessonData.vocabulary.length > 0) {
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
      }));
    }

    // 2. Resolve authentic Grammar Points
    const grammars: TextbookGrammar[] = [];
    if (meta?.grammarPointIds && meta.grammarPointIds.length > 0) {
      meta.grammarPointIds.forEach((gpId) => {
        const found = MOCK_GRAMMAR_POINTS.find((gp) => gp.id === gpId || gp.id.includes(gpId));
        if (found) {
          grammars.push({
            id: found.id,
            title: found.title,
            structure: found.structure,
            explanation: found.explanation,
            usageNote: found.usageNote,
            examples: found.examples.map((e) => ({
              hanzi: e.chinese,
              pinyin: e.pinyin,
              meaning: e.vietnamese,
            })),
          });
        }
      });
    }

    // Fallback grammar if not matched from mock list
    if (grammars.length === 0 && playerLessonData.grammar) {
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

    // 3. Resolve Dialogue
    const dialogueSource = playerLessonData.dialogue;
    const dialogueLines: DialogueLine[] = (dialogueSource?.lines && dialogueSource.lines.length > 0)
      ? dialogueSource.lines
      : [
          {
            id: 1,
            speaker: 'A',
            speakerName: 'A (Người hỏi)',
            speakerRole: 'Nhân vật A',
            hanzi: titleZh,
            pinyin: pinyin || '',
            meaning: titleVi,
          },
          {
            id: 2,
            speaker: 'B',
            speakerName: 'B (Người đáp)',
            speakerRole: 'Nhân vật B',
            hanzi: detailDto.intro.contextDialogueSnippet?.hanzi || '我很高兴认识你。',
            pinyin: detailDto.intro.contextDialogueSnippet?.pinyin || 'Wǒ hěn gāoxìng rènshi nǐ.',
            meaning: detailDto.intro.contextDialogueSnippet?.meaningVi || 'Tôi rất vui được làm quen với bạn.',
          },
        ];

    const dialogue: TextbookDialogue = {
      title: dialogueSource?.title || `Hội thoại bài học: ${titleZh}`,
      contextDescription: dialogueSource?.situation || detailDto.intro.summary || 'Tình huống giao tiếp cơ bản hàng ngày',
      speakers: [
        {
          id: 'speaker-a',
          name: dialogueLines[0]?.speakerName || 'Người A',
          role: dialogueLines[0]?.speakerRole || 'Nhân vật',
          avatarChar: dialogueLines[0]?.speakerName?.charAt(0) || 'A',
        },
        {
          id: 'speaker-b',
          name: dialogueLines.find((l) => l.speaker === 'B')?.speakerName || 'Người B',
          role: dialogueLines.find((l) => l.speaker === 'B')?.speakerRole || 'Nhân vật',
          avatarChar: dialogueLines.find((l) => l.speaker === 'B')?.speakerName?.charAt(0) || 'B',
        },
      ],
      lines: dialogueLines,
    };

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
