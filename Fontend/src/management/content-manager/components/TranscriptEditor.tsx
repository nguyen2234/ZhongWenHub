import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import type { TranscriptSegment } from '../types/video.types';
import { secondsToTimestamp, timestampToSeconds } from '../services/video-management.service';

export interface TranscriptEditorProps {
  transcripts: TranscriptSegment[];
  onChange: (transcripts: TranscriptSegment[]) => void;
  activeSegmentId?: string | null;
  onSeek?: (seconds: number) => void;
}

export const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  transcripts,
  onChange,
  activeSegmentId,
  onSeek,
}) => {
  const handleAddSegment = () => {
    const lastSeg = transcripts[transcripts.length - 1];
    const newStart = lastSeg ? lastSeg.endTime + 0.5 : 0;
    const newEnd = newStart + 3.0;

    const newSegment: TranscriptSegment = {
      id: `ts-${Date.now()}`,
      startTime: newStart,
      endTime: newEnd,
      startFormatted: secondsToTimestamp(newStart),
      endFormatted: secondsToTimestamp(newEnd),
      textZh: '',
      pinyin: '',
      textVi: '',
    };

    onChange([...transcripts, newSegment]);
  };

  const handleUpdateSegment = (id: string, field: keyof TranscriptSegment, value: string) => {
    const updated = transcripts.map((seg) => {
      if (seg.id !== id) return seg;

      if (field === 'startFormatted') {
        const sec = timestampToSeconds(value);
        return {
          ...seg,
          startFormatted: value,
          startTime: sec,
        };
      }
      if (field === 'endFormatted') {
        const sec = timestampToSeconds(value);
        return {
          ...seg,
          endFormatted: value,
          endTime: sec,
        };
      }
      return {
        ...seg,
        [field]: value,
      };
    });
    onChange(updated);
  };

  const handleDeleteSegment = (id: string) => {
    onChange(transcripts.filter((s) => s.id !== id));
  };

  const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= transcripts.length) return;

    const copy = [...transcripts];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    onChange(copy);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>
            Danh sách phân đoạn phụ đề ({transcripts.length})
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Thời gian định dạng mm:ss.ms (ví dụ: 00:01.500)
          </span>
        </div>
        <button
          type="button"
          onClick={handleAddSegment}
          className="ds-btn ds-btn-secondary"
          style={{ height: '34px', fontSize: '12.5px', gap: '6px' }}
        >
          <Plus size={14} /> Thêm đoạn phụ đề
        </button>
      </div>

      {transcripts.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-6)',
            textAlign: 'center',
            backgroundColor: 'var(--background)',
            border: '1px dashed var(--border-strong)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--muted)',
            fontSize: '13px',
          }}
        >
          Chưa có phân đoạn phụ đề nào. Bấm &quot;Thêm đoạn phụ đề&quot; để bắt đầu biên tập.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {transcripts.map((seg, idx) => {
            const isInvalidTime = seg.endTime <= seg.startTime;
            const isActive = activeSegmentId === seg.id;

            return (
              <div
                key={seg.id}
                style={{
                  padding: '12px 14px',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'var(--surface)',
                  border: `1px solid ${isActive ? 'var(--primary)' : isInvalidTime ? 'var(--danger-border)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Header Row: Segment Index & Time Ranges */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: 'var(--secondary)',
                        color: 'var(--muted)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      #{idx + 1}
                    </span>

                    {/* Time Input: Start */}
                    <input
                      type="text"
                      value={seg.startFormatted}
                      onChange={(e) => handleUpdateSegment(seg.id, 'startFormatted', e.target.value)}
                      placeholder="00:00.000"
                      aria-label="Thời điểm bắt đầu"
                      style={{
                        width: '95px',
                        height: '30px',
                        fontSize: '12px',
                        padding: '0 6px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)',
                        fontFamily: 'monospace',
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ color: 'var(--muted)', fontSize: '12px' }}>→</span>
                    {/* Time Input: End */}
                    <input
                      type="text"
                      value={seg.endFormatted}
                      onChange={(e) => handleUpdateSegment(seg.id, 'endFormatted', e.target.value)}
                      placeholder="00:00.000"
                      aria-label="Thời điểm kết thúc"
                      style={{
                        width: '95px',
                        height: '30px',
                        fontSize: '12px',
                        padding: '0 6px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isInvalidTime ? 'var(--danger)' : 'var(--border-strong)'}`,
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)',
                        fontFamily: 'monospace',
                        textAlign: 'center',
                      }}
                    />

                    {isInvalidTime && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--danger)',
                          fontSize: '11px',
                        }}
                      >
                        <AlertCircle size={13} /> Thời gian kết thúc phải lớn hơn bắt đầu
                      </span>
                    )}
                  </div>

                  {/* Actions: Seek, Reorder, Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {onSeek && (
                      <button
                        type="button"
                        onClick={() => onSeek(seg.startTime)}
                        className="ds-btn ds-btn-ghost"
                        style={{ height: '28px', padding: '0 8px', fontSize: '11.5px' }}
                        title="Nghe thử từ đoạn này"
                      >
                        Nghe thử
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'UP')}
                      className="ds-btn ds-btn-ghost ds-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Chuyển lên"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === transcripts.length - 1}
                      onClick={() => handleMove(idx, 'DOWN')}
                      className="ds-btn ds-btn-ghost ds-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Chuyển xuống"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSegment(seg.id)}
                      className="ds-btn ds-btn-ghost ds-btn-icon"
                      style={{ width: '28px', height: '28px', color: 'var(--danger)' }}
                      title="Xóa phân đoạn này"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Subtitle fields (Chinese, Pinyin, Vietnamese) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginBottom: '3px' }}>
                      Chữ Hán (Chinese)
                    </label>
                    <input
                      type="text"
                      value={seg.textZh}
                      onChange={(e) => handleUpdateSegment(seg.id, 'textZh', e.target.value)}
                      placeholder="Ví dụ: 你好！很高兴认识你。"
                      style={{
                        width: '100%',
                        height: '34px',
                        fontSize: '13px',
                        padding: '0 8px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginBottom: '3px' }}>
                      Phiên âm Pinyin
                    </label>
                    <input
                      type="text"
                      value={seg.pinyin}
                      onChange={(e) => handleUpdateSegment(seg.id, 'pinyin', e.target.value)}
                      placeholder="Ví dụ: Nǐ hǎo! Hěn gāoxìng rènshí nǐ."
                      style={{
                        width: '100%',
                        height: '34px',
                        fontSize: '13px',
                        padding: '0 8px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginBottom: '3px' }}>
                      Dịch nghĩa tiếng Việt
                    </label>
                    <input
                      type="text"
                      value={seg.textVi}
                      onChange={(e) => handleUpdateSegment(seg.id, 'textVi', e.target.value)}
                      placeholder="Ví dụ: Xin chào! Rất vui được làm quen với bạn."
                      style={{
                        width: '100%',
                        height: '34px',
                        fontSize: '13px',
                        padding: '0 8px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default TranscriptEditor;
