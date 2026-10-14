import React, { useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Trash2, Star, BookOpen } from 'lucide-react';
import { VocabularyPickerModal } from './VocabularyPickerModal';
import type { LessonVocabularyItem, Vocabulary } from '../../types';

interface VocabularySectionEditorProps {
  lessonId: string;
  vocabularies: LessonVocabularyItem[];
  onChange: (updatedVocabs: LessonVocabularyItem[]) => void;
}

export const VocabularySectionEditor: React.FC<VocabularySectionEditorProps> = ({
  lessonId,
  vocabularies,
  onChange,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Add vocabularies from repository picker
  const handleAddFromPicker = (selectedVocabs: Vocabulary[]) => {
    const startOrder = vocabularies.length + 1;
    const newItems: LessonVocabularyItem[] = selectedVocabs.map((v, idx) => ({
      id: `lv-${Date.now()}-${idx}`,
      lessonId,
      vocabularyId: v.id,
      displayOrder: startOrder + idx,
      isCoreWord: idx < 3, // Default first few as core
      customExampleZh: v.examples?.[0]?.zh || '',
      customExamplePinyin: v.examples?.[0]?.pinyin || '',
      customExampleVi: v.examples?.[0]?.meaningVi || '',
      vocabulary: v,
    }));

    onChange([...vocabularies, ...newItems]);
  };

  // Detach vocabulary from lesson (MUST NOT delete from repository)
  const handleDetach = (id: string) => {
    const filtered = vocabularies.filter((v) => v.id !== id);
    const reordered = filtered.map((item, index) => ({
      ...item,
      displayOrder: index + 1,
    }));
    onChange(reordered);
  };

  // Toggle Core Word
  const handleToggleCoreWord = (id: string) => {
    onChange(
      vocabularies.map((item) =>
        item.id === id ? { ...item, isCoreWord: !item.isCoreWord } : item
      )
    );
  };

  // Reorder
  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    const newIdx = direction === 'UP' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= vocabularies.length) return;
    const updated = [...vocabularies];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    // Recalculate displayOrder
    const reordered = updated.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));
    onChange(reordered);
  };

  // Update custom example
  const handleUpdateCustomExample = (
    id: string,
    field: 'customExampleZh' | 'customExamplePinyin' | 'customExampleVi',
    val: string
  ) => {
    onChange(
      vocabularies.map((item) =>
        item.id === id ? { ...item, [field]: val } : item
      )
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header Bar */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-5)',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <BookOpen size={18} style={{ color: 'var(--primary)' }} />
            <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
              Từ vựng liên kết bài học ({vocabularies.length} từ)
            </h4>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            Gắn từ vựng từ Kho HSK Chuẩn. Bài học cần tối thiểu 5 từ vựng để đạt chuẩn xuất bản.
          </p>
        </div>

        <button
          type="button"
          className="ds-btn ds-btn-primary ds-btn-sm"
          onClick={() => setIsPickerOpen(true)}
        >
          <Plus size={15} /> Thêm từ vựng từ kho
        </button>
      </div>

      {/* Vocabulary List */}
      {vocabularies.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-10) var(--space-4)',
            textAlign: 'center',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-xl)',
            border: '2px dashed var(--border)',
          }}
        >
          <div style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
            Chưa có từ vựng nào được gắn vào bài học này.
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={() => setIsPickerOpen(true)}
          >
            <Plus size={15} /> Mở kho từ vựng HSK
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {vocabularies.map((item, index) => {
            const isExpanded = expandedItemId === item.id;
            const word = item.vocabulary;

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: `1.5px solid ${item.isCoreWord ? 'var(--primary)' : 'var(--border)'}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Main Card Row */}
                <div
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 'var(--space-3)',
                  }}
                >
                  {/* Left: Order, Hanzi, Pinyin, Meaning */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'var(--text-2xs)',
                        fontWeight: 700,
                        color: 'var(--muted)',
                      }}
                    >
                      {item.displayOrder}
                    </span>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-hanzi)',
                            fontSize: 'var(--text-xl)',
                            fontWeight: 700,
                            color: 'var(--foreground)',
                          }}
                        >
                          {word?.simplified || '—'}
                        </span>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', fontWeight: 600 }}>
                          {word?.pinyin || ''}
                        </span>
                        {word?.partOfSpeech && (
                          <span
                            style={{
                              fontSize: 'var(--text-2xs)',
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'var(--background)',
                              border: '1px solid var(--border)',
                              color: 'var(--muted)',
                            }}
                          >
                            {word.partOfSpeech}
                          </span>
                        )}
                        {item.isCoreWord && (
                          <span
                            style={{
                              fontSize: 'var(--text-2xs)',
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'var(--primary-light)',
                              color: 'var(--primary)',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <Star size={11} fill="currentColor" /> Từ trọng tâm
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '2px' }}>
                        {word?.meaningVi || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <button
                      type="button"
                      className={`ds-btn ds-btn-xs ${item.isCoreWord ? 'ds-btn-primary' : 'ds-btn-outline'}`}
                      onClick={() => handleToggleCoreWord(item.id)}
                      title="Chuyển đổi trạng thái từ trọng tâm bài học"
                    >
                      <Star size={12} fill={item.isCoreWord ? 'currentColor' : 'none'} />
                      {item.isCoreWord ? 'Trọng tâm' : 'Đánh dấu trọng tâm'}
                    </button>

                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-xs"
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    >
                      {isExpanded ? 'Ẩn ví dụ riêng' : 'Ví dụ riêng của bài'}
                    </button>

                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button
                        type="button"
                        className="ds-btn ds-btn-ghost ds-btn-xs"
                        disabled={index === 0}
                        onClick={() => handleMove(index, 'UP')}
                        title="Di chuyển lên"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        className="ds-btn ds-btn-ghost ds-btn-xs"
                        disabled={index === vocabularies.length - 1}
                        onClick={() => handleMove(index, 'DOWN')}
                        title="Di chuyển xuống"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>

                    <button
                      type="button"
                      className="ds-btn ds-btn-ghost ds-btn-xs"
                      onClick={() => handleDetach(item.id)}
                      style={{ color: 'var(--danger)' }}
                      title="Gỡ liên kết khỏi bài học (Không xóa khỏi kho)"
                    >
                      <Trash2 size={13} /> Gỡ khỏi bài
                    </button>
                  </div>
                </div>

                {/* Optional Custom Example Form */}
                {isExpanded && (
                  <div
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      backgroundColor: 'var(--background)',
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--foreground)' }}>
                      Câu ví dụ ngữ cảnh riêng cho bài học (Tùy chọn):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                      <input
                        type="text"
                        className="lcm-form-input"
                        placeholder="Câu chữ Hán riêng: 我想喝茶。"
                        value={item.customExampleZh || ''}
                        onChange={(e) => handleUpdateCustomExample(item.id, 'customExampleZh', e.target.value)}
                        style={{ fontFamily: 'var(--font-hanzi)' }}
                      />
                      <input
                        type="text"
                        className="lcm-form-input"
                        placeholder="Phiên âm Pinyin: Wǒ xiǎng hē chá."
                        value={item.customExamplePinyin || ''}
                        onChange={(e) => handleUpdateCustomExample(item.id, 'customExamplePinyin', e.target.value)}
                      />
                    </div>
                    <input
                      type="text"
                      className="lcm-form-input"
                      placeholder="Dịch nghĩa tiếng Việt: Tôi muốn uống trà."
                      value={item.customExampleVi || ''}
                      onChange={(e) => handleUpdateCustomExample(item.id, 'customExampleVi', e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Vocabulary Picker Modal */}
      <VocabularyPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        attachedVocabularyIds={vocabularies.map((v) => v.vocabularyId)}
        onSelectVocabularies={handleAddFromPicker}
      />
    </div>
  );
};
