import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  XCircle,
  Zap,
  Globe,
  HelpCircle,
  Languages,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button, HSKLevel } from '../../../../design-system';
import { ParticleOrb } from './ParticleOrb';
import { AITutorSessionReviewModal } from './AITutorSessionReviewModal';
import { voiceSessionController } from '../../services/voice/VoiceSessionController';
import type {
  VoiceSessionState,
  VoiceSessionMode,
  VoiceTurn,
  VoiceSessionReviewData,
} from '../../services/voice/voice.types';

export interface AITutorLiveViewProps {
  initialMode?: VoiceSessionMode;
  onSwitchToChat?: () => void;
  onBackToDashboard?: () => void;
}

export const AITutorLiveView: React.FC<AITutorLiveViewProps> = ({
  initialMode = 'daily_conversation',
  onSwitchToChat,
  onBackToDashboard,
}) => {
  const [sessionState, setSessionState] = useState<VoiceSessionState>('IDLE');
  const [selectedMode, setSelectedMode] = useState<VoiceSessionMode>(initialMode);
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [durationSec, setDurationSec] = useState<number>(0);
  const [interruptionCount, setInterruptionCount] = useState<number>(0);
  const [showPinyin, setShowPinyin] = useState<boolean>(true);
  const [showVietnamese, setShowVietnamese] = useState<boolean>(true);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState<boolean>(true);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [reviewData, setReviewData] = useState<VoiceSessionReviewData | null>(null);
  const [isMicPermissionDenied, setIsMicPermissionDenied] = useState<boolean>(false);

  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to controller state changes
  useEffect(() => {
    const unsubscribe = voiceSessionController.subscribe((state, eventData) => {
      setSessionState(state);
      setTurns(voiceSessionController.getTurns());

      if (eventData?.metrics) {
        setDurationSec(eventData.metrics.durationSeconds);
        setInterruptionCount(eventData.metrics.interruptionCount);
      }
    });

    // Start initial session
    handleStartNewSession(initialMode);

    return () => {
      unsubscribe();
      voiceSessionController.stopSession();
    };
  }, []);

  // Auto scroll transcript
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [turns, sessionState]);

  const handleStartNewSession = async (mode: VoiceSessionMode) => {
    setSelectedMode(mode);
    setIsReviewOpen(false);

    // Attempt microphone permission (graceful fallback if denied or running in tests)
    const hasMic = await voiceSessionController.requestMicrophone();
    if (!hasMic) {
      setIsMicPermissionDenied(true);
    } else {
      setIsMicPermissionDenied(false);
    }

    await voiceSessionController.startSession(mode, undefined, 2);
  };

  const handleToggleMic = () => {
    if (sessionState === 'LISTENING') {
      voiceSessionController.stopListening();
    } else {
      voiceSessionController.startListening();
    }
  };

  const handleInterrupt = () => {
    voiceSessionController.interruptAssistant();
  };

  const handleTogglePause = () => {
    if (sessionState === 'PAUSED') {
      voiceSessionController.resumeSession();
    } else {
      voiceSessionController.pauseSession();
    }
  };

  const handleEndSession = () => {
    const data = voiceSessionController.stopSession();
    setReviewData(data);
    setIsReviewOpen(true);
  };

  const handleSendGuidedResponse = (sug: { hanzi: string; pinyin: string; vietnamese: string }) => {
    voiceSessionController.sendUserUtterance(sug);
  };

  const handleHelpMeAnswer = () => {
    const scenario = voiceSessionController.getScenario();
    if (scenario.suggestedResponses.length > 0) {
      const topSug = scenario.suggestedResponses[0];
      voiceSessionController.sendUserUtterance(topSug);
    }
  };

  const handleRepeatLast = () => {
    const assistantTurns = turns.filter((t) => t.speaker === 'assistant');
    if (assistantTurns.length > 0) {
      voiceSessionController.interruptAssistant();
      setTimeout(() => {
        voiceSessionController.sendUserUtterance({
          hanzi: '请再说一遍，谢谢。',
          pinyin: 'Qǐng zài shuō yībiàn, xièxiè.',
          vietnamese: 'Làm ơn nói lại một lần nữa, cảm ơn.',
        });
      }, 300);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const scenario = voiceSessionController.getScenario();
  const latestAiTurn = [...turns].reverse().find((t) => t.speaker === 'assistant');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 120px)',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid #1e293b',
      }}
    >
      {/* =====================================================================
          1. TOP BAR: Session Meta, HSK Level, Mode Tabs, Duration Timer
          ===================================================================== */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-6)',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#ffffff' }}>
                {scenario.topic}
              </span>
              <HSKLevel level={2} />
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Phiên luyện nói phản xạ thời gian thực • Hỗ trợ cắt lời tự nhiên (Barge-in)
            </span>
          </div>
        </div>

        {/* Mode Selector Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {(
            [
              { id: 'daily_conversation', label: 'Hội thoại đời sống' },
              { id: 'free_talk', label: 'Tự do giao tiếp' },
              { id: 'roleplay', label: 'Đóng vai' },
              { id: 'hsk_speaking', label: 'Khẩu ngữ HSK' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleStartNewSession(m.id)}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 600,
                border: selectedMode === m.id ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: selectedMode === m.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedMode === m.id ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Session Timer & End Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: '#38bdf8',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: sessionState === 'PAUSED' ? '#94a3b8' : '#22c55e',
                animation: sessionState === 'PAUSED' ? 'none' : 'pulse 1.5s infinite',
              }}
            />
            <span>{formatTimer(durationSec)}</span>
          </div>

          <Button
            variant="ghost"
            style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            icon={<XCircle size={15} />}
            onClick={handleEndSession}
          >
            Kết thúc
          </Button>
        </div>
      </div>

      {/* Mic permission advisory banner if denied */}
      {isMicPermissionDenied && (
        <div
          style={{
            padding: '6px var(--space-6)',
            backgroundColor: 'rgba(217, 119, 6, 0.2)',
            borderBottom: '1px solid rgba(217, 119, 6, 0.3)',
            fontSize: '11px',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            ℹ️ Không thể truy cập micro hệ thống hoặc quyền mic bị từ chối. Bạn vẫn có thể luyện nói trực tiếp bằng các nút mẫu câu bên dưới!
          </span>
          <button
            type="button"
            onClick={() => handleToggleMic()}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            Thử lại mic
          </button>
        </div>
      )}

      {/* =====================================================================
          2. CENTER: Large Particle Orb, Live Status, Active Speaker
          ===================================================================== */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6) var(--space-4)',
          position: 'relative',
        }}
      >
        {/* Particle Orb Interactive Centerpiece */}
        <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
          <ParticleOrb state={sessionState} size={290} onClick={handleInterrupt} />
        </div>

        {/* State Badge and Live Guidance */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor:
                sessionState === 'SPEAKING'
                  ? 'rgba(99, 102, 241, 0.2)'
                  : sessionState === 'LISTENING'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : sessionState === 'INTERRUPTED'
                  ? 'rgba(244, 63, 94, 0.2)'
                  : sessionState === 'PROCESSING'
                  ? 'rgba(245, 158, 11, 0.2)'
                  : 'rgba(255, 255, 255, 0.08)',
              border:
                sessionState === 'SPEAKING'
                  ? '1px solid rgba(99, 102, 241, 0.4)'
                  : sessionState === 'LISTENING'
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : sessionState === 'INTERRUPTED'
                  ? '1px solid rgba(244, 63, 94, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color:
                sessionState === 'SPEAKING'
                  ? '#a5b4fc'
                  : sessionState === 'LISTENING'
                  ? '#6ee7b7'
                  : sessionState === 'INTERRUPTED'
                  ? '#fda4af'
                  : sessionState === 'PROCESSING'
                  ? '#fcd34d'
                  : '#cbd5e1',
            }}
          >
            {sessionState === 'SPEAKING' && <span>AI đang nói... (Nhấn &quot;Cắt lời&quot; bất cứ lúc nào)</span>}
            {sessionState === 'LISTENING' && <span>AI đang lắng nghe... Bạn hãy nói bằng tiếng Trung</span>}
            {sessionState === 'PROCESSING' && <span>AI đang xử lý phản hồi...</span>}
            {sessionState === 'INTERRUPTED' && <span>Đã ngắt lời AI! Chuyển sang micro người dùng</span>}
            {sessionState === 'PAUSED' && <span>Phiên thoại đang tạm dừng</span>}
            {sessionState === 'IDLE' && <span>Sẵn sàng trò chuyện</span>}
          </div>

          {/* Subtitle Display of Latest AI Speech */}
          {latestAiTurn && (
            <div
              style={{
                maxWidth: '680px',
                textAlign: 'center',
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                padding: 'var(--space-3) var(--space-5)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginTop: 'var(--space-1)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-hanzi)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1.3,
                }}
              >
                {latestAiTurn.hanzi}
              </div>
              {showPinyin && (
                <div style={{ fontSize: 'var(--text-sm)', color: '#38bdf8', marginTop: '4px', fontWeight: 500 }}>
                  {latestAiTurn.pinyin}
                </div>
              )}
              {showVietnamese && (
                <div style={{ fontSize: 'var(--text-xs)', color: '#94a3b8', marginTop: '4px', fontStyle: 'italic' }}>
                  {latestAiTurn.vietnamese}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          3. GUIDED CONVERSATION & SUGGESTED RESPONSES
          ===================================================================== */}
      <div
        style={{
          padding: 'var(--space-2) var(--space-6)',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} style={{ color: '#38bdf8' }} /> GỢI Ý CÂU TRẢ LỜI CHO BẠN (CHẠM ĐỂ NÓI MẪU):
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleHelpMeAnswer}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <HelpCircle size={12} /> Giúp tôi trả lời
            </button>
            <button
              type="button"
              onClick={handleRepeatLast}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <RotateCcw size={12} /> Nhắc lại câu vừa rồi
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: '4px' }}>
          {scenario.suggestedResponses.map((sug) => (
            <button
              key={sug.id}
              type="button"
              onClick={() => handleSendGuidedResponse(sug)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                {sug.hanzi}
              </div>
              <div style={{ fontSize: '10px', color: '#38bdf8' }}>{sug.pinyin}</div>
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================================
          4. COLLAPSIBLE TRANSCRIPT ACCORDION
          ===================================================================== */}
      <div
        style={{
          backgroundColor: '#0f172a',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          type="button"
          onClick={() => setIsTranscriptExpanded((prev) => !prev)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px var(--space-6)',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          <span>Lịch sử đối thoại trực tiếp ({turns.length} câu)</span>
          {isTranscriptExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {isTranscriptExpanded && (
          <div
            ref={transcriptScrollRef}
            style={{
              maxHeight: '130px',
              overflowY: 'auto',
              padding: '4px var(--space-6) var(--space-3) var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {turns.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--text-xs)',
                  color: t.speaker === 'user' ? '#38bdf8' : '#e2e8f0',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: t.speaker === 'user' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    fontWeight: 700,
                  }}
                >
                  {t.speaker === 'user' ? 'Bạn' : 'AI'}
                </span>
                <span style={{ fontFamily: 'var(--font-hanzi)', fontWeight: 600 }}>{t.hanzi}</span>
                {showPinyin && <span style={{ color: '#94a3b8' }}>({t.pinyin})</span>}
                {showVietnamese && <span style={{ color: '#64748b' }}>• {t.vietnamese}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================================
          5. BOTTOM CONTROLS: Microphone, Barge-In Interruption, Toggles
          ===================================================================== */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          padding: 'var(--space-4) var(--space-6)',
          backgroundColor: '#0b1120',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* View Options (Toggles) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowPinyin((p) => !p)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              border: showPinyin ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: showPinyin ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: showPinyin ? '#38bdf8' : '#94a3b8',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            <Languages size={13} />
            <span>Pinyin</span>
          </button>

          <button
            type="button"
            onClick={() => setShowVietnamese((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              border: showVietnamese ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: showVietnamese ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: showVietnamese ? '#38bdf8' : '#94a3b8',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            <Globe size={13} />
            <span>Dịch nghĩa</span>
          </button>
        </div>

        {/* Primary Voice Action Center */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {/* Pause / Resume */}
          <button
            type="button"
            onClick={handleTogglePause}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title={sessionState === 'PAUSED' ? 'Tiếp tục phiên' : 'Tạm dừng phiên'}
          >
            {sessionState === 'PAUSED' ? <Play size={18} fill="currentColor" /> : <Pause size={18} />}
          </button>

          {/* Central Main Mic Button */}
          <button
            type="button"
            onClick={handleToggleMic}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: sessionState === 'LISTENING' ? '#10b981' : 'var(--primary)',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow:
                sessionState === 'LISTENING'
                  ? '0 0 25px rgba(16, 185, 129, 0.6)'
                  : '0 0 25px rgba(99, 102, 241, 0.5)',
              transition: 'all 0.2s ease',
            }}
            title={sessionState === 'LISTENING' ? 'Đang bật Mic' : 'Nhấn để nói'}
          >
            <Mic size={26} />
          </button>

          {/* BARGE-IN INTERRUPTION BUTTON */}
          <button
            type="button"
            onClick={handleInterrupt}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: sessionState === 'SPEAKING' ? 'var(--seal)' : 'rgba(255, 255, 255, 0.08)',
              border: sessionState === 'SPEAKING' ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: sessionState === 'SPEAKING' ? '0 0 15px rgba(190, 18, 60, 0.4)' : 'none',
              transition: 'all 0.15s ease',
            }}
            title="Cắt lời AI ngay lập tức và mở micro để bạn nói"
          >
            <Zap size={14} fill="currentColor" />
            <span>Cắt lời AI (Barge-in)</span>
            {interruptionCount > 0 && (
              <span
                style={{
                  fontSize: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {interruptionCount}
              </span>
            )}
          </button>
        </div>

        {/* Switch to Chat Mode Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="ghost"
            style={{ color: '#94a3b8', fontSize: 'var(--text-xs)' }}
            onClick={onSwitchToChat}
          >
            Chuyển sang Chat văn bản ➜
          </Button>
        </div>
      </div>

      {/* Post-Session Review Modal */}
      <AITutorSessionReviewModal
        isOpen={isReviewOpen}
        reviewData={reviewData}
        onRestart={() => handleStartNewSession(selectedMode)}
        onSwitchToChat={() => {
          setIsReviewOpen(false);
          if (onSwitchToChat) onSwitchToChat();
        }}
        onClose={() => {
          setIsReviewOpen(false);
          if (onBackToDashboard) onBackToDashboard();
        }}
      />
    </div>
  );
};
