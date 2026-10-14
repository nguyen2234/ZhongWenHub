import React, { useState, useMemo, useCallback } from 'react';
import { UploadCloud, Plus } from 'lucide-react';
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

  // 1. Data-driven HSK Levels
  const levels = useMemo(() => {
    void dataVersion;
    return hskRepositoryService.getLevels();
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
  const handleOpenVocab = useCallback((vocab: Vocabulary) => {
    setSelectedVocab(vocab);
    setIsVocabDrawerOpen(true);
  }, []);

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
    setIsVocabDrawerOpen(true);
  }, [selectedLevelId, levels]);

  const handleSaveVocab = useCallback((id: string, dto: UpdateVocabularyDTO) => {
    if (id.startsWith('voc-new-')) {
      const createDto: CreateVocabularyDTO = {
        ...dto,
      };
      hskRepositoryService.createVocabulary(createDto);
    } else {
      hskRepositoryService.updateVocabulary(id, dto);
    }
    setDataVersion((v) => v + 1);
    setIsVocabDrawerOpen(false);
  }, []);

  // Handlers for Characters
  const handleOpenChar = useCallback((char: ChineseCharacter) => {
    setSelectedChar(char);
    setIsCharDrawerOpen(true);
  }, []);

  const handleSaveChar = useCallback((id: string, dto: UpdateCharacterDTO) => {
    hskRepositoryService.updateCharacter(id, dto);
    setDataVersion((v) => v + 1);
    setIsCharDrawerOpen(false);
  }, []);

  // Handlers for Grammar
  const handleOpenGrammar = useCallback((grammar: GrammarPoint) => {
    setSelectedGrammar(grammar);
    setIsGrammarDrawerOpen(true);
  }, []);

  const handleSaveGrammar = useCallback((id: string, dto: UpdateGrammarDTO) => {
    hskRepositoryService.updateGrammar(id, dto);
    setDataVersion((v) => v + 1);
    setIsGrammarDrawerOpen(false);
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
            >
              <UploadCloud size={14} /> Nhập dữ liệu
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
        onClose={() => setIsVocabDrawerOpen(false)}
        onSave={handleSaveVocab}
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

      {/* Import Wizard Modal */}
      <ImportDataWizardModal
        isOpen={isImportModalOpen}
        levels={levels}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          setDataVersion((v) => v + 1);
        }}
      />
    </div>
  );
};
