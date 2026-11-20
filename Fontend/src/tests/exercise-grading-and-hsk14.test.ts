// @ts-ignore
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  normalizeAnswerText,
  stripParentheticalNote,
  normalizeBackendExerciseType,
  parseBracketedTokens,
  gradeExerciseSubmission,
  adaptBackendExerciseToShared,
} from '../features/exercise-engine';
import { HSK_CURRICULUM, getAllCurriculumLessons } from '../features/learning/data/curriculumData';
import { lessonContentService } from '../features/lesson/services/lesson-content.service';
import { adaptLessonDetailToPlayer } from '../features/lesson/adapters/lesson-player.adapter';

describe('Exercise Grading & HSK 1-4 Curriculum Regression Suite', () => {
  it('normalizes Unicode forms, Chinese/Latin punctuation, and spaces during answer comparison', () => {
    expect(normalizeAnswerText('我 爱 学习 汉语。')).toBe(normalizeAnswerText('我爱学习汉语'));
    expect(normalizeAnswerText('Ｈｅｌｌｏ！')).toBe('hello');
    expect(stripParentheticalNote('几 (jǐ)')).toBe('几');

    const freeTextFill = {
      id: 'ex-fill-1',
      title: 'Điền từ',
      type: 'fill-blank' as const,
      skill: 'vocabulary' as const,
      hskLevel: 2,
      instruction: 'Điền từ',
      correctSentence: '火车站 (huǒchēzhàn)',
      explanation: 'Giải thích',
    };

    expect(gradeExerciseSubmission(freeTextFill, { textAnswer: '火车站。' }).isCorrect).toBe(true);
    expect(gradeExerciseSubmission(freeTextFill, { textAnswer: '飞机场' }).isCorrect).toBe(false);
  });

  it('grades token-based sentence-ordering and keeps MCQ sentence-ordering distinct from token builder', () => {
    const tokenAdapted = adaptBackendExerciseToShared({
      id: 'ex-ord-1',
      title: 'Sắp xếp từ thành câu',
      exerciseType: 'sentence-ordering',
      skill: 'sentence',
      hskLevel: 3,
      promptHanzi: '[他] [是] [昨天] [到] [北京] [来的]',
      optionsJson: '[]',
      correctAnswer: '他是昨天到北京来的。',
    });

    expect(tokenAdapted.type).toBe('sentence-order');
    expect(tokenAdapted.sentenceTokens).toEqual(['他', '是', '昨天', '到', '北京', '来的']);
    expect(
      gradeExerciseSubmission(tokenAdapted, {
        orderedTokens: ['他', '是', '昨天', '到', '北京', '来的'],
      }).isCorrect
    ).toBe(true);

    const mcqSentenceOrder = adaptBackendExerciseToShared({
      id: 'ex-ord-2',
      title: 'Chọn câu đúng trật tự',
      exerciseType: 'sentence-ordering',
      skill: 'sentence',
      hskLevel: 4,
      promptHanzi: '请选出正确的句子',
      optionsJson: '["尽管下着大雨，他还是按时到了。","他按时到了尽管下着大雨还是。"]',
      correctOptionIndex: 0,
      audioUrl: '/audio/hsk4/les1_dialogue.mp3',
    });

    expect(mcqSentenceOrder.type).toBe('sentence-order');
    expect(mcqSentenceOrder.options?.length).toBe(2);
    expect(mcqSentenceOrder.audioUrl).toBe('/audio/hsk4/les1_dialogue.mp3');
    expect(gradeExerciseSubmission(mcqSentenceOrder, { selectedOption: 0 }).isCorrect).toBe(true);
    expect(gradeExerciseSubmission(mcqSentenceOrder, { selectedOption: 1 }).isCorrect).toBe(false);
    expect(normalizeBackendExerciseType('fill-in-the-blank')).toBe('fill-blank');
    expect(parseBracketedTokens('[我] [喜欢] [茶]')).toEqual(['我', '喜欢', '茶']);
  });

  it('fixes HSK 4 totalLessons to 20 and preserves static curriculum definitions without HSK4=30', () => {
    expect(HSK_CURRICULUM[1].totalLessons).toBe(15);
    expect(HSK_CURRICULUM[2].totalLessons).toBe(15);
    expect(HSK_CURRICULUM[3].totalLessons).toBe(20);
    expect(HSK_CURRICULUM[4].totalLessons).toBe(20);

    const hsk4Lessons = HSK_CURRICULUM[4].units.flatMap((u) => u.lessons);
    expect(hsk4Lessons.length).toBeGreaterThanOrEqual(1);
    expect(getAllCurriculumLessons().length).toBe(51);
  });

  it('maps HSK 2-4 LessonDetailDTO with dynamic hskLevel, audioUrl propagation, and non-empty quiz split', () => {
    const adapted = (lessonContentService as any).adaptLiveBackendToDetailDTO({
      id: '44444444-0001-0001-0001-000000000001',
      courseId: '44444444-0000-0000-0000-000000000004',
      courseTitle: 'HSK 4 - Trung cấp 4',
      hskLevel: 4,
      unitNumber: 1,
      lessonNumber: 1,
      titleZh: '简单的爱情',
      titleVi: 'Tình yêu giản dị',
      pinyin: 'Jiǎndān de àiqíng',
      dialogueJson: JSON.stringify({
        audioUrl: '/audio/hsk4/les1_dialogue.mp3',
        lines: [
          {
            speaker: 'A',
            hanzi: '你觉得什么是真正的爱情？',
            pinyin: 'Nǐ juéde shénme shì zhēnzhèng de àiqíng?',
            meaningVi: 'Bạn nghĩ tình yêu đích thực là gì?',
            audioUrl: '/audio/hsk4/les1_dialogue.mp3',
          },
        ],
      }),
      listeningJson: JSON.stringify({
        audioUrl: '/audio/hsk4/les1_listening.mp3',
        scriptHanzi: '两个人在一起最重要的是互相理解。',
        scriptPinyin: 'Liǎng gè rén zài yìqǐ zuì zhòngyào de shì hùxiāng lǐjiě.',
        scriptVietnamese: 'Hai người ở bên nhau quan trọng nhất là thấu hiểu lẫn nhau.',
        questions: [],
      }),
      vocabularies: [
        {
          id: 'v-1',
          hanzi: '爱情',
          pinyin: 'àiqíng',
          meaningVi: 'tình yêu',
          partOfSpeech: 'Danh từ',
          exampleHanzi: '真正的爱情需要信任。',
          examplePinyin: 'Zhēnzhèng de àiqíng xūyào xìnrèn.',
          exampleMeaningVi: 'Tình yêu đích thực cần sự tin tưởng.',
          audioUrl: '/audio/vocab/aiqing.mp3',
        },
      ],
      grammarPoints: [
        {
          id: 'g-1',
          title: '不仅……而且……',
          structureFormula: '不仅 + A + 而且 + B',
          explanationVi: 'Không những... mà còn...',
          examplesJson: JSON.stringify([
            {
              hanzi: '他不仅聪明，而且很努力。',
              pinyin: 'Tā bùjǐn cōngmíng, érqiě hěn nǔlì.',
              meaningVi: 'Anh ấy không những thông minh mà còn rất chăm chỉ.',
            },
          ]),
        },
      ],
      exercises: [
        {
          id: 'e-1',
          title: 'Câu 1',
          exerciseType: 'multiple-choice',
          skill: 'vocabulary',
          promptHanzi: '爱情 có nghĩa là gì?',
          optionsJson: '["tình yêu","công việc"]',
          correctOptionIndex: 0,
        },
        {
          id: 'e-2',
          title: 'Câu 2',
          exerciseType: 'multiple-choice',
          skill: 'grammar',
          promptHanzi: '不仅...而且... dùng để làm gì?',
          optionsJson: '["Diễn đạt tăng tiến","Diễn đạt phủ định"]',
          correctOptionIndex: 0,
        },
        {
          id: 'e-3',
          title: 'Câu 3',
          exerciseType: 'multiple-choice',
          skill: 'reading',
          promptHanzi: 'Đọc câu: 真正的爱情需要信任。',
          optionsJson: '["Cần sự tin tưởng","Không cần gì"]',
          correctOptionIndex: 0,
        },
      ],
    });

    expect(adapted.hskLevel.code).toBe('HSK4');
    expect(adapted.dialogue.lines[0].audioUrl).toBe('/audio/hsk4/les1_dialogue.mp3');
    expect(adapted.listenings[0].audioUrl).toBe('/audio/hsk4/les1_listening.mp3');
    expect(adapted.vocabularies[0].audioUrl).toBe('/audio/vocab/aiqing.mp3');
    expect(adapted.exercises.filter((e: any) => e.section === 'PRACTICE').length).toBe(2);
    expect(adapted.exercises.filter((e: any) => e.section === 'QUIZ').length).toBe(1);

    const player = adaptLessonDetailToPlayer(adapted);
    expect(player.listening?.audioUrl).toBe('/audio/hsk4/les1_listening.mp3');
    expect(player.exercises.length).toBe(2);
    expect(player.quiz.length).toBe(1);
    expect(player.grammar.quickPractice.question).not.toContain('我 ___ 学习汉语');
  });

  it('prevents QuizStep double-counting and LessonExperience hardcoded quizScore fallback regressions', () => {
    const srcRoot = join(import.meta.dir, '..');
    const quizSrc = readFileSync(join(srcRoot, 'features/lesson/steps/QuizStep.tsx'), 'utf8');
    const expSrc = readFileSync(join(srcRoot, 'features/lesson/LessonExperience.tsx'), 'utf8');
    const exStepSrc = readFileSync(join(srcRoot, 'features/lesson/steps/ExerciseStep.tsx'), 'utf8');

    expect(quizSrc).toContain('onCompleteQuiz(correctCount, quiz.length)');
    expect(quizSrc).not.toContain('isCorrect ? correctCount + 1 : correctCount');
    expect(expSrc).not.toContain('quizScore ?? 4');
    expect(exStepSrc).toContain('useEffect(');
    expect(exStepSrc).toContain('gradeExerciseSubmission');
  });
});
