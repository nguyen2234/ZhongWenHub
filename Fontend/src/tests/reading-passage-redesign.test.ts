// @ts-ignore
import { describe, it, expect } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import {
  splitReadingPassageSentences,
  areSentencesLikelyAligned,
} from '../features/lesson/components/ReadingPassageCard';

describe('HSK Lesson Redesign & Reading Passage Contract (Round 2)', () => {
  it('splits HSK 1 Lesson 1 passage into 4 verified aligned sentences without breaking Pinyin syllables or quotes', () => {
    const zh =
      '早上我在学校看见王老师，我说：“老师，您好！” 王老师笑着说：“你好！” 中午我不小心碰到同学的书，我说：“对不起！” 同学说：“没关系！”';
    const py =
      'Zǎoshang wǒ zài xuéxiào kànjiàn Wáng lǎoshī, wǒ shuō: "Lǎoshī, nín hǎo!" Wáng lǎoshī xiàozhe shuō: "Nǐ hǎo!" Zhōngwǔ wǒ bù xiǎoxīn pèngdào tóngxué de shū, wǒ shuō: "Duìbuqǐ!" Tóngxué shuō: "Méi guānxi!"';
    const vi =
      'Buổi sáng tôi gặp thầy Vương ở trường, tôi nói: "Chào thầy ạ!" Thầy Vương mỉm cười đáp: "Chào em!" Buổi trưa tôi vô tình đụng trúng sách của bạn cùng lớp, tôi nói: "Xin lỗi nhé!" Bạn ấy đáp: "Không sao đâu!"';

    const result = splitReadingPassageSentences(zh, py, vi);
    expect(result.isAligned).toBe(true);
    expect(result.alignmentMode).toBe('verified-split');
    expect(result.sentences.length).toBe(4);
    expect(result.sentences[0].zh).toContain('老师，您好！');
    expect(result.sentences[0].pinyin).toContain('Lǎoshī, nín hǎo!');
    expect(result.sentences[0].vi).toContain('Chào thầy ạ!');
    expect(result.sentences[3].zh).toBe('同学说：“没关系！”');
  });

  it('prioritizes structured per-sentence data when provided', () => {
    const result = splitReadingPassageSentences('ignored', 'ignored', 'ignored', [
      { zh: '你好！', pinyin: 'Nǐ hǎo!', vi: 'Xin chào!' },
      { zh: '谢谢！', pinyin: 'Xièxie!', vi: 'Cảm ơn!' },
    ]);
    expect(result.isAligned).toBe(true);
    expect(result.alignmentMode).toBe('structured');
    expect(result.sentences.length).toBe(2);
    expect(result.sentences[1].pinyin).toBe('Xièxie!');
  });

  it('does not treat equal sentence counts as proof when terminal punctuation or quotes mismatch', () => {
    // 2 sentences in each, but sentence 1 is a question in zh and a statement in vi
    const result = splitReadingPassageSentences(
      '你好吗？我很好。',
      'Nǐ hǎo ma? Wǒ hěn hǎo.',
      'Bạn khỏe không. Tôi rất khỏe!'
    );
    expect(result.isAligned).toBe(false);
    expect(result.alignmentMode).toBe('block-fallback');
    expect(result.sentences.length).toBe(0);
    expect(result.zhSentences.length).toBe(2);
    expect(result.pySentences.length).toBe(2);
    expect(result.viSentences.length).toBe(2);
  });

  it('rejects equal counts when Hanzi vs Pinyin token ratio is incompatible', () => {
    const aligned = areSentencesLikelyAligned(
      ['今天天气很好，我和朋友去学校学习汉语。'],
      ['Hǎo.'],
      ['Hôm nay thời tiết rất đẹp, tôi và bạn đi trường học tiếng Hán.']
    );
    expect(aligned).toBe(false);
  });

  it('falls back safely when sentence counts differ', () => {
    const result = splitReadingPassageSentences(
      '第一句。第二句。',
      'Dì yī jù. Dì èr jù.',
      'Chỉ có một câu dịch.'
    );
    expect(result.isAligned).toBe(false);
    expect(result.alignmentMode).toBe('block-fallback');
    expect(result.zhSentences.length).toBe(2);
    expect(result.viSentences.length).toBe(1);
  });

  it('keeps removed buttons absent and per-word SRS intact in HskTextbookLessonPage', () => {
    const pageSrc = fs.readFileSync(
      path.resolve(import.meta.dir, '../features/lesson/pages/HskTextbookLessonPage.tsx'),
      'utf8'
    );
    expect(pageSrc).not.toContain('Luyện tập củng cố ngay');
    expect(pageSrc).not.toContain('Đọc từ vựng (');
    expect(pageSrc).not.toContain('Chế độ tập trung');
    expect(pageSrc).not.toContain('Lưu toàn bộ vào SRS');
    expect(pageSrc).toContain('handleToggleSrs(vocab)');
  });

  it('hides Vietnamese translations by default and supports optional optionsVi in ReadingPassageCard', () => {
    const cardSrc = fs.readFileSync(
      path.resolve(import.meta.dir, '../features/lesson/components/ReadingPassageCard.tsx'),
      'utf8'
    );
    expect(cardSrc).toContain('useState<boolean>(false)');
    expect(cardSrc).toContain('optionsVi');
    expect(cardSrc).toContain('isQuestionViVisible && optVi');
  });
});
