import {
  MOCK_CHARACTERS,
  MOCK_GRAMMAR_POINTS,
  MOCK_HSK_LEVELS,
  MOCK_STANDARDS,
  MOCK_VOCABULARIES,
} from '../data/mockHskRepositoryData';
import { httpClient } from '../../../../core/api/client/http-client';
import { authTokenService } from '../../../../core/api/client/auth-token.service';
import type {
  CharacterFilters,
  ChineseCharacter,
  CreateVocabularyDTO,
  GrammarFilters,
  GrammarPoint,
  HskLevel,
  HskStandard,
  UpdateCharacterDTO,
  UpdateGrammarDTO,
  UpdateHskLevelDTO,
  UpdateVocabularyDTO,
  Vocabulary,
  VocabularyFilters,
  VocabularyImportResultDto,
  BatchPublishResultDto,
  BatchUpdateMeaningItemDTO,
  BatchUpdateMeaningsResultDTO,
  ReviewContentDTO,
  BatchReviewContentDTO,
  BatchReviewResultDto,
} from '../types';

let standards = [...MOCK_STANDARDS];
let levels = [...MOCK_HSK_LEVELS];
let vocabularies: Vocabulary[] = [];
let characters: ChineseCharacter[] = [];
let grammarPoints: GrammarPoint[] = [];

class HskRepositoryService {
  loadFixturesForTesting(): void {
    standards = [...MOCK_STANDARDS];
    levels = [...MOCK_HSK_LEVELS];
    vocabularies = [...MOCK_VOCABULARIES];
    characters = [...MOCK_CHARACTERS];
    grammarPoints = [...MOCK_GRAMMAR_POINTS];
  }

  getStandards(): HskStandard[] {
    return standards.map((s) => ({ ...s }));
  }

  getLevels(standardId?: string): HskLevel[] {
    const list = standardId ? levels.filter((l) => l.standardId === standardId) : levels;
    return list.sort((a, b) => a.orderIndex - b.orderIndex).map((l) => ({ ...l }));
  }

  getLevelById(id: string): HskLevel | undefined {
    const found = levels.find((l) => l.id === id);
    return found ? { ...found } : undefined;
  }

  updateLevel(id: string, dto: UpdateHskLevelDTO): HskLevel {
    const index = levels.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Không tìm thấy cấp độ HSK: ${id}`);
    levels[index] = {
      ...levels[index],
      name: dto.name.trim(),
      targetVocabularyCount: dto.targetVocabularyCount,
      targetCharacterCount: dto.targetCharacterCount,
      active: dto.active,
    };
    return { ...levels[index] };
  }

  // --- Vocabulary ---
  async syncVocabulariesFromApi(params?: { hskLevel?: number; missingMeaningVi?: boolean; pageSize?: number }): Promise<void> {
    const queryParams: Record<string, any> = { pageSize: params?.pageSize ?? 500, page: 1 };
    if (params?.hskLevel) queryParams.hskLevel = params.hskLevel;
    if (params?.missingMeaningVi !== undefined) queryParams.missingMeaningVi = params.missingMeaningVi;

    const res = await httpClient.get<any>('/content/vocabularies', {
      params: queryParams,
    });
    let items = Array.isArray(res) ? res : (res?.items || []);
    const totalPages = res?.totalPages ?? 1;

    if (totalPages > 1) {
      for (let p = 2; p <= totalPages; p++) {
        const nextRes = await httpClient.get<any>('/content/vocabularies', {
          params: { ...queryParams, page: p },
        });
        const nextItems = Array.isArray(nextRes) ? nextRes : (nextRes?.items || []);
        items = [...items, ...nextItems];
      }
    }

    vocabularies = items.map((v: any) => ({
      id: v.id,
      hskLevelId: `level-hsk-${v.hskLevel || 1}`,
      simplified: v.hanzi,
      traditional: v.traditional || v.hanzi,
      pinyin: v.pinyin,
      meaningVi: v.meaningVi || '',
      suggestedMeaningVi: v.suggestedMeaningVi || '',
      meaningEn: v.meaningEn || '',
      partOfSpeech: v.partOfSpeech || 'danh từ',
      audioUrl: v.audioUrl || '',
      status: v.status || 'PUBLISHED',
      sourceDataset: v.sourceDataset,
      sourceEntryId: v.sourceEntryId,
      sourceId: v.sourceId || v.sourceEntryId,
      entry: v.entry,
      homograph: v.homograph,
      levelLabel: v.levelLabel,
      sourcePdfPage: v.sourcePdfPage,
      updatedByUserId: v.updatedByUserId,
      reviewedByUserId: v.reviewedByUserId,
      reviewedAt: v.reviewedAt,
      reviewNotes: v.reviewNotes,
      examples: typeof v.examplesJson === 'string' && v.examplesJson ? JSON.parse(v.examplesJson) : (v.examples || []),
      source: (v.sourceDataset && v.sourceEntryId) ? `${v.sourceDataset} (ID: ${v.sourceEntryId})` : (v.sourceId ? `HSK 3.0 (ID: ${v.sourceId})` : 'Live SQL Server'),
      createdAt: v.createdAt || new Date().toISOString(),
      updatedAt: v.updatedAt || v.createdAt || new Date().toISOString(),
    }));
  }

  async importVocabulariesCsvAsync(file: File, dryRun: boolean): Promise<VocabularyImportResultDto> {
    const formData = new FormData();
    formData.append('file', file);
    const raw = await httpClient.post<any>(
      `/content/vocabularies/${dryRun ? 'import-preview' : 'import-csv'}?dryRun=${dryRun}`,
      formData
    );
    return {
      totalRows: raw.totalRows ?? 0,
      importedCount: raw.successCount ?? raw.importedCount ?? 0,
      skippedCount: raw.skippedDuplicateCount ?? raw.skippedCount ?? 0,
      failedCount: raw.errorCount ?? raw.failedCount ?? 0,
      isDryRun: raw.dryRun ?? raw.isDryRun ?? dryRun,
      errors: (raw.errors || []).map((e: any) => ({
        rowNumber: e.rowNumber,
        sourceDataset: e.sourceDataset,
        sourceEntryId: e.sourceEntryId,
        sourceId: e.sourceId || e.sourceEntryId,
        hanzi: e.hanzi,
        errorMessage: e.reason || e.errorMessage || 'Lỗi định dạng',
      })),
      previewSample: (raw.previewItems || raw.previewSample || []).map((p: any) => ({
        id: p.sourceEntryId || p.sourceId || `${p.rowNumber}`,
        sourceDataset: p.sourceDataset,
        sourceEntryId: p.sourceEntryId,
        level: String(p.hskLevel),
        hskLevel: p.hskLevel,
        hanzi: p.hanzi,
        pinyin: p.pinyin,
        partOfSpeech: p.partOfSpeech,
        entry: p.entry,
        homograph: p.homograph,
        levelLabel: p.levelLabel,
        sourcePdfPage: p.sourcePdfPage,
        isExisting: p.isDuplicate ?? p.isExisting ?? false,
        status: p.status || 'DRAFT',
      })),
    };
  }

  async downloadVocabularyExcelTemplateAsync(): Promise<void> {
    const token = authTokenService.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch('/api/v1/content/vocabularies/import-template', {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      throw new Error(`Tải template thất bại (Mã lỗi ${response.status})`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Mau_Import_TuVung_HSK.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async exportVocabulariesExcelAsync(params?: {
    hskLevel?: number;
    partOfSpeech?: string;
    status?: string;
    search?: string;
    missingMeaningVi?: boolean;
    needsReview?: boolean;
  }): Promise<void> {
    const token = authTokenService.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const query = new URLSearchParams();
    if (params?.hskLevel && params.hskLevel > 0) query.append('hskLevel', String(params.hskLevel));
    if (params?.partOfSpeech && params.partOfSpeech !== 'ALL') query.append('partOfSpeech', params.partOfSpeech);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.search && params.search.trim()) query.append('search', params.search.trim());
    if (params?.missingMeaningVi !== undefined) query.append('missingMeaningVi', String(params.missingMeaningVi));
    if (params?.needsReview !== undefined) query.append('needsReview', String(params.needsReview));

    const qs = query.toString();
    const urlStr = `/api/v1/content/vocabularies/export-excel${qs ? `?${qs}` : ''}`;

    const response = await fetch(urlStr, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      throw new Error(`Xuất file Excel thất bại (Mã lỗi ${response.status})`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const contentDisposition = response.headers.get('content-disposition');
    let fileName = `ZhongWenHub_TuVung_HSK_${new Date().toISOString().slice(0, 10)}.xlsx`;
    if (contentDisposition && contentDisposition.includes('filename=')) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        fileName = match[1].replace(/['"]/g, '');
      }
    }
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async importVocabulariesExcelAsync(file: File, dryRun: boolean): Promise<VocabularyImportResultDto> {
    const formData = new FormData();
    formData.append('file', file);
    const raw = await httpClient.post<any>(
      `/content/vocabularies/${dryRun ? 'import-excel/preview' : 'import-excel'}?dryRun=${dryRun}`,
      formData
    );
    return {
      totalRows: raw.totalRows ?? 0,
      importedCount: raw.successCount ?? raw.importedCount ?? 0,
      skippedCount: raw.skippedDuplicateCount ?? raw.skippedCount ?? 0,
      failedCount: raw.errorCount ?? raw.failedCount ?? 0,
      isDryRun: raw.dryRun ?? raw.isDryRun ?? dryRun,
      errors: (raw.errors || []).map((e: any) => ({
        rowNumber: e.rowNumber,
        columnName: e.columnName,
        sourceDataset: e.sourceDataset,
        sourceEntryId: e.sourceEntryId,
        sourceId: e.sourceId || e.sourceEntryId,
        hanzi: e.hanzi,
        errorMessage: (e.columnName ? `[Cột ${e.columnName}] ` : '') + (e.reason || e.errorMessage || 'Lỗi định dạng'),
      })),
      previewSample: (raw.previewItems || raw.previewSample || []).map((p: any) => ({
        id: p.sourceEntryId || p.sourceId || `${p.rowNumber}`,
        sourceDataset: p.sourceDataset,
        sourceEntryId: p.sourceEntryId,
        level: String(p.hskLevel),
        hskLevel: p.hskLevel,
        hanzi: p.hanzi,
        pinyin: p.pinyin,
        meaningVi: p.meaningVi || '',
        meaningEn: p.meaningEn || '',
        partOfSpeech: p.partOfSpeech,
        exampleHanzi: p.exampleHanzi,
        examplePinyin: p.examplePinyin,
        exampleMeaningVi: p.exampleMeaningVi,
        entry: p.entry,
        homograph: p.homograph,
        levelLabel: p.levelLabel,
        sourcePdfPage: p.sourcePdfPage,
        isExisting: p.isDuplicate ?? p.isExisting ?? false,
        status: p.status || 'DRAFT',
      })),
    };
  }

  async createVocabularyAsync(dto: CreateVocabularyDTO): Promise<Vocabulary> {
    const hskLevel = Number(dto.hskLevelId.replace('level-hsk-', '')) || 1;
    const payload = {
      hskLevel,
      hanzi: dto.simplified.trim(),
      traditional: dto.traditional?.trim() || dto.simplified.trim(),
      pinyin: dto.pinyin.trim(),
      meaningVi: dto.meaningVi?.trim() || '',
      meaningEn: dto.meaningEn?.trim() || '',
      partOfSpeech: dto.partOfSpeech.trim(),
      audioUrl: dto.audioUrl?.trim() || '',
      examplesJson: JSON.stringify(dto.examples || []),
      status: dto.status || 'PUBLISHED',
      sourceDataset: dto.sourceDataset,
      sourceEntryId: dto.sourceEntryId || dto.sourceId,
      sourceId: dto.sourceId || dto.sourceEntryId,
      entry: dto.entry,
      homograph: dto.homograph,
      levelLabel: dto.levelLabel,
      sourcePdfPage: dto.sourcePdfPage,
    };

    const res = await httpClient.post<any>('/content/vocabularies', payload);
    const newVocab: Vocabulary = {
      id: res.id,
      hskLevelId: `level-hsk-${res.hskLevel || hskLevel}`,
      simplified: res.hanzi,
      traditional: res.traditional || res.hanzi,
      pinyin: res.pinyin,
      meaningVi: res.meaningVi || '',
      meaningEn: res.meaningEn || '',
      partOfSpeech: res.partOfSpeech || dto.partOfSpeech,
      audioUrl: res.audioUrl || '',
      status: res.status || 'PUBLISHED',
      sourceDataset: res.sourceDataset,
      sourceEntryId: res.sourceEntryId,
      sourceId: res.sourceId || res.sourceEntryId,
      entry: res.entry,
      homograph: res.homograph,
      levelLabel: res.levelLabel,
      sourcePdfPage: res.sourcePdfPage,
      examples: (dto.examples || []).map((ex, idx) => ({ id: `ex-${res.id}-${idx}`, ...ex })),
      source: (res.sourceDataset && res.sourceEntryId) ? `${res.sourceDataset} (ID: ${res.sourceEntryId})` : (res.sourceId ? `HSK 3.0 (ID: ${res.sourceId})` : 'Tạo từ CMS'),
      createdAt: res.createdAt || new Date().toISOString(),
      updatedAt: res.updatedAt || res.createdAt || new Date().toISOString(),
    };
    vocabularies = [newVocab, ...vocabularies];
    return newVocab;
  }

  async updateVocabularyAsync(id: string, dto: UpdateVocabularyDTO): Promise<Vocabulary> {
    const hskLevel = Number(dto.hskLevelId.replace('level-hsk-', '')) || 1;
    const payload = {
      hskLevel,
      hanzi: dto.simplified.trim(),
      traditional: dto.traditional?.trim() || dto.simplified.trim(),
      pinyin: dto.pinyin.trim(),
      meaningVi: dto.meaningVi?.trim() || '',
      meaningEn: dto.meaningEn?.trim() || '',
      partOfSpeech: dto.partOfSpeech.trim(),
      audioUrl: dto.audioUrl?.trim() || '',
      examplesJson: JSON.stringify(dto.examples || []),
      status: dto.status || 'PUBLISHED',
      sourceDataset: dto.sourceDataset,
      sourceEntryId: dto.sourceEntryId || dto.sourceId,
      sourceId: dto.sourceId || dto.sourceEntryId,
      entry: dto.entry,
      homograph: dto.homograph,
      levelLabel: dto.levelLabel,
      sourcePdfPage: dto.sourcePdfPage,
    };

    const res = await httpClient.put<any>(`/content/vocabularies/${id}`, payload);
    const updated: Vocabulary = {
      id: res.id,
      hskLevelId: `level-hsk-${res.hskLevel || hskLevel}`,
      simplified: res.hanzi,
      traditional: res.traditional || res.hanzi,
      pinyin: res.pinyin,
      meaningVi: res.meaningVi || '',
      meaningEn: res.meaningEn || '',
      partOfSpeech: res.partOfSpeech || dto.partOfSpeech,
      audioUrl: res.audioUrl || '',
      status: res.status || 'PUBLISHED',
      sourceDataset: res.sourceDataset,
      sourceEntryId: res.sourceEntryId,
      sourceId: res.sourceId || res.sourceEntryId,
      entry: res.entry,
      homograph: res.homograph,
      levelLabel: res.levelLabel,
      sourcePdfPage: res.sourcePdfPage,
      examples: dto.examples || [],
      source: (res.sourceDataset && res.sourceEntryId) ? `${res.sourceDataset} (ID: ${res.sourceEntryId})` : (res.sourceId ? `HSK 3.0 (ID: ${res.sourceId})` : 'Cập nhật từ CMS'),
      createdAt: res.createdAt || new Date().toISOString(),
      updatedAt: res.updatedAt || new Date().toISOString(),
    };

    vocabularies = vocabularies.map((v) => (v.id === id ? updated : v));
    return updated;
  }

  async deleteVocabularyAsync(id: string): Promise<boolean> {
    await httpClient.delete(`/content/vocabularies/${id}`);
    vocabularies = vocabularies.filter((v) => v.id !== id);
    return true;
  }

  async batchPublishVocabulariesAsync(ids: string[]): Promise<BatchPublishResultDto> {
    const res = await httpClient.post<BatchPublishResultDto>('/content/vocabularies/batch-publish', { ids });
    return res;
  }

  async batchUpdateMeaningsAsync(items: BatchUpdateMeaningItemDTO[]): Promise<BatchUpdateMeaningsResultDTO> {
    const res = await httpClient.post<BatchUpdateMeaningsResultDTO>('/admin/vocabularies/batch-update-meanings', { items });
    return res;
  }

  async reviewVocabularyAsync(id: string, dto: ReviewContentDTO): Promise<Vocabulary> {
    const res = await httpClient.put<any>(`/content/vocabularies/${id}/review`, dto);
    const updated: Vocabulary = {
      id: res.id,
      hskLevelId: `level-hsk-${res.hskLevel || 1}`,
      simplified: res.hanzi,
      traditional: res.traditional || res.hanzi,
      pinyin: res.pinyin,
      meaningVi: res.meaningVi || '',
      suggestedMeaningVi: res.suggestedMeaningVi || '',
      meaningEn: res.meaningEn || '',
      partOfSpeech: res.partOfSpeech || 'danh từ',
      audioUrl: res.audioUrl || '',
      status: res.status || 'PUBLISHED',
      sourceDataset: res.sourceDataset,
      sourceEntryId: res.sourceEntryId,
      sourceId: res.sourceId || res.sourceEntryId,
      entry: res.entry,
      homograph: res.homograph,
      levelLabel: res.levelLabel,
      sourcePdfPage: res.sourcePdfPage,
      updatedByUserId: res.updatedByUserId,
      reviewedByUserId: res.reviewedByUserId,
      reviewedAt: res.reviewedAt,
      reviewNotes: res.reviewNotes,
      examples: typeof res.examplesJson === 'string' && res.examplesJson ? JSON.parse(res.examplesJson) : (res.examples || []),
      source: (res.sourceDataset && res.sourceEntryId) ? `${res.sourceDataset} (ID: ${res.sourceEntryId})` : (res.sourceId ? `HSK 3.0 (ID: ${res.sourceId})` : 'Live SQL Server'),
      createdAt: res.createdAt || new Date().toISOString(),
      updatedAt: res.updatedAt || new Date().toISOString(),
    };

    const idx = vocabularies.findIndex((v) => v.id === id);
    if (idx !== -1) {
      vocabularies[idx] = updated;
    }
    return updated;
  }

  async batchReviewVocabulariesAsync(dto: BatchReviewContentDTO): Promise<BatchReviewResultDto> {
    const res = await httpClient.post<BatchReviewResultDto>('/content/vocabularies/batch-review', dto);
    return res;
  }

  getVocabularies(filters?: VocabularyFilters): Vocabulary[] {
    let result = [...vocabularies];

    if (filters?.hskLevelId && filters.hskLevelId !== 'ALL') {
      result = result.filter((v) => v.hskLevelId === filters.hskLevelId);
    }

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((v) => v.status === filters.status);
    }

    if (filters?.partOfSpeech && filters.partOfSpeech !== 'ALL') {
      result = result.filter((v) => v.partOfSpeech.toLowerCase().includes(filters.partOfSpeech.toLowerCase()));
    }

    if (filters?.missingMeaningVi) {
      result = result.filter((v) => !v.meaningVi || v.meaningVi.trim() === '');
    }

    if (filters?.auditRisk === 'NEEDS_REVIEW') {
      result = result.filter((v) => v.status === 'PENDING_REVIEW' || !v.meaningVi);
    } else if (filters?.auditRisk === 'HOMOGRAPH_DUOYINZI') {
      result = result.filter((v) => !!v.homograph || (v.entry && v.entry.includes('(')));
    } else if (filters?.auditRisk === 'MISSING_MEANING') {
      result = result.filter((v) => !v.meaningVi || v.meaningVi.trim() === '');
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.simplified.toLowerCase().includes(q) ||
          v.traditional.toLowerCase().includes(q) ||
          v.pinyin.toLowerCase().includes(q) ||
          v.meaningVi.toLowerCase().includes(q) ||
          v.meaningEn.toLowerCase().includes(q)
      );
    }

    return result.map((v) => ({ ...v, examples: v.examples.map((e) => ({ ...e })) }));
  }

  getVocabularyById(id: string): Vocabulary | undefined {
    const found = vocabularies.find((v) => v.id === id);
    return found ? { ...found, examples: found.examples.map((e) => ({ ...e })) } : undefined;
  }

  createVocabulary(dto: CreateVocabularyDTO): Vocabulary {
    const newVocab: Vocabulary = {
      id: `voc-${Date.now()}`,
      hskLevelId: dto.hskLevelId,
      simplified: dto.simplified.trim(),
      traditional: dto.traditional.trim() || dto.simplified.trim(),
      pinyin: dto.pinyin.trim(),
      meaningVi: dto.meaningVi.trim(),
      meaningEn: dto.meaningEn.trim(),
      partOfSpeech: dto.partOfSpeech.trim(),
      audioUrl: dto.audioUrl?.trim(),
      examples: dto.examples.map((ex, idx) => ({
        id: `ex-${Date.now()}-${idx}`,
        ...ex,
      })),
      status: dto.status,
      source: 'Thêm thủ công từ CMS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    vocabularies = [newVocab, ...vocabularies];
    return { ...newVocab };
  }

  updateVocabulary(id: string, dto: UpdateVocabularyDTO): Vocabulary {
    const index = vocabularies.findIndex((v) => v.id === id);
    if (index === -1) throw new Error(`Không tìm thấy từ vựng: ${id}`);

    const updated: Vocabulary = {
      ...vocabularies[index],
      hskLevelId: dto.hskLevelId,
      simplified: dto.simplified.trim(),
      traditional: dto.traditional.trim() || dto.simplified.trim(),
      pinyin: dto.pinyin.trim(),
      meaningVi: dto.meaningVi.trim(),
      meaningEn: dto.meaningEn.trim(),
      partOfSpeech: dto.partOfSpeech.trim(),
      audioUrl: dto.audioUrl?.trim(),
      examples: dto.examples.map((e) => ({ ...e })),
      status: dto.status,
      updatedAt: new Date().toISOString(),
    };

    vocabularies[index] = updated;
    return { ...updated };
  }

  // --- Chinese Characters ---
  async syncCharactersFromApi(params?: { hskLevel?: number; search?: string; pageSize?: number }): Promise<void> {
    const queryParams: Record<string, any> = { pageSize: params?.pageSize ?? 500, page: 1 };
    if (params?.hskLevel) queryParams.hskLevel = params.hskLevel;
    if (params?.search) queryParams.search = params.search;

    const res = await httpClient.get<any>('/content/characters', { params: queryParams });
    let items = Array.isArray(res) ? res : (res?.items || []);
    const totalPages = res?.totalPages ?? 1;

    if (totalPages > 1) {
      for (let p = 2; p <= totalPages; p++) {
        const nextRes = await httpClient.get<any>('/content/characters', {
          params: { ...queryParams, page: p },
        });
        const nextItems = Array.isArray(nextRes) ? nextRes : (nextRes?.items || []);
        items = [...items, ...nextItems];
      }
    }

    characters = items.map((c: any) => ({
      id: c.id,
      character: c.character,
      pinyin: c.pinyin || '',
      sinoVietnamese: c.sinoVietnamese || '',
      meaningVi: c.meaningVi || '',
      radical: c.radical || '',
      strokeCount: c.strokeCount || 0,
      hskLevelId: `level-hsk-${c.firstHskLevel || 1}`,
      status: 'PUBLISHED',
      createdAt: c.createdAt || new Date().toISOString(),
      updatedAt: c.updatedAt || new Date().toISOString(),
    }));
  }

  async updateCharacterAsync(id: string, dto: UpdateCharacterDTO): Promise<ChineseCharacter> {
    const hskLevel = Number(dto.hskLevelId.replace('level-hsk-', '')) || 1;
    const payload = {
      pinyin: dto.pinyin.trim(),
      sinoVietnamese: dto.sinoVietnamese?.trim(),
      meaningVi: dto.meaningVi?.trim(),
      strokeCount: dto.strokeCount,
      radical: dto.radical?.trim(),
      firstHskLevel: hskLevel,
    };

    const res = await httpClient.put<any>(`/content/characters/${id}`, payload);
    const updated: ChineseCharacter = {
      id: res.id,
      character: res.character,
      pinyin: res.pinyin || '',
      sinoVietnamese: res.sinoVietnamese || '',
      meaningVi: res.meaningVi || '',
      radical: res.radical || '',
      strokeCount: res.strokeCount || 0,
      hskLevelId: `level-hsk-${res.firstHskLevel || hskLevel}`,
      status: 'PUBLISHED',
      createdAt: res.createdAt || new Date().toISOString(),
      updatedAt: res.updatedAt || new Date().toISOString(),
    };

    const idx = characters.findIndex((c) => c.id === id);
    if (idx !== -1) {
      characters[idx] = updated;
    }
    return updated;
  }

  getCharacters(filters?: CharacterFilters): ChineseCharacter[] {
    let result = [...characters];

    if (filters?.hskLevelId && filters.hskLevelId !== 'ALL') {
      result = result.filter((c) => c.hskLevelId === filters.hskLevelId);
    }

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((c) => c.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.character.includes(q) ||
          c.pinyin.toLowerCase().includes(q) ||
          c.sinoVietnamese.toLowerCase().includes(q) ||
          c.meaningVi.toLowerCase().includes(q)
      );
    }

    return result.map((c) => ({ ...c }));
  }

  getCharacterById(id: string): ChineseCharacter | undefined {
    const found = characters.find((c) => c.id === id);
    return found ? { ...found } : undefined;
  }

  updateCharacter(id: string, dto: UpdateCharacterDTO): ChineseCharacter {
    const index = characters.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Không tìm thấy chữ Hán: ${id}`);

    const updated: ChineseCharacter = {
      ...characters[index],
      ...dto,
      character: dto.character.trim(),
      pinyin: dto.pinyin.trim(),
      sinoVietnamese: dto.sinoVietnamese.trim(),
      meaningVi: dto.meaningVi.trim(),
      updatedAt: new Date().toISOString(),
    };

    characters[index] = updated;
    return { ...updated };
  }

  // --- Grammar Points ---
  async syncGrammarFromApi(params?: { hskLevel?: number; status?: string; pageSize?: number }): Promise<void> {
    const queryParams: Record<string, any> = { pageSize: params?.pageSize ?? 500, page: 1 };
    if (params?.hskLevel) queryParams.hskLevel = params.hskLevel;
    if (params?.status && params.status !== 'ALL') queryParams.status = params.status;

    const res = await httpClient.get<any>('/admin/grammar', { params: queryParams });
    let items = Array.isArray(res) ? res : (res?.items || []);
    const totalPages = res?.totalPages ?? 1;

    if (totalPages > 1) {
      for (let p = 2; p <= totalPages; p++) {
        const nextRes = await httpClient.get<any>('/admin/grammar', {
          params: { ...queryParams, page: p },
        });
        const nextItems = Array.isArray(nextRes) ? nextRes : (nextRes?.items || []);
        items = [...items, ...nextItems];
      }
    }

    grammarPoints = items.map((g: any) => {
      let examples = [];
      if (typeof g.examplesJson === 'string' && g.examplesJson) {
        try { examples = JSON.parse(g.examplesJson); } catch { examples = []; }
      } else if (Array.isArray(g.examples)) {
        examples = g.examples;
      }
      return {
        id: g.id,
        code: g.code || `g-${g.id?.substring(0, 8)}`,
        title: g.title,
        pinyinTitle: g.pinyinTitle || '',
        hskLevelId: `level-hsk-${g.hskLevel || 1}`,
        category: g.category || 'cơ bản',
        structureFormula: g.structureFormula || '',
        explanation: g.explanation || '',
        difficulty: g.difficulty || 'Dễ',
        status: g.status || 'PUBLISHED',
        reviewedAt: g.reviewedAt,
        reviewedByUserId: g.reviewedByUserId,
        reviewNotes: g.reviewNotes,
        examples,
        createdAt: g.createdAt || new Date().toISOString(),
        updatedAt: g.updatedAt || new Date().toISOString(),
      };
    });
  }

  async reviewGrammarAsync(id: string, dto: ReviewContentDTO): Promise<GrammarPoint> {
    const res = await httpClient.put<any>(`/content/grammar/${id}/review`, dto);
    const updated: GrammarPoint = {
      id: res.id,
      code: res.code,
      title: res.title,
      pinyinTitle: res.pinyinTitle || '',
      hskLevelId: `level-hsk-${res.hskLevel || 1}`,
      category: res.category || 'cơ bản',
      structureFormula: res.structureFormula || '',
      explanation: res.explanation || '',
      difficulty: res.difficulty || 'Dễ',
      status: res.status,
      reviewedAt: res.reviewedAt,
      reviewedByUserId: res.reviewedByUserId,
      reviewNotes: res.reviewNotes,
      examples: typeof res.examplesJson === 'string' && res.examplesJson ? JSON.parse(res.examplesJson) : (res.examples || []),
      createdAt: res.createdAt || new Date().toISOString(),
      updatedAt: res.updatedAt || new Date().toISOString(),
    };

    const idx = grammarPoints.findIndex((g) => g.id === id);
    if (idx !== -1) {
      grammarPoints[idx] = updated;
    }
    return updated;
  }

  async batchReviewGrammarPointsAsync(dto: BatchReviewContentDTO): Promise<BatchReviewResultDto> {
    const res = await httpClient.post<BatchReviewResultDto>('/content/grammar/batch-review', dto);
    return res;
  }

  async batchPublishGrammarPointsAsync(ids: string[]): Promise<BatchPublishResultDto> {
    const res = await httpClient.post<BatchPublishResultDto>('/content/grammar/batch-publish', { ids });
    return res;
  }
  getGrammarPoints(filters?: GrammarFilters): GrammarPoint[] {
    let result = [...grammarPoints];

    if (filters?.hskLevelId && filters.hskLevelId !== 'ALL') {
      result = result.filter((g) => g.hskLevelId === filters.hskLevelId);
    }

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((g) => g.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.code.toLowerCase().includes(q) ||
          g.title.toLowerCase().includes(q) ||
          g.structureFormula.toLowerCase().includes(q) ||
          g.explanation.toLowerCase().includes(q)
      );
    }

    return result.map((g) => ({ ...g, examples: g.examples.map((e) => ({ ...e })) }));
  }

  getGrammarById(id: string): GrammarPoint | undefined {
    const found = grammarPoints.find((g) => g.id === id);
    return found ? { ...found, examples: found.examples.map((e) => ({ ...e })) } : undefined;
  }

  updateGrammar(id: string, dto: UpdateGrammarDTO): GrammarPoint {
    const index = grammarPoints.findIndex((g) => g.id === id);
    if (index === -1) throw new Error(`Không tìm thấy điểm ngữ pháp: ${id}`);

    const updated: GrammarPoint = {
      ...grammarPoints[index],
      ...dto,
      code: dto.code.trim(),
      title: dto.title.trim(),
      structureFormula: dto.structureFormula.trim(),
      explanation: dto.explanation.trim(),
      examples: dto.examples.map((e) => ({ ...e })),
      updatedAt: new Date().toISOString(),
    };

    grammarPoints[index] = updated;
    return { ...updated };
  }
}

export const hskRepositoryService = new HskRepositoryService();
