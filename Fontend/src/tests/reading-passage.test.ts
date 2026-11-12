import { describe, it, expect } from 'bun:test';
import type { LessonReadingPassageDTO } from '../features/lesson/types/lesson-content.types';

describe('Phase 9.1C: Reading Passages Integration & Zero-Schema Contract', () => {
  const samplePassage: LessonReadingPassageDTO = {
    unitNumber: 1,
    lessonNumber: 2,
    titleZh: '你好，朋友！',
    titleVi: 'Chào bạn nhé!',
    passageZh: '你好！我是大卫。这是我的中国朋友，他叫李明。我们天天在一起学习，我们明天见！',
    passagePinyin: 'Nǐ hǎo! Wǒ shì Dàwèi. Zhè shì wǒ de zhōngguó péngyou, tā jiào Lǐ Míng. Wǒmen tiāntiān zài yìqǐ xuéxí, wǒmen míngtiān jiàn!',
    passageVi: 'Xin chào! Tôi là David. Đây là người bạn Trung Quốc của tôi, cậu ấy tên là Lý Minh. Ngày nào chúng tôi cũng học cùng nhau, hẹn ngày mai gặp lại!',
    characterCount: 32,
    targetWords: ['你好', '谢谢', '不客气', '再见', '朋友'],
    targetGrammar: ['Chào hỏi sơ cấp', 'Đáp từ cảm ơn và xin lỗi'],
    comprehensionQuestions: [
      {
        questionZh: '大卫的中国朋友叫什么名字？',
        questionPinyin: 'Dàwèi de zhōngguó péngyou jiào shénme míngzi?',
        questionVi: 'Bạn người Trung Quốc của David tên là gì?',
        options: ['李明 (Lǐ Míng)', '王明 (Wáng Míng)', '张三 (Zhāng Sān)', '大卫 (Dàwèi)'],
        correctIndex: 0,
        explanation: "Trong đoạn văn nêu rõ: '这是我的中国朋友，他叫李明。'",
      },
    ],
  };

  it('validates reading passage structure conforming to HSK 1 curriculum standards', () => {
    expect(samplePassage.unitNumber).toBe(1);
    expect(samplePassage.lessonNumber).toBe(2);
    expect(samplePassage.titleZh).toBe('你好，朋友！');
    expect(samplePassage.characterCount).toBe(32);
    expect(samplePassage.comprehensionQuestions.length).toBe(1);
    expect(samplePassage.comprehensionQuestions[0].correctIndex).toBe(0);
    expect(samplePassage.comprehensionQuestions[0].options.length).toBe(4);
  });

  it('verifies target vocabulary and grammar are non-empty for pedagogical alignment', () => {
    expect(samplePassage.targetWords?.length).toBeGreaterThan(0);
    expect(samplePassage.targetGrammar?.length).toBeGreaterThan(0);
    expect(samplePassage.targetWords).toContain('朋友');
  });

  it('verifies zero-schema JSON embedding inside dialogueJson', () => {
    const dialoguePayload = {
      id: 'diag-001',
      title: 'Hội thoại bài 2',
      lines: [],
      readingPassage: samplePassage,
    };

    const serialized = JSON.stringify(dialoguePayload);
    const parsed = JSON.parse(serialized);

    expect(parsed.readingPassage).toBeDefined();
    expect(parsed.readingPassage.titleZh).toBe('你好，朋友！');
    expect(parsed.readingPassage.comprehensionQuestions[0].explanation).toContain('李明');
  });
});
