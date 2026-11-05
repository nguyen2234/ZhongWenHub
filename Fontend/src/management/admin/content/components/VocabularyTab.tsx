import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit3,
  CheckSquare,
  Square,
  CheckCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
} from 'lucide-react';
import { ContentStatusBadge } from './ContentStatusBadge';
import { HSK1_DICTIONARY_SUGGESTIONS } from '../data/hsk1-dictionary.data';
import { hskRepositoryService } from '../services/hsk-repository.service';
import type { ContentStatus, HskLevel, Vocabulary } from '../types';

export interface VocabularyTabProps {
  vocabularies: Vocabulary[];
  levels: HskLevel[];
  selectedLevelId: string;
  onSelectVocabulary: (vocab: Vocabulary, index?: number, list?: Vocabulary[]) => void;
  onOpenCreate: () => void;
  onBatchPublish?: (ids: string[]) => Promise<void>;
}

export const VocabularyTab: React.FC<VocabularyTabProps> = ({
  vocabularies,
  levels,
  selectedLevelId,
  onSelectVocabulary,
  onOpenCreate,
  onBatchPublish,
}) => {
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ContentStatus>('ALL');
  const [missingMeaningOnly, setMissingMeaningOnly] = useState(false);
  const [manualReviewOnly, setManualReviewOnly] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(25); // Default 25 words per batch (range 20-30)
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPublishingBatch, setIsPublishingBatch] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    if (filteredList.length === 0) {
      alert('Không có bản ghi từ vựng nào phù hợp với bộ lọc hiện tại để xuất Excel.');
      return;
    }

    try {
      setIsExporting(true);
      const hskNum = selectedLevelId !== 'ALL' ? Number(selectedLevelId.replace('level-hsk-', '')) : undefined;
      await hskRepositoryService.exportVocabulariesExcelAsync({
        hskLevel: !isNaN(Number(hskNum)) && Number(hskNum) > 0 ? Number(hskNum) : undefined,
        partOfSpeech: posFilter !== 'ALL' ? posFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search.trim() ? search.trim() : undefined,
        missingMeaningVi: missingMeaningOnly ? true : undefined,
        needsReview: manualReviewOnly ? true : undefined,
      });
    } catch (err: any) {
      console.error('Export error:', err);
      alert(err?.message || 'Có lỗi xảy ra khi xuất file Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  // Statistics for progress tracking
  const stats = useMemo(() => {
    const list = selectedLevelId !== 'ALL'
      ? vocabularies.filter((v) => v.hskLevelId === selectedLevelId)
      : vocabularies;
    const total = list.length;
    const withMeaning = list.filter((v) => v.meaningVi && v.meaningVi.trim() !== '').length;
    const missingMeaning = total - withMeaning;
    const published = list.filter((v) => v.status === 'PUBLISHED').length;
    const draft = list.filter((v) => v.status === 'DRAFT').length;
    const manualReview = list.filter((v) => {
      const entry = HSK1_DICTIONARY_SUGGESTIONS[v.simplified.trim()];
      return entry?.manualReviewRequired || entry?.isAmbiguous;
    }).length;

    return {
      total,
      withMeaning,
      missingMeaning,
      published,
      draft,
      manualReview,
      percentWithMeaning: total > 0 ? Math.round((withMeaning / total) * 100) : 0,
      percentPublished: total > 0 ? Math.round((published / total) * 100) : 0,
    };
  }, [vocabularies, selectedLevelId]);

  const filteredList = useMemo(() => {
    let result = vocabularies;

    if (selectedLevelId !== 'ALL') {
      result = result.filter((v) => v.hskLevelId === selectedLevelId);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((v) => v.status === statusFilter);
    }

    if (posFilter !== 'ALL') {
      result = result.filter((v) => v.partOfSpeech.toLowerCase().includes(posFilter.toLowerCase()));
    }

    if (missingMeaningOnly) {
      result = result.filter((v) => !v.meaningVi || v.meaningVi.trim() === '');
    }

    if (manualReviewOnly) {
      result = result.filter((v) => {
        const entry = HSK1_DICTIONARY_SUGGESTIONS[v.simplified.trim()];
        return entry?.manualReviewRequired || entry?.isAmbiguous;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.simplified.toLowerCase().includes(q) ||
          v.traditional.toLowerCase().includes(q) ||
          v.pinyin.toLowerCase().includes(q) ||
          v.meaningVi.toLowerCase().includes(q)
      );
    }

    return result;
  }, [vocabularies, selectedLevelId, statusFilter, posFilter, missingMeaningOnly, manualReviewOnly, search]);

  const totalBatches = useMemo(() => {
    if (batchSize <= 0) return 1;
    return Math.max(1, Math.ceil(filteredList.length / batchSize));
  }, [filteredList.length, batchSize]);

  // Adjust batch index if it exceeds totalBatches
  const safeBatchIndex = Math.min(currentBatchIndex, Math.max(0, totalBatches - 1));

  const pagedList = useMemo(() => {
    if (batchSize <= 0) return filteredList;
    const start = safeBatchIndex * batchSize;
    return filteredList.slice(start, start + batchSize);
  }, [filteredList, safeBatchIndex, batchSize]);

  const levelMap = useMemo(() => {
    const map = new Map<string, string>();
    levels.forEach((lvl) => map.set(lvl.id, lvl.name));
    return map;
  }, [levels]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredList.length && filteredList.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredList.map((v) => v.id)));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const selectedItems = useMemo(() => {
    return vocabularies.filter((v) => selectedIds.has(v.id));
  }, [vocabularies, selectedIds]);

  const eligibleForPublish = useMemo(() => {
    return selectedItems.filter((v) => v.meaningVi && v.meaningVi.trim() !== '');
  }, [selectedItems]);

  const missingMeaningCount = selectedItems.length - eligibleForPublish.length;

  const handleBatchPublishClick = async () => {
    if (eligibleForPublish.length === 0) {
      alert('Không có từ nào trong danh sách đã chọn có nghĩa tiếng Việt. Không thể xuất bản.');
      return;
    }

    let confirmMsg = `Bạn có chắc muốn xuất bản ${eligibleForPublish.length} từ đã chọn?`;
    if (missingMeaningCount > 0) {
      confirmMsg = `Có ${missingMeaningCount} từ chưa có nghĩa tiếng Việt và sẽ bị bỏ qua.\nBạn có chắc muốn xuất bản ${eligibleForPublish.length} từ hợp lệ?`;
    }

    if (!window.confirm(confirmMsg)) return;

    if (onBatchPublish) {
      try {
        setIsPublishingBatch(true);
        await onBatchPublish(eligibleForPublish.map((v) => v.id));
        setSelectedIds(new Set());
      } finally {
        setIsPublishingBatch(false);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* 1. Progress Statistics Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Tổng số từ HSK
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{stats.total}</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>từ vựng</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase' }}>
            Đã có nghĩa tiếng Việt
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#15803d' }}>{stats.withMeaning}</span>
            <span style={{ fontSize: '12px', color: '#16a34a' }}>({stats.percentWithMeaning}%)</span>
          </div>
          <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${stats.percentWithMeaning}%`,
                backgroundColor: '#16a34a',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600, textTransform: 'uppercase' }}>
            Chưa có nghĩa (DRAFT)
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#b45309' }}>{stats.missingMeaning}</span>
            <span style={{ fontSize: '12px', color: '#d97706' }}>từ cần duyệt</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, textTransform: 'uppercase' }}>
            Đã xuất bản (PUBLISHED)
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#1d4ed8' }}>{stats.published}</span>
            <span style={{ fontSize: '12px', color: '#2563eb' }}>({stats.percentPublished}%)</span>
          </div>
          <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${stats.percentPublished}%`,
                backgroundColor: '#2563eb',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600, textTransform: 'uppercase' }}>
            Đa âm / Cần kiểm tra kỹ
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#6d28d9' }}>{stats.manualReview}</span>
            <span style={{ fontSize: '12px', color: '#7c3aed' }}>từ đặc biệt</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="lcm-toolbar">
        <div className="lcm-toolbar-filters">
          <div style={{ position: 'relative' }} className="lcm-search-input">
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)',
              }}
            />
            <input
              type="text"
              className="lcm-form-input"
              style={{ width: '100%', paddingLeft: '36px' }}
              placeholder="Tìm theo chữ Hán, Pinyin, nghĩa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="lcm-select-filter"
            value={posFilter}
            onChange={(e) => setPosFilter(e.target.value)}
          >
            <option value="ALL">Tất cả loại từ</option>
            <option value="Động từ">Động từ</option>
            <option value="Danh từ">Danh từ</option>
            <option value="Tính từ">Tính từ</option>
            <option value="Đại từ">Đại từ</option>
            <option value="Trợ từ">Trợ từ / Trợ động từ</option>
            <option value="Lượng từ">Lượng từ</option>
            <option value="Số từ">Số từ</option>
            <option value="Phó từ">Phó từ</option>
          </select>

          <select
            className="lcm-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | ContentStatus)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
            <option value="DRAFT">Bản nháp (DRAFT)</option>
            <option value="PENDING_REVIEW">Chờ duyệt</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              color: missingMeaningOnly ? '#b45309' : 'inherit',
              fontWeight: missingMeaningOnly ? 600 : 400,
            }}
          >
            <input
              type="checkbox"
              checked={missingMeaningOnly}
              onChange={(e) => setMissingMeaningOnly(e.target.checked)}
            />
            <span>Chưa có nghĩa</span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              color: manualReviewOnly ? '#7c3aed' : 'inherit',
              fontWeight: manualReviewOnly ? 600 : 400,
            }}
          >
            <input
              type="checkbox"
              checked={manualReviewOnly}
              onChange={(e) => setManualReviewOnly(e.target.checked)}
            />
            <span>Cần kiểm tra kỹ ({stats.manualReview})</span>
          </label>
        </div>

        <button
          type="button"
          className="ds-btn ds-btn-primary ds-btn-sm"
          onClick={onOpenCreate}
        >
          <Plus size={14} /> Thêm từ vựng
        </button>
      </div>

      {/* Batch Navigation & Paging Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '8px 12px',
          backgroundColor: '#f8fafc',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          fontSize: '13px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={15} color="var(--primary)" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Quy trình kiểm duyệt:</span>
          <select
            className="lcm-select-filter"
            style={{ padding: '2px 8px', height: '28px', fontSize: '12px' }}
            value={batchSize}
            onChange={(e) => {
              setBatchSize(Number(e.target.value));
              setCurrentBatchIndex(0);
            }}
          >
            <option value={20}>Đợt 20 từ</option>
            <option value={25}>Đợt 25 từ (Khuyến nghị)</option>
            <option value={30}>Đợt 30 từ</option>
            <option value={50}>Đợt 50 từ</option>
            <option value={0}>Tất cả ({filteredList.length} từ)</option>
          </select>
        </div>

        {batchSize > 0 && totalBatches > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="ds-btn ds-btn-outline ds-btn-sm"
              style={{ height: '28px', padding: '2px 8px', fontSize: '12px' }}
              disabled={safeBatchIndex <= 0}
              onClick={() => setCurrentBatchIndex((idx) => Math.max(0, idx - 1))}
            >
              <ChevronLeft size={14} /> Đợt trước
            </button>

            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
              Đợt <strong>{safeBatchIndex + 1}</strong> / {totalBatches}{' '}
              <span style={{ fontWeight: 400 }}>
                ({safeBatchIndex * batchSize + 1} – {Math.min((safeBatchIndex + 1) * batchSize, filteredList.length)} trên {filteredList.length} từ)
              </span>
            </span>

            <button
              type="button"
              className="ds-btn ds-btn-outline ds-btn-sm"
              style={{ height: '28px', padding: '2px 8px', fontSize: '12px' }}
              disabled={safeBatchIndex >= totalBatches - 1}
              onClick={() => setCurrentBatchIndex((idx) => Math.min(totalBatches - 1, idx + 1))}
            >
              Đợt tiếp theo <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Batch Selection Banner */}
      {selectedIds.size > 0 && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1e40af' }}>
            <CheckSquare size={16} />
            <span>
              Đã chọn <strong>{selectedIds.size}</strong> từ
              {missingMeaningCount > 0 && (
                <span style={{ color: '#b45309', marginLeft: '6px', fontSize: '12px' }}>
                  ({missingMeaningCount} từ chưa có nghĩa tiếng Việt)
                </span>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="ds-btn ds-btn-sm"
              disabled={isPublishingBatch || eligibleForPublish.length === 0}
              style={{
                backgroundColor: eligibleForPublish.length > 0 ? '#16a34a' : '#9ca3af',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                cursor: eligibleForPublish.length > 0 ? 'pointer' : 'not-allowed',
              }}
              onClick={handleBatchPublishClick}
            >
              <CheckCircle size={14} />
              <span>Xuất bản các từ đã chọn ({eligibleForPublish.length})</span>
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-outline ds-btn-sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Hủy chọn
            </button>
          </div>
        </div>
      )}

      {/* Results Count & Export Excel */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: 'var(--text-xs)',
          color: 'var(--muted)',
          margin: '4px 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            Hiển thị <strong>{filteredList.length}</strong> từ vựng chuẩn
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={handleExportExcel}
            disabled={isExporting || filteredList.length === 0}
            title="Xuất toàn bộ bản ghi theo bộ lọc hiện tại ra file Excel (.xlsx)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '28px',
              padding: '0 10px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#16a34a',
              borderColor: '#86efac',
              backgroundColor: '#f0fdf4',
              cursor: filteredList.length === 0 || isExporting ? 'not-allowed' : 'pointer',
            }}
          >
            {isExporting ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
            <span>{isExporting ? 'Đang xuất Excel...' : 'Export Excel'}</span>
          </button>
        </div>
        {filteredList.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={toggleSelectAll}>
            {selectedIds.size === filteredList.length && filteredList.length > 0 ? (
              <CheckSquare size={14} color="#2563eb" />
            ) : (
              <Square size={14} />
            )}
            <span>Chọn tất cả ({filteredList.length})</span>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="lcm-table-container">
        <table className="lcm-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={filteredList.length > 0 && selectedIds.size === filteredList.length}
                  onChange={toggleSelectAll}
                  aria-label="Chọn tất cả"
                />
              </th>
              <th>Hán tự</th>
              <th>Pinyin</th>
              <th>Nghĩa Việt</th>
              <th>Loại từ</th>
              <th>Cấp HSK</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--muted)' }}>
                  Không tìm thấy từ vựng nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              pagedList.map((vocab, index) => {
                const globalIndex = batchSize > 0 ? safeBatchIndex * batchSize + index : index;
                const isSelected = selectedIds.has(vocab.id);
                const dictEntry = HSK1_DICTIONARY_SUGGESTIONS[vocab.simplified.trim()];
                const isManualReview = dictEntry?.manualReviewRequired || dictEntry?.isAmbiguous;

                return (
                  <tr
                    key={vocab.id}
                    className="lcm-row-clickable"
                    style={isSelected ? { backgroundColor: '#f0f7ff' } : undefined}
                    onClick={() => onSelectVocabulary(vocab, globalIndex, filteredList)}
                  >
                    <td style={{ textAlign: 'center' }} onClick={(e) => toggleSelect(vocab.id, e)}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        aria-label={`Chọn từ ${vocab.simplified}`}
                      />
                    </td>
                    <td className="lcm-hanzi-cell">
                      <span>{vocab.simplified}</span>
                      {isManualReview && (
                        <span
                          style={{
                            fontSize: '10px',
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            border: '1px solid #fde68a',
                            marginLeft: '6px',
                            fontWeight: 500,
                          }}
                          title={dictEntry?.notes || 'Từ có nhiều nghĩa hoặc từ loại đặc biệt'}
                        >
                          Kiểm tra kỹ
                        </span>
                      )}
                    </td>
                    <td className="lcm-pinyin-cell">{vocab.pinyin}</td>
                    <td>
                      {vocab.meaningVi ? (
                        vocab.meaningVi
                      ) : (
                        <span style={{ color: '#d97706', fontStyle: 'italic', fontSize: '12px' }}>
                          Chưa có nghĩa (DRAFT)
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{vocab.partOfSpeech}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--background)',
                        }}
                      >
                        {levelMap.get(vocab.hskLevelId) || 'HSK'}
                      </span>
                    </td>
                    <td>
                      <ContentStatusBadge status={vocab.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="ds-btn ds-btn-ghost ds-btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectVocabulary(vocab, globalIndex, filteredList);
                        }}
                        title="Xem chi tiết"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        className="ds-btn ds-btn-ghost ds-btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectVocabulary(vocab, globalIndex, filteredList);
                        }}
                        title="Chỉnh sửa"
                      >
                        <Edit3 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List (shown on <= 767px) */}
      <div className="lcm-card-list">
        {pagedList.map((vocab, index) => {
          const globalIndex = batchSize > 0 ? safeBatchIndex * batchSize + index : index;
          const isSelected = selectedIds.has(vocab.id);
          return (
            <div
              key={vocab.id}
              className="lcm-item-card"
              style={isSelected ? { borderColor: '#3b82f6', backgroundColor: '#f0f7ff' } : undefined}
              onClick={() => onSelectVocabulary(vocab, globalIndex, filteredList)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onClick={(e) => toggleSelect(vocab.id, e)}
                    onChange={() => {}}
                  />
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                    <span className="lcm-hanzi-cell">{vocab.simplified}</span>
                    <span className="lcm-pinyin-cell">{vocab.pinyin}</span>
                  </div>
                </div>
                <ContentStatusBadge status={vocab.status} />
              </div>

              <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                {vocab.meaningVi || (
                  <span style={{ color: '#d97706', fontStyle: 'italic', fontSize: '12px' }}>
                    Chưa có nghĩa (DRAFT)
                  </span>
                )}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)' }}>
                <span>Loại từ: {vocab.partOfSpeech}</span>
                <span>{levelMap.get(vocab.hskLevelId)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
