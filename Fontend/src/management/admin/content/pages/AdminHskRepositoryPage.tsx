import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { UploadCloud, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../shared/components';
import {
  CharacterDetailDrawer,
  CharacterTab,
  GrammarDetailDrawer,
  GrammarTab,
  HskLevelDetailDrawer,
  HskLevelTab,
  ImportDataWizardModal,
  LevelFilterBar,
  VocabularyDetailDrawer,
  VocabularyTab,
} from '../components';
import { hskRepositoryService } from '../services/hsk-repository.service';
import type {
  ContentStatus,
  ChineseCharacter,
  CreateVocabularyDTO,
  GrammarPoint,
  HskLevel,
  UpdateCharacterDTO,
  UpdateGrammarDTO,
  UpdateHskLevelDTO,
  UpdateVocabularyDTO,
  Vocabulary,
} from '../types';
import '../components/learning-content.css';

type ContentTab = 'VOCABULARY' | 'CHARACTER' | 'GRAMMAR' | 'HSK_LEVEL';

export const AdminHskRepositoryPage: React.FC = () => {
  const [dataVersion, setDataVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await Promise.all([
        hskRepositoryService.syncVocabulariesFromApi(),
        hskRepositoryService.syncCharactersFromApi(),
        hskRepositoryService.syncGrammarFromApi(),
      ]);
      setDataVersion((v) => v + 1);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể tải danh sách dữ liệu từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 1. Data-driven HSK Levels (Chỉ hỗ trợ HSK 3.0 từ cấp 1 đến cấp 6)
  const levels = useMemo(() => {
    void dataVersion;
    return hskRepositoryService
      .getLevels()
      .filter((l) => {
        const num = Number(l.id.replace('level-hsk-', ''));
        return !isNaN(num) && num >= 1 && num <= 6;
      });
  }, [dataVersion]);

  // Active level filter ('ALL' or specific level id)
  const [selectedLevelId, setSelectedLevelId] = useState<string>('ALL');

  // Active content tab
  const [activeTab, setActiveTab] = useState<ContentTab>('VOCABULARY');

  // 2. Data queries
  const vocabularies = useMemo(() => {
    void dataVersion;
    return hskRepositoryService.getVocabularies();
  }, [dataVersion]);

  const characters = useMemo(() => {
    void dataVersion;
    return hskRepositoryService.getCharacters();
  }, [dataVersion]);

  const grammarPoints = useMemo(() => {
    void dataVersion;
    return hskRepositoryService.getGrammarPoints();
  }, [dataVersion]);

  // 3. Selection & Drawer states
  const [selectedVocab, setSelectedVocab] = useState<Vocabulary | null>(null);
  const [vocabContextList, setVocabContextList] = useState<Vocabulary[]>([]);
  const [vocabCurrentIndex, setVocabCurrentIndex] = useState<number>(0);
  const [isVocabDrawerOpen, setIsVocabDrawerOpen] = useState(false);

  const [selectedChar, setSelectedChar] = useState<ChineseCharacter | null>(null);
  const [isCharDrawerOpen, setIsCharDrawerOpen] = useState(false);

  const [selectedGrammar, setSelectedGrammar] = useState<GrammarPoint | null>(null);
  const [isGrammarDrawerOpen, setIsGrammarDrawerOpen] = useState(false);

  const [selectedLevel, setSelectedLevel] = useState<HskLevel | null>(null);
  const [isLevelDrawerOpen, setIsLevelDrawerOpen] = useState(false);

  // 4. Import Wizard Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Handlers for Vocabulary
  const handleOpenVocab = useCallback((vocab: Vocabulary, index?: number, list?: Vocabulary[]) => {
    setSelectedVocab(vocab);
    if (list && index !== undefined) {
      setVocabContextList(list);
      setVocabCurrentIndex(index);
    } else {
      setVocabContextList([vocab]);
      setVocabCurrentIndex(0);
    }
    setIsVocabDrawerOpen(true);
  }, []);

  const handleNavigateVocabPrev = useCallback(() => {
    if (vocabCurrentIndex > 0 && vocabContextList.length > 0) {
      const prevIdx = vocabCurrentIndex - 1;
      setVocabCurrentIndex(prevIdx);
      setSelectedVocab(vocabContextList[prevIdx]);
    }
  }, [vocabCurrentIndex, vocabContextList]);

  const handleNavigateVocabNext = useCallback(() => {
    if (vocabCurrentIndex < vocabContextList.length - 1 && vocabContextList.length > 0) {
      const nextIdx = vocabCurrentIndex + 1;
      setVocabCurrentIndex(nextIdx);
      setSelectedVocab(vocabContextList[nextIdx]);
    }
  }, [vocabCurrentIndex, vocabContextList]);

  const handleOpenCreateVocab = useCallback(() => {
    const defaultLevel = selectedLevelId !== 'ALL' ? selectedLevelId : (levels[0]?.id || 'level-hsk-1');
    const newDraft: Vocabulary = {
      id: `voc-new-${Date.now()}`,
      hskLevelId: defaultLevel,
      simplified: '',
      traditional: '',
      pinyin: '',
      meaningVi: '',
      meaningEn: '',
      partOfSpeech: 'Động từ',
      status: 'PUBLISHED',
      source: 'Tạo mới từ CMS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      examples: [],
    };
    setSelectedVocab(newDraft);
    setVocabContextList([]);
    setVocabCurrentIndex(0);
    setIsVocabDrawerOpen(true);
  }, [selectedLevelId, levels]);

  const handleSaveVocab = useCallback(async (id: string, dto: UpdateVocabularyDTO, andNext: boolean = false) => {
    try {
      let savedVocab: Vocabulary;
      if (id.startsWith('voc-new-')) {
        const createDto: CreateVocabularyDTO = {
          ...dto,
        };
        savedVocab = await hskRepositoryService.createVocabularyAsync(createDto);
      } else {
        savedVocab = await hskRepositoryService.updateVocabularyAsync(id, dto);
      }
      setDataVersion((v) => v + 1);

      if (andNext && vocabContextList.length > 0 && vocabCurrentIndex < vocabContextList.length - 1) {
        const updatedContext = [...vocabContextList];
        updatedContext[vocabCurrentIndex] = savedVocab;
        const nextIdx = vocabCurrentIndex + 1;
        setVocabContextList(updatedContext);
        setVocabCurrentIndex(nextIdx);
        setSelectedVocab(updatedContext[nextIdx]);
      } else {
        setIsVocabDrawerOpen(false);
      }
    } catch (err: any) {
      console.error('Lỗi lưu từ vựng:', err);
      alert(err?.message || 'Không thể lưu từ vựng vào máy chủ.');
    }
  }, [vocabContextList, vocabCurrentIndex]);

  const handleBatchPublish = useCallback(async (ids: string[]) => {
    try {
      const result = await hskRepositoryService.batchPublishVocabulariesAsync(ids);
      alert(`Đã xuất bản thành công ${result.publishedCount} từ vựng!${result.skippedCount > 0 ? ` (Bỏ qua ${result.skippedCount} từ chưa có nghĩa tiếng Việt)` : ''}`);
      await loadData();
    } catch (err: any) {
      console.error('Lỗi xuất bản hàng loạt:', err);
      alert(err?.message || 'Không thể xuất bản hàng loạt từ vựng.');
    }
  }, [loadData]);

  const handleBatchReview = useCallback(async (ids: string[], status: ContentStatus, notes?: string) => {
    try {
      const result = await hskRepositoryService.batchReviewVocabulariesAsync({ ids, status, reviewNotes: notes });
      alert(`Đã cập nhật trạng thái (${status}) cho ${result.processedCount} từ vựng!${result.skippedCount > 0 ? ` (Bỏ qua ${result.skippedCount} từ)` : ''}`);
      await loadData();
    } catch (err: any) {
      console.error('Lỗi duyệt hàng loạt:', err);
      alert(err?.message || 'Không thể cập nhật trạng thái hàng loạt.');
    }
  }, [loadData]);

  const handleDeleteVocab = useCallback(async (id: string) => {
    try {
      await hskRepositoryService.deleteVocabularyAsync(id);
      setDataVersion((v) => v + 1);
      setIsVocabDrawerOpen(false);
    } catch (err: any) {
      console.error('Lỗi xóa từ vựng:', err);
      alert(err?.message || 'Không thể xóa từ vựng khỏi máy chủ.');
    }
  }, []);

  // Handlers for Characters
  const handleOpenChar = useCallback((char: ChineseCharacter) => {
    setSelectedChar(char);
    setIsCharDrawerOpen(true);
  }, []);

  const handleSaveChar = useCallback(async (id: string, dto: UpdateCharacterDTO) => {
    try {
      await hskRepositoryService.updateCharacterAsync(id, dto);
    } catch {
      hskRepositoryService.updateCharacter(id, dto);
    }
    setDataVersion((v) => v + 1);
    setIsCharDrawerOpen(false);
  }, []);

  // Handlers for Grammar
  const handleOpenGrammar = useCallback((grammar: GrammarPoint) => {
    setSelectedGrammar(grammar);
    setIsGrammarDrawerOpen(true);
  }, []);

  const handleSaveGrammar = useCallback(async (id: string, dto: UpdateGrammarDTO) => {
    try {
      await hskRepositoryService.reviewGrammarAsync(id, {
        status: dto.status,
        reviewNotes: dto.reviewNotes,
      });
    } catch {
      hskRepositoryService.updateGrammar(id, dto);
    }
    setDataVersion((v) => v + 1);
    setIsGrammarDrawerOpen(false);
  }, []);

  const handleBatchPublishGrammar = useCallback(async (ids: string[]) => {
    try {
      setIsLoading(true);
      const res = await hskRepositoryService.batchPublishGrammarPointsAsync(ids);
      alert(`Xuất bản thành công ${res.publishedCount} điểm ngữ pháp.${res.skippedCount > 0 ? ` Bỏ qua: ${res.skippedCount}` : ''}`);
      await hskRepositoryService.syncGrammarFromApi();
      setDataVersion((v) => v + 1);
    } catch (err: any) {
      alert(err?.message || 'Có lỗi khi xuất bản điểm ngữ pháp.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBatchReviewGrammar = useCallback(async (ids: string[], status: ContentStatus, notes?: string) => {
    try {
      setIsLoading(true);
      const res = await hskRepositoryService.batchReviewGrammarPointsAsync({ ids, status, reviewNotes: notes });
      alert(`Chuyển trạng thái ${status} thành công cho ${res.processedCount} điểm ngữ pháp.${res.skippedCount > 0 ? ` Bỏ qua: ${res.skippedCount}` : ''}`);
      await hskRepositoryService.syncGrammarFromApi();
      setDataVersion((v) => v + 1);
    } catch (err: any) {
      alert(err?.message || 'Có lỗi khi kiểm duyệt điểm ngữ pháp.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handlers for HSK Levels
  const handleOpenLevel = useCallback((lvl: HskLevel) => {
    setSelectedLevel(lvl);
    setIsLevelDrawerOpen(true);
  }, []);

  const handleSaveLevel = useCallback((id: string, dto: UpdateHskLevelDTO) => {
    hskRepositoryService.updateLevel(id, dto);
    setDataVersion((v) => v + 1);
    setIsLevelDrawerOpen(false);
  }, []);

  return (
    <div className="lcm-page">
      <PageHeader
        title="Chuẩn dữ liệu HSK"
        subtitle="Quản lý kho từ vựng, chữ Hán và ngữ pháp chuẩn hóa."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="ds-btn ds-btn-outline ds-btn-sm"
              onClick={() => setIsImportModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <UploadCloud size={14} /> Import Excel / CSV
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-primary ds-btn-sm"
              onClick={handleOpenCreateVocab}
            >
              <Plus size={14} /> Thêm từ vựng
            </button>
          </div>
        }
      />

      {errorMessage && (
        <div
          style={{
            background: 'var(--danger-bg, #fee2e2)',
            border: '1px solid var(--danger-border, #fca5a5)',
            color: 'var(--danger-text, #991b1b)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={loadData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      )}

      {isLoading && (
        <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--muted)' }}>
          Đang tải dữ liệu HSK từ máy chủ...
        </div>
      )}

      {/* Level Selector Bar */}
      <LevelFilterBar
        levels={levels}
        selectedLevelId={selectedLevelId}
        onSelectLevel={setSelectedLevelId}
      />

      {/* Content Tabs Bar */}
      <div className="lcm-tabs-container">
        <button
          type="button"
          className={`lcm-tab-btn ${activeTab === 'VOCABULARY' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('VOCABULARY')}
        >
          <span>Từ vựng</span>
          <span className="lcm-tab-badge">{vocabularies.length}</span>
        </button>

        <button
          type="button"
          className={`lcm-tab-btn ${activeTab === 'CHARACTER' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('CHARACTER')}
        >
          <span>Chữ Hán</span>
          <span className="lcm-tab-badge">{characters.length}</span>
        </button>

        <button
          type="button"
          className={`lcm-tab-btn ${activeTab === 'GRAMMAR' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('GRAMMAR')}
        >
          <span>Ngữ pháp</span>
          <span className="lcm-tab-badge">{grammarPoints.length}</span>
        </button>

        <button
          type="button"
          className={`lcm-tab-btn ${activeTab === 'HSK_LEVEL' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('HSK_LEVEL')}
        >
          <span>Cấp độ HSK</span>
          <span className="lcm-tab-badge">{levels.length}</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'VOCABULARY' && (
        <VocabularyTab
          vocabularies={vocabularies}
          levels={levels}
          selectedLevelId={selectedLevelId}
          onSelectVocabulary={handleOpenVocab}
          onOpenCreate={handleOpenCreateVocab}
          onBatchPublish={handleBatchPublish}
          onBatchReview={handleBatchReview}
        />
      )}

      {activeTab === 'CHARACTER' && (
        <CharacterTab
          characters={characters}
          levels={levels}
          selectedLevelId={selectedLevelId}
          onSelectCharacter={handleOpenChar}
        />
      )}

      {activeTab === 'GRAMMAR' && (
        <GrammarTab
          grammarPoints={grammarPoints}
          levels={levels}
          selectedLevelId={selectedLevelId}
          onSelectGrammar={handleOpenGrammar}
          onBatchPublish={handleBatchPublishGrammar}
          onBatchReview={handleBatchReviewGrammar}
        />
      )}

      {activeTab === 'HSK_LEVEL' && (
        <HskLevelTab
          levels={levels}
          onSelectLevel={handleOpenLevel}
        />
      )}

      {/* Drawers */}
      <VocabularyDetailDrawer
        isOpen={isVocabDrawerOpen}
        vocabulary={selectedVocab}
        levels={levels}
        currentIndex={vocabCurrentIndex}
        totalCount={vocabContextList.length}
        onNavigatePrev={handleNavigateVocabPrev}
        onNavigateNext={handleNavigateVocabNext}
        onClose={() => setIsVocabDrawerOpen(false)}
        onSave={handleSaveVocab}
        onDelete={handleDeleteVocab}
      />

      <CharacterDetailDrawer
        isOpen={isCharDrawerOpen}
        character={selectedChar}
        levels={levels}
        onClose={() => setIsCharDrawerOpen(false)}
        onSave={handleSaveChar}
      />

      <GrammarDetailDrawer
        isOpen={isGrammarDrawerOpen}
        grammar={selectedGrammar}
        levels={levels}
        onClose={() => setIsGrammarDrawerOpen(false)}
        onSave={handleSaveGrammar}
      />

      <HskLevelDetailDrawer
        isOpen={isLevelDrawerOpen}
        level={selectedLevel}
        onClose={() => setIsLevelDrawerOpen(false)}
        onSave={handleSaveLevel}
      />

      {/* Footer License Attribution */}
      <footer style={{ marginTop: 'var(--space-6)', padding: '12px 16px', backgroundColor: 'var(--background-secondary, #f8fafc)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <strong>Bản quyền học liệu:</strong> Danh mục từ vựng và ngữ pháp đối chiếu theo chuẩn HSK 3.0. Dữ liệu nghĩa gợi ý tham khảo từ dự án <em>CVDICT (Giấy phép CC BY-SA 4.0)</em>.
        </div>
        <div>
          Hệ thống yêu cầu kiểm duyệt thủ công đối với 100% học liệu HSK trước khi chuyển sang trạng thái <code>PUBLISHED</code>.
        </div>
      </footer>

      {/* Import Wizard Modal */}
      <ImportDataWizardModal
        isOpen={isImportModalOpen}
        levels={levels}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
};
