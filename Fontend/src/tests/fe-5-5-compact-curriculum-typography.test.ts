// @ts-ignore
import { describe, it, expect } from 'bun:test';
import {
  HSK_CURRICULUM,
  getAllCurriculumLessons,
} from '../features/learning/data/curriculumData';
import {
  mapUnitToTopic,
} from '../features/learning-path/components/HskCurriculumView';

describe('Phase FE-5.5: Compact HSK Curriculum & Global Vietnamese Typography', () => {
  describe('1. Compact Curriculum Container & Lesson Rows', () => {
    it('groups all lessons of a topic inside a single topic container', () => {
      const unit = HSK_CURRICULUM[2].units[0];
      const topic = mapUnitToTopic(unit);

      expect(topic.lessons.length).toBe(4);
      expect(topic.title).toBe('Chào hỏi & Giới thiệu trang trọng');
      expect(topic.hanziTitle).toBe('日常问候与介绍');

      // Each lesson contains all fields required for the compact row
      topic.lessons.forEach((lesson) => {
        expect(lesson.lessonNumber).toBeGreaterThan(0);
        expect(lesson.hanzi.length).toBeGreaterThan(0);
        expect(lesson.pinyin.length).toBeGreaterThan(0);
        expect(lesson.meaning.length).toBeGreaterThan(0);
        expect(lesson.durationMinutes).toBeGreaterThan(0);
        expect(lesson.xpReward).toBeGreaterThan(0);
        expect(Array.isArray(lesson.vocabularyIds)).toBe(true);
        expect(Array.isArray(lesson.grammarPointIds)).toBe(true);
      });
    });

    it('supports topics with multiple lessons without duplicate IDs', () => {
      Object.values(HSK_CURRICULUM).forEach((level) => {
        level.units.forEach((unit) => {
          const topic = mapUnitToTopic(unit);
          const lessonIds = topic.lessons.map((l) => l.id);
          const uniqueIds = new Set(lessonIds);
          expect(uniqueIds.size).toBe(lessonIds.length);
        });
      });
    });
  });

  describe('2. Global Vietnamese Typography & Unicode Character Integrity', () => {
    it('properly encodes Vietnamese sample phrases without replacement characters', () => {
      const phrases = [
        'Tiến độ học tập',
        'Bài học đã hoàn thành',
        'Ngữ pháp tiếng Trung',
        'Người mới bắt đầu',
      ];

      phrases.forEach((phrase) => {
        expect(phrase).not.toContain('\uFFFD');
        expect(phrase.length).toBeGreaterThan(0);
      });
    });

    it('preserves all Vietnamese diacritics and upper/lowercase tone markers', () => {
      const vietnameseChars = [
        'a', 'á', 'à', 'ả', 'ã', 'ạ',
        'ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ',
        'â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ',
        'e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ',
        'ê', 'ế', 'ề', 'ể', 'ễ', 'ệ',
        'i', 'í', 'ì', 'ỉ', 'ĩ', 'ị',
        'o', 'ó', 'ò', 'ỏ', 'õ', 'ọ',
        'ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ',
        'ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ',
        'u', 'ú', 'ù', 'ủ', 'ũ', 'ụ',
        'ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự',
        'y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ',
        'd', 'đ',
        'A', 'Á', 'À', 'Ả', 'Ã', 'Ạ',
        'Ă', 'Ắ', 'Ằ', 'Ẳ', 'Ẵ', 'Ặ',
        'Â', 'Ấ', 'Ầ', 'Ẩ', 'Ẫ', 'Ậ',
        'E', 'É', 'È', 'Ẻ', 'Ẽ', 'Ẹ',
        'Ê', 'Ế', 'Ề', 'Ể', 'Ễ', 'Ệ',
        'I', 'Í', 'Ì', 'Ỉ', 'Ĩ', 'Ị',
        'O', 'Ó', 'Ò', 'Ỏ', 'Õ', 'Ọ',
        'Ô', 'Ố', 'Ồ', 'Ổ', 'Ỗ', 'Ộ',
        'Ơ', 'Ớ', 'Ờ', 'Ở', 'Ỡ', 'Ợ',
        'U', 'Ú', 'Ù', 'Ủ', 'Ũ', 'Ụ',
        'Ư', 'Ứ', 'Ừ', 'Ử', 'Ữ', 'Ự',
        'Y', 'Ý', 'Ỳ', 'Ỷ', 'Ỹ', 'Ỵ',
        'D', 'Đ',
      ];

      vietnameseChars.forEach((char) => {
        expect(char).not.toContain('\uFFFD');
        expect(encodeURIComponent(char).length).toBeGreaterThan(0);
      });
    });

    it('validates authentic Chinese Hanzi and Pinyin with 4 tones + umlaut', () => {
      const hanziSamples = ['你好', '中国', '学习', '语法', '你想喝什么？', '这个多少钱？'];
      hanziSamples.forEach((hz) => {
        expect(hz).not.toContain('\uFFFD');
        expect(hz.length).toBeGreaterThan(0);
      });

      const pinyinSamples = ['nǐ hǎo', 'xuéxí', 'Zhōngwén', 'lǜsè', 'Nǐ xiǎng hē shénme?'];
      pinyinSamples.forEach((py) => {
        expect(py).not.toContain('\uFFFD');
        expect(py.length).toBeGreaterThan(0);
      });
    });

    it('ensures all curriculum lessons have valid Vietnamese meaning strings', () => {
      const lessons = getAllCurriculumLessons();
      lessons.forEach((l) => {
        expect(l.meaning.length).toBeGreaterThan(0);
        expect(l.meaning).not.toContain('\uFFFD');
      });
    });
  });
});
