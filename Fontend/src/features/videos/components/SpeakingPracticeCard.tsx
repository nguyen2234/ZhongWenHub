import React from 'react';
import { Mic, Square, Volume2, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { VideoSubtitleLine } from '../types';
import { useAudioRecorder } from './useAudioRecorder';

export interface SpeakingPracticeCardProps {
  sentence: VideoSubtitleLine | null;
  onPlaySample: (text: string) => void;
  onPracticeCompleted?: (durationSeconds: number) => void;
}

export const SpeakingPracticeCard: React.FC<SpeakingPracticeCardProps> = ({
  sentence,
  onPlaySample,
  onPracticeCompleted,
}) => {
  const {
    isRecording,
    recordingDuration,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  if (!sentence) {
    return (
      <div className="speaking-practice-empty-box">
        <p>Chọn một câu phụ đề trong danh sách bên cạnh để bắt đầu luyện nói theo câu.</p>
      </div>
    );
  }

  const handleStopRecording = () => {
    stopRecording();
    if (onPracticeCompleted && recordingDuration > 0) {
      onPracticeCompleted(recordingDuration);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="speaking-practice-card">
      <div className="speaking-practice-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="speaking-practice-badge">Luyện nói theo câu</span>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            {Math.floor(sentence.startTime)}s - {Math.floor(sentence.endTime)}s
          </span>
        </div>

        <button
          type="button"
          className="speaking-sample-btn"
          onClick={() => onPlaySample(sentence.hanzi)}
          title="Nghe phát âm mẫu"
        >
          <Volume2 size={15} />
          <span>Nghe mẫu</span>
        </button>
      </div>

      {/* Target sentence display */}
      <div className="speaking-target-box">
        <div className="speaking-target-hanzi">{sentence.hanzi}</div>
        <div className="speaking-target-pinyin">{sentence.pinyin}</div>
        <div className="speaking-target-vi">{sentence.vietnamese}</div>
      </div>

      {/* Recording Actions */}
      <div className="speaking-recording-controls">
        {!isRecording ? (
          <button
            type="button"
            className="btn-mic-start"
            onClick={startRecording}
            id="btn-start-speaking-record"
          >
            <Mic size={16} />
            <span>{audioUrl ? 'Ghi âm lại câu này' : 'Bắt đầu ghi âm'}</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-mic-stop"
            onClick={handleStopRecording}
            id="btn-stop-speaking-record"
          >
            <Square size={16} fill="currentColor" />
            <span>Dừng ghi ({formatSeconds(recordingDuration)})</span>
          </button>
        )}

        {audioUrl && !isRecording && (
          <button
            type="button"
            className="speaking-reset-btn"
            onClick={clearRecording}
            title="Xóa bản thu âm hiện tại"
          >
            <RotateCcw size={14} />
            <span>Xóa bản thu</span>
          </button>
        )}
      </div>

      {/* Live recording indicator */}
      {isRecording && (
        <div className="speaking-recording-active-banner">
          <span className="speaking-pulse-dot" />
          <span>Đang lắng nghe giọng đọc của bạn... Nhấn &quot;Dừng ghi&quot; khi đọc xong.</span>
        </div>
      )}

      {/* Audio Playback Review for Student Self-Assessment */}
      {audioUrl && !isRecording && (
        <div className="speaking-playback-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#16a34a', marginBottom: '8px' }}>
            <CheckCircle2 size={15} />
            <span>Bản ghi âm của bạn đã sẵn sàng. Hãy bấm nghe lại để đối chiếu ngữ điệu:</span>
          </div>
          <audio src={audioUrl} controls style={{ width: '100%', height: '36px' }} />
        </div>
      )}

      {/* Error Notices */}
      {error === 'permission_denied' && (
        <div className="speaking-error-box">
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>Bạn đã từ chối quyền truy cập Microphone. Vui lòng cho phép quyền trên trình duyệt để ghi âm.</span>
        </div>
      )}

      {error === 'not_supported' && (
        <div className="speaking-error-box">
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>Trình duyệt hiện tại không hỗ trợ ghi âm trực tiếp (MediaRecorder).</span>
        </div>
      )}

      {error === 'device_error' && (
        <div className="speaking-error-box">
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>Không tìm thấy thiết bị Microphone khả dụng hoặc đang có ứng dụng khác chiếm quyền.</span>
        </div>
      )}

      {/* Privacy Guarantee Note */}
      <div className="speaking-privacy-note">
        Bản ghi âm chỉ được lưu tạm thời trên bộ nhớ trình duyệt để bạn tự nghe lại và hoàn toàn không gửi lên máy chủ.
      </div>
    </div>
  );
};
