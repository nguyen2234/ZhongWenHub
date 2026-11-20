import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Save,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  Clock,
  Send,
  XCircle,
  Copy,
} from 'lucide-react';

const HSK2_AMBIGUOUS_WORDS: Record<string, string> = {
  '别': 'Từ đồng hình / đa âm HSK 2: Nghĩa HSK 2 chuẩn là "đừng, chớ" (phó từ cấm đoán) hoặc "khác" (biérén). Tuyệt đối không chọn nghĩa danh từ riêng họ Bie.',
  '打': 'Từ đa nghĩa HSK 2: Nghĩa HSK 2 chuẩn là "gọi (điện thoại: dǎ diànhuà)", "đánh, chơi (bóng)". Không chọn nghĩa đơn vị "tá [dozen]".',
  '花': 'Từ đa nghĩa / đồng hình: HSK 2 có động từ "tiêu (tiền/thời gian)" và danh từ "hoa". Cần ghi rõ cả 2 nghĩa hoặc chọn nghĩa phù hợp ngữ cảnh.',
  '等': 'Từ đa nghĩa HSK 2: Nghĩa chuẩn là "đợi, chờ" (động từ). Tránh các nghĩa cổ, loại hoặc đẳng cấp.',
  '点': 'Từ đa nghĩa HSK 2: Nghĩa chuẩn gồm "giờ" (thời gian), "một chút" (yìdiǎnr), "gọi món / thắp đèn".',
  '得': 'Từ đa âm (de/dé/děi): HSK 2 dùng trợ từ trình độ "de" (chạy nhanh) hoặc động từ "děi" (phải làm). Kiểm tra kỹ âm đọc.',
  '好': 'Từ đa nghĩa: HSK 2 ngoài nghĩa "tốt, đẹp" còn làm phó từ "rất" (hǎochī) hoặc trạng thái hoàn thành.',
  '过': 'Trợ từ động thái HSK 2: Biểu thị kinh nghiệm "đã từng (guò)", hoặc động từ "qua, đón (sinh nhật)".',
  '回': 'Động từ "về" (huíjiā) hoặc lượng từ "lần, hồi".',
  '白': 'Tính từ "trắng" hoặc phó từ "làm không công, vô ích".',
  '件': 'Lượng từ cho quần áo hoặc sự việc.',
  '次': 'Lượng từ "lần, lượt" trong HSK 2.',
  '对': 'Tính từ "đúng" hoặc giới từ "đối với" trong HSK 2.',
};
import { ContentStatusBadge } from './ContentStatusBadge';
import {
  getHsk1DictionarySuggestion,
  type SuggestionMatchResult,
} from '../data/hsk1-dictionary.data';
import type {
  ContentStatus,
  HskLevel,
  UpdateVocabularyDTO,
  Vocabulary,
  VocabularyExample,
} from '../types';

export interface VocabularyDetailDrawerProps {
  isOpen: boolean;
  vocabulary: Vocabulary | null;
  levels: HskLevel[];
  currentIndex?: number;
  totalCount?: number;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  onClose: () => void;
  onSave: (id: string, dto: UpdateVocabularyDTO, andNext?: boolean) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}

export const VocabularyDetailDrawer: React.FC<VocabularyDetailDrawerProps> = ({
  isOpen,
  vocabulary,
  levels,
  currentIndex,
  totalCount,
  onNavigatePrev,
  onNavigateNext,
  onClose,
  onSave,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [simplified, setSimplified] = useState('');
  const [traditional, setTraditional] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [meaningVi, setMeaningVi] = useState('');
  const [meaningEn, setMeaningEn] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [hskLevelId, setHskLevelId] = useState('');
  const [status, setStatus] = useState<ContentStatus>('PUBLISHED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [examples, setExamples] = useState<VocabularyExample[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (vocabulary) {
      setSimplified(vocabulary.simplified);
      setTraditional(vocabulary.traditional);
      setPinyin(vocabulary.pinyin);
      setMeaningVi(vocabulary.meaningVi);
      setMeaningEn(vocabulary.meaningEn);
      setPartOfSpeech(vocabulary.partOfSpeech);
      setAudioUrl(vocabulary.audioUrl || '');
      setHskLevelId(vocabulary.hskLevelId);
      setStatus(vocabulary.status);
      setReviewNotes(vocabulary.reviewNotes || '');
      setExamples(vocabulary.examples.map((e) => ({ ...e })));
      // If it's a new word or a DRAFT word missing meaning, automatically enter editing mode
      const isNew = vocabulary.id.startsWith('voc-new-');
      const isDraftMissingMeaning = vocabulary.status === 'DRAFT' && (!vocabulary.meaningVi || !vocabulary.meaningVi.trim());
      setIsEditing(isNew || isDraftMissingMeaning);
      setErrors({});
    }
  }, [vocabulary]);

  if (!isOpen || !vocabulary) return null;

  const suggestionResult: SuggestionMatchResult = getHsk1DictionarySuggestion(simplified, pinyin);
  const suggestion = suggestionResult.status === 'EXACT' ? suggestionResult.entry : undefined;

  const handleApplySuggestion = () => {
    if (!suggestion) return;
    setMeaningVi(suggestion.meaningVi);
    if (!partOfSpeech || partOfSpeech === 'danh từ' || partOfSpeech === 'Chưa phân loại' || partOfSpeech === '') {
      setPartOfSpeech(suggestion.partOfSpeech);
    }
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.meaningVi;
      return updated;
    });
  };

  const handleApplyCvdictSuggestion = () => {
    if (!vocabulary.suggestedMeaningVi) return;
    setMeaningVi(vocabulary.suggestedMeaningVi);
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.meaningVi;
      return updated;
    });
  };

  const handleSaveWithStatus = async (targetStatus?: ContentStatus, andNext: boolean = false) => {
    const finalStatus = targetStatus || status;
    const errs: Record<string, string> = {};
    if (!simplified.trim()) errs.simplified = 'Hán tự không được để trống';
    if (!pinyin.trim()) errs.pinyin = 'Pinyin không được để trống';
    if (finalStatus === 'PUBLISHED' && !meaningVi.trim()) {
      errs.meaningVi = 'Không thể xuất bản (PUBLISHED) khi chưa có nghĩa tiếng Việt.';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setIsSaving(true);
      await onSave(
        vocabulary.id,
        {
          hskLevelId,
          simplified,
          traditional: traditional || simplified,
          pinyin,
          meaningVi,
          meaningEn,
          partOfSpeech,
          audioUrl: audioUrl || undefined,
          examples,
          status: finalStatus,
          sourceId: vocabulary.sourceId,
          sourceDataset: vocabulary.sourceDataset,
          sourceEntryId: vocabulary.sourceEntryId,
          suggestedMeaningVi: vocabulary.suggestedMeaningVi,
          reviewNotes: reviewNotes.trim() || undefined,
          entry: vocabulary.entry,
          homograph: vocabulary.homograph,
          levelLabel: vocabulary.levelLabel,
          sourcePdfPage: vocabulary.sourcePdfPage,
        },
        andNext
      );
      if (!andNext) {
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddExample = () => {
    setExamples([
      ...examples,
      {
        id: `ex-temp-${Date.now()}`,
        zh: '',
        pinyin: '',
        meaningVi: '',
        displayOrder: examples.length + 1,
      },
    ]);
  };

  const handleRemoveExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  const handleExampleChange = (index: number, field: keyof VocabularyExample, value: string) => {
    setExamples(
      examples.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  const currentLevel = levels.find((l) => l.id === hskLevelId);

  return (
    <div className="lcm-drawer-overlay" onClick={onClose}>
      <div className="lcm-drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header with Sequential Navigation */}
        <div className="lcm-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h3 className="lcm-drawer-title">
              {simplified}{' '}
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', fontWeight: 500 }}>
                ({pinyin})
              </span>
            </h3>
            <ContentStatusBadge status={status} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentIndex !== undefined && totalCount !== undefined && totalCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--background-secondary, #f1f5f9)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}
              >
                <button
                  type="button"
                  className="ds-btn ds-btn-ghost ds-btn-sm"
                  style={{ padding: '2px 4px', height: '24px' }}
                  disabled={currentIndex <= 0}
                  onClick={onNavigatePrev}
                  title="Từ trước đó"
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', minWidth: '60px', textAlign: 'center' }}>
                  {currentIndex + 1} / {totalCount}
                </span>
                <button
                  type="button"
                  className="ds-btn ds-btn-ghost ds-btn-sm"
                  style={{ padding: '2px 4px', height: '24px' }}
                  disabled={currentIndex >= totalCount - 1}
                  onClick={onNavigateNext}
                  title="Từ kế tiếp"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <button
              type="button"
              className="ds-btn ds-btn-ghost ds-btn-sm"
              onClick={onClose}
              title="Đóng bảng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="lcm-drawer-body">
          {/* Section: Thông tin cơ bản */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h4
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--muted)',
                margin: 0,
              }}
            >
              1. Thông tin từ vựng
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="lcm-form-group">
                <label className="lcm-form-label">Hán tự giản thể *</label>
                {isEditing ? (
                  <>
                    <input
                      className="lcm-form-input"
                      value={simplified}
                      onChange={(e) => setSimplified(e.target.value)}
                    />
                    {errors.simplified && (
                      <span style={{ color: '#dc2626', fontSize: '11px' }}>{errors.simplified}</span>
                    )}
                  </>
                ) : (
                  <span style={{ fontFamily: 'var(--font-hanzi)', fontSize: '1.25rem', fontWeight: 700 }}>
                    {simplified}
                  </span>
                )}
              </div>

              <div className="lcm-form-group">
                <label className="lcm-form-label">Hán tự phồn thể</label>
                {isEditing ? (
                  <input
                    className="lcm-form-input"
                    value={traditional}
                    onChange={(e) => setTraditional(e.target.value)}
                  />
                ) : (
                  <span style={{ fontFamily: 'var(--font-hanzi)', fontSize: '1.25rem' }}>
                    {traditional || simplified}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="lcm-form-group">
                <label className="lcm-form-label">Phiên âm Pinyin *</label>
                {isEditing ? (
                  <>
                    <input
                      className="lcm-form-input"
                      value={pinyin}
                      onChange={(e) => setPinyin(e.target.value)}
                    />
                    {errors.pinyin && (
                      <span style={{ color: '#dc2626', fontSize: '11px' }}>{errors.pinyin}</span>
                    )}
                  </>
                ) : (
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{pinyin}</span>
                )}
              </div>

              <div className="lcm-form-group">
                <label className="lcm-form-label">Từ loại</label>
                {isEditing ? (
                  <input
                    className="lcm-form-input"
                    value={partOfSpeech}
                    onChange={(e) => setPartOfSpeech(e.target.value)}
                    placeholder="e.g. Động từ, Danh từ..."
                  />
                ) : (
                  <span>{partOfSpeech || 'Chưa phân loại'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Section: Giải nghĩa */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h4
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--muted)',
                margin: 0,
              }}
            >
              2. Giải nghĩa tiếng Việt & Gợi ý từ điển
            </h4>

            {/* CVDICT Suggestion Banner */}
            {vocabulary.suggestedMeaningVi && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f766e', fontWeight: 600, fontSize: '12px' }}>
                    <Sparkles size={14} color="#0d9488" />
                    <span>Gợi ý Từ điển CVDICT (CC BY-SA 4.0):</span>
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      className="ds-btn ds-btn-sm"
                      style={{
                        backgroundColor: '#0d9488',
                        color: '#fff',
                        border: 'none',
                        padding: '3px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      onClick={handleApplyCvdictSuggestion}
                      title="Chép nghĩa gợi ý vào ô nhập (Chưa tự động lưu)"
                    >
                      <Copy size={12} /> Sử dụng nghĩa gợi ý
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#134e4a', fontWeight: 500, lineHeight: 1.4 }}>
                  {vocabulary.suggestedMeaningVi}
                </div>
                <div style={{ fontSize: '11px', color: '#0f766e', fontStyle: 'italic' }}>
                  Nguồn: CVDICT. Cần kiểm duyệt thủ công phù hợp ngữ cảnh bài học trước khi xuất bản.
                </div>
              </div>
            )}

            {/* HSK 2 Ambiguous & Homograph Warning Banner */}
            {(HSK2_AMBIGUOUS_WORDS[simplified.trim()] || vocabulary.homograph) && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: 700, fontSize: '12px' }}>
                  <AlertTriangle size={15} color="#d97706" />
                  <span>CẢNH BÁO TỪ ĐỒNG HÌNH / ĐA NGHĨA HSK:</span>
                </div>
                <div style={{ fontSize: '12px', color: '#92400e', lineHeight: 1.4 }}>
                  {HSK2_AMBIGUOUS_WORDS[simplified.trim()] || `Mục từ có nhãn đồng hình: ${vocabulary.homograph}. Cần kiểm tra kỹ ngữ cảnh HSK trước khi duyệt.`}
                </div>
              </div>
            )}

            {/* Dictionary Suggestion Banner */}
            {suggestionResult.status === 'PINYIN_MISMATCH' && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991b1b', fontWeight: 600, fontSize: '12px' }}>
                  <AlertTriangle size={14} color="#dc2626" />
                  <span>Pinyin không khớp gợi ý từ điển HSK 1 ({suggestionResult.candidatePinyin}):</span>
                </div>
                <div style={{ fontSize: '12px', color: '#7f1d1d' }}>
                  Chữ Hán <strong>{suggestionResult.hanzi}</strong> có âm chuẩn trong HSK 1 là <strong>{suggestionResult.candidatePinyin}</strong>.
                  Pinyin đang nhập là <strong>"{pinyin}"</strong>. Hệ thống không tự động áp dụng gợi ý để tránh sai lệch nghĩa đối với từ đồng hình khác âm đọc.
                </div>
              </div>
            )}

            {suggestion && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 600, fontSize: '12px' }}>
                    <Sparkles size={14} color="#16a34a" />
                    <span>Gợi ý từ điển HSK 1 (Khớp Hanzi & Pinyin):</span>
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      className="ds-btn ds-btn-sm"
                      style={{
                        backgroundColor: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        padding: '3px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                      onClick={handleApplySuggestion}
                    >
                      Áp dụng gợi ý
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#14532d' }}>
                  <strong>{suggestion.meaningVi}</strong>
                  {suggestion.partOfSpeech && (
                    <span style={{ marginLeft: '8px', color: '#4b5563', fontSize: '11px' }}>
                      ({suggestion.partOfSpeech})
                    </span>
                  )}
                </div>
                {suggestion.manualReviewRequired && (
                  <div
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fde68a',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#92400e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>⚠️ <strong>Cần kiểm tra kỹ:</strong> {suggestion.notes || 'Từ có nhiều nghĩa hoặc từ loại đặc biệt theo ngữ cảnh.'}</span>
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#65a30d', fontStyle: 'italic' }}>
                  Lưu ý: Đây chỉ là gợi ý tham khảo. Người kiểm duyệt cần kiểm tra và xác nhận trước khi lưu/xuất bản.
                </div>
              </div>
            )}

            <div className="lcm-form-group">
              <label className="lcm-form-label">
                Nghĩa tiếng Việt *{' '}
                {!meaningVi.trim() && (
                  <span style={{ color: '#d97706', fontWeight: 400, fontSize: '11px' }}>
                    (Bắt buộc để xuất bản)
                  </span>
                )}
              </label>
              {isEditing ? (
                <>
                  <input
                    className="lcm-form-input"
                    value={meaningVi}
                    placeholder="Nhập nghĩa tiếng Việt cho từ..."
                    onChange={(e) => {
                      setMeaningVi(e.target.value);
                      if (errors.meaningVi) {
                        setErrors((prev) => {
                          const cp = { ...prev };
                          delete cp.meaningVi;
                          return cp;
                        });
                      }
                    }}
                  />
                  {errors.meaningVi && (
                    <span style={{ color: '#dc2626', fontSize: '11px' }}>{errors.meaningVi}</span>
                  )}
                </>
              ) : (
                <span style={{ fontWeight: 600 }}>
                  {meaningVi || (
                    <span style={{ color: '#d97706', fontStyle: 'italic' }}>
                      Chưa có nghĩa tiếng Việt (Bản nháp)
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="lcm-form-group">
              <label className="lcm-form-label">Nghĩa tiếng Anh</label>
              {isEditing ? (
                <input
                  className="lcm-form-input"
                  value={meaningEn}
                  onChange={(e) => setMeaningEn(e.target.value)}
                />
              ) : (
                <span style={{ color: 'var(--muted)' }}>{meaningEn || 'None'}</span>
              )}
            </div>
          </div>

          {/* Section: Cấp độ HSK & Trạng thái */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h4
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--muted)',
                margin: 0,
              }}
            >
              3. Cấp độ HSK & Trạng thái
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="lcm-form-group">
                <label className="lcm-form-label">Cấp độ HSK</label>
                {isEditing ? (
                  <select
                    className="lcm-form-input"
                    value={hskLevelId}
                    onChange={(e) => setHskLevelId(e.target.value)}
                  >
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.name} ({lvl.levelCode})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span>
                    <strong>{currentLevel?.name || 'HSK'}</strong>
                  </span>
                )}
              </div>

              <div className="lcm-form-group">
                <label className="lcm-form-label">Trạng thái xuất bản</label>
                {isEditing ? (
                  <select
                    className="lcm-form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ContentStatus)}
                  >
                    <option value="DRAFT">Bản nháp (DRAFT)</option>
                    <option value="PENDING_REVIEW">Chờ duyệt (PENDING_REVIEW)</option>
                    <option value="PUBLISHED" disabled={!meaningVi.trim()}>
                      Đã xuất bản (PUBLISHED) {!meaningVi.trim() ? '- Cần có nghĩa tiếng Việt' : ''}
                    </option>
                    <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
                  </select>
                ) : (
                  <ContentStatusBadge status={status} />
                )}
              </div>
            </div>

            {/* Review Notes field */}
            <div className="lcm-form-group">
              <label className="lcm-form-label">Ghi chú kiểm duyệt / Biên tập</label>
              {isEditing ? (
                <input
                  className="lcm-form-input"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Ghi chú lý do duyệt, lưu ý ngữ cảnh bài học..."
                />
              ) : (
                <span style={{ fontSize: '12px', color: vocabulary.reviewNotes ? '#1e293b' : 'var(--muted)', fontStyle: vocabulary.reviewNotes ? 'normal' : 'italic' }}>
                  {vocabulary.reviewNotes || 'Chưa có ghi chú kiểm duyệt'}
                </span>
              )}
            </div>

            {/* Audit Review metadata */}
            {vocabulary.reviewedAt && (
              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} />
                <span>Kiểm duyệt lúc: {new Date(vocabulary.reviewedAt).toLocaleString('vi-VN')}</span>
              </div>
            )}

            {(vocabulary.sourceDataset ||
              vocabulary.sourceEntryId ||
              vocabulary.sourceId ||
              vocabulary.levelLabel ||
              vocabulary.entry ||
              vocabulary.homograph) && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'var(--background-secondary, #f8fafc)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginTop: '6px',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
                  THÔNG TIN NGUỒN HSK 3.0
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {vocabulary.sourceDataset && (
                    <div>
                      Bộ dữ liệu: <strong>{vocabulary.sourceDataset}</strong>
                    </div>
                  )}
                  {(vocabulary.sourceEntryId || vocabulary.sourceId) && (
                    <div>
                      Mã mục (ID): <strong>{vocabulary.sourceEntryId || vocabulary.sourceId}</strong>
                    </div>
                  )}
                  {vocabulary.levelLabel && (
                    <div>
                      Cấp HSK: <strong>{vocabulary.levelLabel}</strong>
                    </div>
                  )}
                  {vocabulary.entry && (
                    <div>
                      Entry: <strong>{vocabulary.entry}</strong>
                    </div>
                  )}
                  {vocabulary.homograph && (
                    <div>
                      Đồng âm: <strong>{vocabulary.homograph}</strong>
                    </div>
                  )}
                  {vocabulary.sourcePdfPage && (
                    <div>
                      Trang PDF: <strong>{vocabulary.sourcePdfPage}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section: Ví dụ minh họa */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  margin: 0,
                }}
              >
                4. Ví dụ minh họa ({examples.length})
              </h4>
              {isEditing && (
                <button
                  type="button"
                  className="ds-btn ds-btn-ghost ds-btn-sm"
                  onClick={handleAddExample}
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                >
                  <Plus size={12} /> Thêm câu ví dụ
                </button>
              )}
            </div>

            {examples.length === 0 ? (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                Chưa có câu ví dụ nào.
              </p>
            ) : (
              examples.map((ex, idx) => (
                <div
                  key={ex.id || idx}
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--background)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  {isEditing ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>Ví dụ #{idx + 1}</span>
                        <button
                          type="button"
                          className="ds-btn ds-btn-ghost ds-btn-sm"
                          onClick={() => handleRemoveExample(idx)}
                          style={{ padding: '2px 4px', color: '#dc2626' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <input
                        className="lcm-form-input"
                        placeholder="Chữ Hán: 我想喝茶。"
                        value={ex.zh}
                        onChange={(e) => handleExampleChange(idx, 'zh', e.target.value)}
                      />
                      <input
                        className="lcm-form-input"
                        placeholder="Pinyin: Wǒ xiǎng hē chá."
                        value={ex.pinyin}
                        onChange={(e) => handleExampleChange(idx, 'pinyin', e.target.value)}
                      />
                      <input
                        className="lcm-form-input"
                        placeholder="Dịch nghĩa: Tôi muốn uống trà."
                        value={ex.meaningVi}
                        onChange={(e) => handleExampleChange(idx, 'meaningVi', e.target.value)}
                      />
                    </>
                  ) : (
                    <div>
                      <p
                        style={{
                          fontFamily: 'var(--font-hanzi)',
                          fontWeight: 600,
                          margin: '0 0 2px 0',
                          fontSize: 'var(--text-sm)',
                        }}
                      >
                        {ex.zh}
                      </p>
                      <p style={{ color: 'var(--primary)', fontSize: '12px', margin: '0 0 2px 0' }}>{ex.pinyin}</p>
                      <p style={{ color: 'var(--muted)', fontSize: '12px', margin: 0 }}>{ex.meaningVi}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="lcm-drawer-footer" style={{ flexWrap: 'wrap', gap: '8px' }}>
          {onDelete && !vocabulary.id.startsWith('voc-new-') && (
            <button
              type="button"
              className="ds-btn ds-btn-danger ds-btn-sm"
              style={{ marginRight: 'auto' }}
              disabled={isSaving}
              onClick={async () => {
                if (window.confirm('Bạn có chắc chắn muốn xóa từ vựng này không?')) {
                  await onDelete(vocabulary.id);
                }
              }}
            >
              <Trash2 size={14} /> Xóa
            </button>
          )}

          {isEditing ? (
            <>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                disabled={isSaving}
                onClick={() => setIsEditing(false)}
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                disabled={isSaving}
                style={{ borderColor: 'var(--border)' }}
                onClick={() => handleSaveWithStatus('DRAFT', false)}
                title="Lưu nghĩa tiếng Việt và giữ trạng thái Bản nháp (DRAFT)"
              >
                <Save size={14} /> Lưu bản nháp
              </button>

              <button
                type="button"
                className="ds-btn ds-btn-sm"
                disabled={isSaving || !meaningVi.trim()}
                style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => handleSaveWithStatus('PENDING_REVIEW', false)}
                title="Gửi từ vựng vào hàng đợi chờ duyệt"
              >
                <Send size={14} /> Gửi chờ duyệt
              </button>

              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                disabled={isSaving || !meaningVi.trim()}
                title={!meaningVi.trim() ? 'Phải có nghĩa tiếng Việt mới có thể xuất bản' : 'Lưu và xuất bản từ vựng'}
                onClick={() => handleSaveWithStatus('PUBLISHED', false)}
              >
                <CheckCircle size={14} /> Phê duyệt & Xuất bản
              </button>

              {onNavigateNext && currentIndex !== undefined && totalCount !== undefined && currentIndex < totalCount - 1 && (
                <>
                  <button
                    type="button"
                    className="ds-btn ds-btn-secondary ds-btn-sm"
                    disabled={isSaving}
                    style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none' }}
                    onClick={() => handleSaveWithStatus('DRAFT', true)}
                    title="Lưu nghĩa dạng Bản nháp (DRAFT) và chuyển sang từ tiếp theo"
                  >
                    <span>Lưu nháp & Tiếp theo</span> <ArrowRight size={14} />
                  </button>

                  {meaningVi.trim() && (
                    <button
                      type="button"
                      className="ds-btn ds-btn-secondary ds-btn-sm"
                      disabled={isSaving}
                      style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none' }}
                      onClick={() => handleSaveWithStatus('PUBLISHED', true)}
                      title="Xuất bản từ này và chuyển ngay sang từ tiếp theo"
                    >
                      <CheckCircle size={14} /> <span>Xuất bản & Tiếp theo</span> <ArrowRight size={14} />
                    </button>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={onClose}
              >
                Đóng
              </button>

              {vocabulary.status === 'DRAFT' && meaningVi.trim() && (
                <button
                  type="button"
                  className="ds-btn ds-btn-sm"
                  style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  disabled={isSaving}
                  onClick={() => handleSaveWithStatus('PENDING_REVIEW', false)}
                >
                  <Send size={14} /> Gửi chờ duyệt
                </button>
              )}

              {vocabulary.status === 'PENDING_REVIEW' && (
                <>
                  <button
                    type="button"
                    className="ds-btn ds-btn-outline ds-btn-sm"
                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                    disabled={isSaving}
                    onClick={() => handleSaveWithStatus('DRAFT', false)}
                    title="Từ chối duyệt và trả về Bản nháp"
                  >
                    <XCircle size={14} /> Trả về Nháp
                  </button>

                  <button
                    type="button"
                    className="ds-btn ds-btn-primary ds-btn-sm"
                    disabled={isSaving || !meaningVi.trim()}
                    onClick={() => handleSaveWithStatus('PUBLISHED', false)}
                  >
                    <CheckCircle size={14} /> Phê duyệt & Xuất bản
                  </button>
                </>
              )}

              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={14} /> Chỉnh sửa
              </button>

              {onNavigateNext && currentIndex !== undefined && totalCount !== undefined && currentIndex < totalCount - 1 && (
                <button
                  type="button"
                  className="ds-btn ds-btn-ghost ds-btn-sm"
                  onClick={onNavigateNext}
                >
                  <span>Từ kế tiếp</span> <ArrowRight size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
