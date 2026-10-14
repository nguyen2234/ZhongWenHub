import React, { useState, useEffect } from 'react';
import { X, Edit3, Save } from 'lucide-react';
import { ContentStatusBadge } from './ContentStatusBadge';
import type {
  ChineseCharacter,
  ContentStatus,
  HskLevel,
  UpdateCharacterDTO,
} from '../types';

export interface CharacterDetailDrawerProps {
  isOpen: boolean;
  character: ChineseCharacter | null;
  levels: HskLevel[];
  onClose: () => void;
  onSave: (id: string, dto: UpdateCharacterDTO) => void;
}

export const CharacterDetailDrawer: React.FC<CharacterDetailDrawerProps> = ({
  isOpen,
  character,
  levels,
  onClose,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [charVal, setCharVal] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [sinoVietnamese, setSinoVietnamese] = useState('');
  const [meaningVi, setMeaningVi] = useState('');
  const [radical, setRadical] = useState('');
  const [strokeCount, setStrokeCount] = useState<number>(0);
  const [frequencyRank, setFrequencyRank] = useState<number | undefined>(undefined);
  const [hskLevelId, setHskLevelId] = useState('');
  const [status, setStatus] = useState<ContentStatus>('PUBLISHED');

  useEffect(() => {
    if (character) {
      setCharVal(character.character);
      setPinyin(character.pinyin);
      setSinoVietnamese(character.sinoVietnamese);
      setMeaningVi(character.meaningVi);
      setRadical(character.radical);
      setStrokeCount(character.strokeCount);
      setFrequencyRank(character.frequencyRank);
      setHskLevelId(character.hskLevelId);
      setStatus(character.status);
      setIsEditing(false);
    }
  }, [character]);

  if (!isOpen || !character) return null;

  const handleSave = () => {
    onSave(character.id, {
      character: charVal,
      pinyin,
      sinoVietnamese,
      meaningVi,
      radical,
      strokeCount,
      frequencyRank,
      hskLevelId,
      status,
    });
    setIsEditing(false);
  };

  const currentLevel = levels.find((l) => l.id === hskLevelId);

  return (
    <div className="lcm-drawer-overlay" onClick={onClose}>
      <div className="lcm-drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="lcm-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h3 className="lcm-drawer-title">
              Chữ Hán: <span style={{ fontFamily: 'var(--font-hanzi)', fontSize: '1.4rem' }}>{charVal}</span>
            </h3>
            <ContentStatusBadge status={status} />
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-ghost ds-btn-sm"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="lcm-drawer-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="lcm-form-group">
                <label className="lcm-form-label">Chữ Hán (Đơn tự) *</label>
                {isEditing ? (
                  <input
                    className="lcm-form-input"
                    value={charVal}
                    onChange={(e) => setCharVal(e.target.value)}
                  />
                ) : (
                  <span style={{ fontFamily: 'var(--font-hanzi)', fontSize: '2rem', fontWeight: 700 }}>
                    {charVal}
                  </span>
                )}
              </div>

              <div className="lcm-form-group">
                <label className="lcm-form-label">Phiên âm Pinyin *</label>
                {isEditing ? (
                  <input
                    className="lcm-form-input"
                    value={pinyin}
                    onChange={(e) => setPinyin(e.target.value)}
                  />
                ) : (
                  <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem' }}>
                    {pinyin}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="lcm-form-group">
                <label className="lcm-form-label">Âm Hán Việt</label>
                {isEditing ? (
                  <input
                    className="lcm-form-input"
                    value={sinoVietnamese}
                    onChange={(e) => setSinoVietnamese(e.target.value)}
                  />
                ) : (
                  <span style={{ fontWeight: 600 }}>{sinoVietnamese}</span>
                )}
              </div>

              <div className="lcm-form-group">
                <label className="lcm-form-label">Bộ thủ (Radical)</label>
                {isEditing ? (
                  <input
                    className="lcm-form-input"
                    value={radical}
                    onChange={(e) => setRadical(e.target.value)}
                  />
                ) : (
                  <span>{radical}</span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="lcm-form-group">
                <label className="lcm-form-label">Số nét (Strokes)</label>
                {isEditing ? (
                  <input
                    type="number"
                    className="lcm-form-input"
                    value={strokeCount}
                    onChange={(e) => setStrokeCount(Number(e.target.value))}
                  />
                ) : (
                  <span>{strokeCount} nét</span>
                )}
              </div>

              <div className="lcm-form-group">
                <label className="lcm-form-label">Thứ hạng tần suất (Rank)</label>
                {isEditing ? (
                  <input
                    type="number"
                    className="lcm-form-input"
                    value={frequencyRank ?? ''}
                    onChange={(e) => setFrequencyRank(e.target.value ? Number(e.target.value) : undefined)}
                  />
                ) : (
                  <span>{frequencyRank ? `#${frequencyRank}` : 'Chưa xếp hạng'}</span>
                )}
              </div>
            </div>

            <div className="lcm-form-group">
              <label className="lcm-form-label">Giải nghĩa chữ Hán</label>
              {isEditing ? (
                <input
                  className="lcm-form-input"
                  value={meaningVi}
                  onChange={(e) => setMeaningVi(e.target.value)}
                />
              ) : (
                <span style={{ fontWeight: 500 }}>{meaningVi}</span>
              )}
            </div>

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
                  <span><strong>{currentLevel?.name || 'HSK'}</strong></span>
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
                    <option value="DRAFT">Bản nháp</option>
                    <option value="PENDING_REVIEW">Chờ duyệt</option>
                    <option value="PUBLISHED">Đã xuất bản</option>
                    <option value="ARCHIVED">Lưu trữ</option>
                  </select>
                ) : (
                  <ContentStatusBadge status={status} />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lcm-drawer-footer">
          {isEditing ? (
            <>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={() => setIsEditing(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={handleSave}
              >
                <Save size={14} /> Lưu thay đổi
              </button>
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
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={14} /> Chỉnh sửa
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
