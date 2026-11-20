// @ts-ignore
import { describe, it, expect } from 'bun:test';
import {
  HSK1_DICTIONARY_SUGGESTIONS,
  getHsk1DictionarySuggestion,
  getHsk1ManualReviewEntries,
  normalizePinyin,
} from '../management/admin/content/data/hsk1-dictionary.data';

describe('HSK 3.0 Level 1 Dictionary Suggestions & Homograph Validation', () => {
  it('should contain exactly 300 verified HSK 1 vocabulary entries', () => {
    const keys = Object.keys(HSK1_DICTIONARY_SUGGESTIONS);
    expect(keys.length).toBe(300);

    // Every entry must have non-empty Hanzi, Pinyin, MeaningVi, and PartOfSpeech
    for (const [key, entry] of Object.entries(HSK1_DICTIONARY_SUGGESTIONS)) {
      expect(entry.hanzi).toBe(key);
      expect(entry.pinyin.trim().length).toBeGreaterThan(0);
      expect(entry.meaningVi.trim().length).toBeGreaterThan(0);
      expect(entry.partOfSpeech.trim().length).toBeGreaterThan(0);
    }
  });

  describe('normalizePinyin', () => {
    it('normalizes casing and spaces while preserving tone marks', () => {
      expect(normalizePinyin(' dǎ diànhuà ')).toBe('dǎdiànhuà');
      expect(normalizePinyin('Hànyǔ')).toBe('hànyǔ');
      expect(normalizePinyin('bú kèqi')).toBe('búkèqi');
      expect(normalizePinyin('báitiān')).toBe('báitiān');
    });

    it('distinguishes different tones strictly', () => {
      expect(normalizePinyin('zhī')).not.toBe(normalizePinyin('zhǐ'));
      expect(normalizePinyin('hǎo')).not.toBe(normalizePinyin('hào'));
      expect(normalizePinyin('shǎo')).not.toBe(normalizePinyin('shào'));
      expect(normalizePinyin('kàn')).not.toBe(normalizePinyin('kān'));
    });
  });

  describe('getHsk1DictionarySuggestion', () => {
    it('returns EXACT suggestion when both Hanzi and Pinyin match', () => {
      const res = getHsk1DictionarySuggestion('爱', 'ài');
      expect(res.status).toBe('EXACT');
      expect(res.entry).toBeDefined();
      expect(res.entry?.meaningVi).toBe('yêu, thích');
      expect(res.entry?.partOfSpeech).toBe('Động từ');
    });

    it('REJECTS suggestion with PINYIN_MISMATCH when Hanzi matches but Pinyin does not (Homograph / Duoyinzi protection)', () => {
      // 1. 只: In HSK 1, pronounced 'zhī' (measure word). If user provides 'zhǐ' (adverb: only), MUST reject!
      const resZhi = getHsk1DictionarySuggestion('只', 'zhǐ');
      expect(resZhi.status).toBe('PINYIN_MISMATCH');
      expect(resZhi.entry).toBeUndefined();
      if (resZhi.status === 'PINYIN_MISMATCH') {
        expect(resZhi.candidatePinyin).toBe('zhī');
      }

      // 2. 会: In HSK 1, pronounced 'huì'. If 'kuài' (accounting), MUST reject!
      const resHui = getHsk1DictionarySuggestion('会', 'kuài');
      expect(resHui.status).toBe('PINYIN_MISMATCH');
      expect(resHui.entry).toBeUndefined();
      if (resHui.status === 'PINYIN_MISMATCH') {
        expect(resHui.candidatePinyin).toBe('huì');
      }

      // 3. 还: In HSK 1, pronounced 'hái'. If 'huán' (return), MUST reject!
      const resHai = getHsk1DictionarySuggestion('还', 'huán');
      expect(resHai.status).toBe('PINYIN_MISMATCH');
      expect(resHai.entry).toBeUndefined();
      if (resHai.status === 'PINYIN_MISMATCH') {
        expect(resHai.candidatePinyin).toBe('hái');
      }

      // 4. 看: In HSK 1, pronounced 'kàn'. If 'kān' (look after), MUST reject!
      const resKan = getHsk1DictionarySuggestion('看', 'kān');
      expect(resKan.status).toBe('PINYIN_MISMATCH');
      expect(resKan.entry).toBeUndefined();

      // 5. 都: In HSK 1, pronounced 'dōu'. If 'dū' (capital), MUST reject!
      const resDou = getHsk1DictionarySuggestion('都', 'dū');
      expect(resDou.status).toBe('PINYIN_MISMATCH');
      expect(resDou.entry).toBeUndefined();

      // 6. 少: In HSK 1, pronounced 'shǎo'. If 'shào' (youth), MUST reject!
      const resShao = getHsk1DictionarySuggestion('少', 'shào');
      expect(resShao.status).toBe('PINYIN_MISMATCH');
      expect(resShao.entry).toBeUndefined();
    });

    it('accepts valid pronunciation for homographs when Pinyin matches HSK 1 standard', () => {
      const resZhiValid = getHsk1DictionarySuggestion('只', 'zhī');
      expect(resZhiValid.status).toBe('EXACT');
      expect(resZhiValid.entry?.partOfSpeech).toBe('Lượng từ');

      const resHuiValid = getHsk1DictionarySuggestion('会', 'huì');
      expect(resHuiValid.status).toBe('EXACT');
      expect(resHuiValid.entry?.meaningVi).toContain('biết');

      const resHaiValid = getHsk1DictionarySuggestion('还', 'hái');
      expect(resHaiValid.status).toBe('EXACT');
      expect(resHaiValid.entry?.meaningVi).toContain('vẫn, còn');
    });

    it('returns NOT_FOUND for words not in HSK 1 dictionary', () => {
      const res = getHsk1DictionarySuggestion('苹果手机', 'píngguǒ shǒujī');
      expect(res.status).toBe('NOT_FOUND');
      expect(res.entry).toBeUndefined();
    });
  });

  describe('Manual Review Classification for Content Managers', () => {
    it('classifies ambiguous, polysemous, or homograph words for manual review', () => {
      const reviewList = getHsk1ManualReviewEntries();
      expect(reviewList.length).toBeGreaterThanOrEqual(20);

      const reviewHanzis = reviewList.map((e) => e.hanzi);
      expect(reviewHanzis).toContain('只');
      expect(reviewHanzis).toContain('会');
      expect(reviewHanzis).toContain('还');
      expect(reviewHanzis).toContain('少');
      expect(reviewHanzis).toContain('好');
      expect(reviewHanzis).toContain('看');
      expect(reviewHanzis).toContain('都');
      expect(reviewHanzis).toContain('没有');
      expect(reviewHanzis).toContain('本');
      expect(reviewHanzis).toContain('点');
      expect(reviewHanzis).toContain('和');
      expect(reviewHanzis).toContain('两');
      expect(reviewHanzis).toContain('喂');
      expect(reviewHanzis).toContain('在');
      expect(reviewHanzis).toContain('对');
      expect(reviewHanzis).toContain('多');

      // Every manual review entry must have clear notes explaining why it needs review
      for (const entry of reviewList) {
        expect(entry.manualReviewRequired).toBe(true);
        expect(entry.notes).toBeDefined();
        expect(entry.notes!.length).toBeGreaterThan(5);
      }
    });
  });
});
