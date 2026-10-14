import type { ContentStatus } from './common-content.types';

export interface ChineseCharacter {
  id: string;
  character: string;
  pinyin: string;
  sinoVietnamese: string; // Âm Hán Việt (e.g. 'Nhĩ', 'Hảo', 'Thực')
  meaningVi: string;
  radical: string; // Bộ thủ (e.g. '亻 Nhân đứng', '口 Khẩu')
  strokeCount: number;
  strokeOrderUrl?: string;
  frequencyRank?: number;
  hskLevelId: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterFilters {
  search: string;
  hskLevelId: string; // 'ALL' or specific levelId
  status: 'ALL' | ContentStatus;
}

export interface UpdateCharacterDTO {
  character: string;
  pinyin: string;
  sinoVietnamese: string;
  meaningVi: string;
  radical: string;
  strokeCount: number;
  strokeOrderUrl?: string;
  frequencyRank?: number;
  hskLevelId: string;
  status: ContentStatus;
}
