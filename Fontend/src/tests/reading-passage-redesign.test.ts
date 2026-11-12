// @ts-ignore
import { describe, it, expect } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { splitReadingPassageSentences } from '../features/lesson/components/ReadingPassageCard';

describe('HSK Lesson Redesign & Reading Passage Contract', () => {
  it('splits HSK 1 Lesson 1 passage into 4 aligned sentences without breaking Pinyin syllables or quotes', () => {
    const zh =
      '早上我在学校看见王老师，我说：“老师，您好！” 王老师笑着说：“你好！” 中午我不小心碰到同学的书，我说：“对不起！” 同学说：“没关系！”';
    const py =
      'Zǎoshang wǒ zài xuéxiào kànjiàn Wáng lǎoshī, wǒ shuō: "Lǎoshī, nín hǎo!" Wáng lǎoshī xiàozhe shuō: "Nǐ hǎo!" Zhōngwǔ wǒ bù xiǎoxīn pèngdào tóngxué de shū, wǒ shuō: "Duìbuqǐ!" Tóngxué shuō: "Méi guānxi!"';
    const vi =
      'Buổi sáng tôi gặp thầy Vương ở trường, tôi nói: "Chào thầy ạ!" Thầy Vương mỉm cười đáp: "Chào em!" Buổi trưa tôi vô tình đụng trúng sách của bạn cùng lớp, tôi nói: "Xin lỗi nhé!" Bạn ấy đáp: "Không sao đâu!"';

    const result = splitReadingPassageSentences(zh, py, vi);
    expect(result.isAligned).toBe(true);
    expect(result.sentences.length).toBe(4);
    expect(result.sentences[0].zh).toContain('老师，您好！');
    expect(result.sentences[0].pinyin).toContain('Lǎoshī, nín hǎo!');
    expect(result.sentences[0].vi).toContain('Chào thầy ạ!');
    expect(result.sentences[3].zh).toBe('同学说：“没关系！”');
  });

  it('marks isAligned=false instead of misaligning when sentence counts differ', () => {
    const result = splitReadingPassageSentences(
      '第一句。第二句。',
      'Dì yī jù. Dì èr jù.',
      'Chỉ có một câu dịch.'
    );
    expect(result.isAligned).toBe(false);
    expect(result.sentences.length).toBe(0);
  });

  it('removes unnecessary buttons from HskTextbookLessonPage while keeping per-word SRS save', () => {
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
});

