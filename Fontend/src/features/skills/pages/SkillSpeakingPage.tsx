import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mic,
  Square,
  Volume2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  History,
  Send,
  Award,
  ChevronRight,
  BookOpen,
  Info,
  Play,
  Pause,
} from 'lucide-react';
import { useAudioRecorder } from '../../videos/components/useAudioRecorder';
import {
  speakingService,
  type SpeakingPracticeItem,
  type SpeakingAssessmentResult,
  type SpeakingStats,
} from '../../ai/services/speaking.service';
import {
  aiLearningEngineService,
  type ConversationScenario,
  type AiConversationSession,
} from '../../ai/services/ai-learning-engine.service';

type ActiveTab = 'PRACTICE' | 'CONVERSATION' | 'HISTORY';
type PracticeMode = 'WORD' | 'SENTENCE' | 'SCENARIO';

export const SkillSpeakingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('PRACTICE');
  const [hskLevel, setHskLevel] = useState<number>(1);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('WORD');

  // Practice state
  const [items, setItems] = useState<SpeakingPracticeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [assessmentResult, setAssessmentResult] = useState<SpeakingAssessmentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual text fallback state
  const [showDirectInput, setShowDirectInput] = useState<boolean>(false);
  const [directTextInput, setDirectTextInput] = useState<string>('');

  // Audio preview playback state
  const [isPlayingRecorded, setIsPlayingRecorded] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Audio recorder hook
  const {
    isRecording,
    recordingDuration,
    audioUrl,
    error: recorderError,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  // Conversation Room State
  const [scenarios, setScenarios] = useState<ConversationScenario[]>([]);
  const [selectedScenarioCode, setSelectedScenarioCode] = useState<string>('daily-greeting');
  const [convoHsk, setConvoHsk] = useState<number>(1);
  const [activeSession, setActiveSession] = useState<AiConversationSession | null>(null);
  const [isConvoLoading, setIsConvoLoading] = useState<boolean>(false);
  const [convoInput, setConvoInput] = useState<string>('');
  const [convoAudioSubmitting, setConvoAudioSubmitting] = useState<boolean>(false);

  // History & Stats State
  const [historyList, setHistoryList] = useState<SpeakingAssessmentResult[]>([]);
  const [stats, setStats] = useState<SpeakingStats | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Load practice items on level or mode change
  const loadItems = useCallback(async () => {
    setIsLoadingItems(true);
    setErrorMsg(null);
    setAssessmentResult(null);
    clearRecording();
    try {
      const data = await speakingService.getSpeakingItems(hskLevel, practiceMode);
      setItems(data);
      setCurrentIndex(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách bài luyện nói.';
      setErrorMsg(msg);
    } finally {
      setIsLoadingItems(false);
    }
  }, [hskLevel, practiceMode, clearRecording]);

  useEffect(() => {
    if (activeTab === 'PRACTICE') {
      loadItems();
    }
  }, [activeTab, loadItems]);

  // Load conversation scenarios
  useEffect(() => {
    if (activeTab === 'CONVERSATION' && scenarios.length === 0) {
      aiLearningEngineService
        .getScenarios()
        .then((data) => {
          setScenarios(data);
          if (data.length > 0) setSelectedScenarioCode(data[0].code);
        })
        .catch(() => {});
    }
  }, [activeTab, scenarios.length]);

  // Load history and stats
  const loadHistoryAndStats = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const [hist, st] = await Promise.all([
        speakingService.getSpeakingHistory(20),
        speakingService.getSpeakingStats(),
      ]);
      setHistoryList(hist);
      setStats(st);
    } catch {
      // non-blocking
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      loadHistoryAndStats();
    }
  }, [activeTab, loadHistoryAndStats]);

  // TTS sample playback
  const handlePlaySample = (textZh: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textZh);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle recorded audio playback
  const handleToggleRecordedPlayback = () => {
    if (!audioUrl) return;
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlayingRecorded(false);
    }
    if (isPlayingRecorded) {
      audioPlayerRef.current.pause();
      setIsPlayingRecorded(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingRecorded(true);
    }
  };

  // Submit practice recording
  const handleSubmitPractice = async () => {
    const currentItem = items[currentIndex];
    if (!currentItem) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (audioUrl) {
        // Fetch audio blob from blob URL
        const audioBlob = await fetch(audioUrl).then((r) => r.blob());
        const formData = new FormData();
        formData.append('audio', audioBlob, 'speaking.webm');
        formData.append('practiceType', currentItem.practiceType);
        formData.append('hskLevel', String(currentItem.hskLevel));
        formData.append('targetTextZh', currentItem.targetTextZh);
        if (currentItem.targetPinyin) formData.append('targetPinyin', currentItem.targetPinyin);
        if (currentItem.meaningVi) formData.append('targetMeaningVi', currentItem.meaningVi);
        formData.append('audioDurationSeconds', String(recordingDuration));

        const result = await speakingService.submitSpeakingPracticeFormData(formData);
        setAssessmentResult(result);
      } else if (directTextInput.trim()) {
        const result = await speakingService.submitSpeakingPracticeJson({
          practiceType: currentItem.practiceType,
          hskLevel: currentItem.hskLevel,
          targetTextZh: currentItem.targetTextZh,
          targetPinyin: currentItem.targetPinyin,
          targetMeaningVi: currentItem.meaningVi,
          directText: directTextInput.trim(),
          audioDurationSeconds: 0,
        });
        setAssessmentResult(result);
      } else {
        setErrorMsg('Vui lòng ghi âm giọng nói của bạn hoặc nhập văn bản trước khi nộp bài.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi gửi bài luyện phát âm.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextItem = () => {
    clearRecording();
    setAssessmentResult(null);
    setDirectTextInput('');
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setIsPlayingRecorded(false);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  // Conversation Room Handlers
  const handleStartConversation = async () => {
    setIsConvoLoading(true);
    setErrorMsg(null);
    try {
      const session = await aiLearningEngineService.startConversation({
        hskLevel: convoHsk,
        scenarioCode: selectedScenarioCode,
        showPinyin: true,
        showVietnamese: false,
      });
      setActiveSession(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể khởi tạo phòng hội thoại.';
      setErrorMsg(msg);
    } finally {
      setIsConvoLoading(false);
    }
  };

  const handleSendConvoMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !convoInput.trim() || isConvoLoading) return;

    const text = convoInput.trim();
    setConvoInput('');
    setIsConvoLoading(true);
    try {
      const updated = await aiLearningEngineService.sendConversationMessage(activeSession.id, {
        message: text,
      });
      setActiveSession(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi tin nhắn.';
      setErrorMsg(msg);
    } finally {
      setIsConvoLoading(false);
    }
  };

  const handleSendConvoAudio = async () => {
    if (!activeSession || !audioUrl || convoAudioSubmitting) return;

    setConvoAudioSubmitting(true);
    setErrorMsg(null);
    try {
      const blob = await fetch(audioUrl).then((r) => r.blob());
      const updated = await speakingService.sendConversationAudioMessage(activeSession.id, blob);
      setActiveSession(updated);
      clearRecording();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi gửi tin nhắn âm thanh.';
      setErrorMsg(msg);
    } finally {
      setConvoAudioSubmitting(false);
    }
  };

  const handleEndConversation = async () => {
    if (!activeSession) return;
    setIsConvoLoading(true);
    try {
      const ended = await aiLearningEngineService.endConversation(activeSession.id);
      setActiveSession(ended);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết thúc phiên hội thoại.';
      setErrorMsg(msg);
    } finally {
      setIsConvoLoading(false);
    }
  };

  const currentItem = items[currentIndex];

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
          borderRadius: '24px',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
          <Mic size={14} />
          <span>PHÒNG LUYỆN NÓI & PHÁT ÂM AI (AI SPEAKING LAB)</span>
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: 800 }}>
          Luyện phát âm chuẩn & Phản xạ giao tiếp HSK
        </h1>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.95, maxWidth: '680px', lineHeight: 1.5 }}>
          Phân tích độ chính xác phát âm bằng AI, nhận diện âm tiết thiếu/lệch, và thực hành hội thoại theo tình huống thực tế.
        </p>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('PRACTICE')}
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: activeTab === 'PRACTICE' ? '#ffffff' : 'rgba(255,255,255,0.18)',
              color: activeTab === 'PRACTICE' ? '#047857' : '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Mic size={15} />
            <span>Luyện phát âm</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CONVERSATION')}
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: activeTab === 'CONVERSATION' ? '#ffffff' : 'rgba(255,255,255,0.18)',
              color: activeTab === 'CONVERSATION' ? '#047857' : '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <MessageSquare size={15} />
            <span>Phòng hội thoại AI</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: activeTab === 'HISTORY' ? '#ffffff' : 'rgba(255,255,255,0.18)',
              color: activeTab === 'HISTORY' ? '#047857' : '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <History size={15} />
            <span>Lịch sử & Đánh giá</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMsg && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#b91c1c',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PRACTICE MODE                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'PRACTICE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Controls Bar: HSK Level & Practice Type */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Mode selection: WORD, SENTENCE, SCENARIO */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setPracticeMode('WORD')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: practiceMode === 'WORD' ? '1.5px solid #10b981' : '1px solid #cbd5e1',
                  backgroundColor: practiceMode === 'WORD' ? '#ecfdf5' : '#ffffff',
                  color: practiceMode === 'WORD' ? '#047857' : '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                A. Phát âm từ vựng
              </button>
              <button
                type="button"
                onClick={() => setPracticeMode('SENTENCE')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: practiceMode === 'SENTENCE' ? '1.5px solid #10b981' : '1px solid #cbd5e1',
                  backgroundColor: practiceMode === 'SENTENCE' ? '#ecfdf5' : '#ffffff',
                  color: practiceMode === 'SENTENCE' ? '#047857' : '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                B. Phát âm theo câu
              </button>
              <button
                type="button"
                onClick={() => setPracticeMode('SCENARIO')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: practiceMode === 'SCENARIO' ? '1.5px solid #10b981' : '1px solid #cbd5e1',
                  backgroundColor: practiceMode === 'SCENARIO' ? '#ecfdf5' : '#ffffff',
                  color: practiceMode === 'SCENARIO' ? '#047857' : '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                C. Luyện nói theo tình huống
              </button>
            </div>

            {/* HSK Level Pill Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Cấp độ:</span>
              {[1, 2, 3, 4].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setHskLevel(lvl)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: hskLevel === lvl ? '2px solid #047857' : '1px solid #cbd5e1',
                    backgroundColor: hskLevel === lvl ? '#047857' : '#f8fafc',
                    color: hskLevel === lvl ? '#ffffff' : '#334155',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Main Practice Card */}
          {isLoadingItems ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '60px', textAlign: 'center', border: '1.5px solid #e2e8f0' }}>
              <Sparkles size={32} color="#10b981" style={{ margin: '0 auto 12px', animation: 'spin 1.5s linear infinite' }} />
              <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Đang tải nội dung luyện phát âm...</p>
            </div>
          ) : currentItem ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                border: '1.5px solid #e2e8f0',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              }}
            >
              {/* Item Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#047857', fontSize: '12px', fontWeight: 800 }}>
                    HSK {currentItem.hskLevel}
                  </span>
                  {currentItem.contextScenario && (
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                      • {currentItem.contextScenario}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>
                  Mục {currentIndex + 1} / {items.length}
                </div>
              </div>

              {/* Target Text Box */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '20px',
                  padding: '28px',
                  textAlign: 'center',
                  border: '1.5px solid #e2e8f0',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: practiceMode === 'WORD' ? '44px' : '28px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', letterSpacing: '0.02em' }}>
                  {currentItem.targetTextZh}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#047857', marginBottom: '8px' }}>
                  {currentItem.targetPinyin}
                </div>
                <div style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                  {currentItem.meaningVi}
                </div>

                {currentItem.culturalNoteVi && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Info size={14} />
                    <span>{currentItem.culturalNoteVi}</span>
                  </div>
                )}

                {/* Speak Sample Button */}
                <button
                  type="button"
                  onClick={() => handlePlaySample(currentItem.targetTextZh)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#047857',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title="Nghe phát âm chuẩn TTS"
                >
                  <Volume2 size={16} />
                  <span>Nghe mẫu</span>
                </button>
              </div>

              {/* Recording & Action Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                {recorderError === 'permission_denied' && (
                  <div style={{ color: '#b91c1c', fontSize: '13px', backgroundColor: '#fef2f2', padding: '8px 16px', borderRadius: '8px' }}>
                    ⚠️ Trình duyệt chưa cấp quyền truy cập microphone. Vui lòng cho phép microphone để ghi âm.
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={isSubmitting}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '9999px',
                        border: 'none',
                        backgroundColor: '#E60012',
                        color: '#ffffff',
                        fontSize: '15px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(230, 0, 18, 0.3)',
                      }}
                    >
                      <Mic size={18} />
                      <span>{audioUrl ? 'Ghi âm lại' : 'Bắt đầu ghi âm'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '9999px',
                        border: 'none',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        fontSize: '15px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        animation: 'pulse 1.2s infinite',
                      }}
                    >
                      <Square size={16} fill="#ffffff" />
                      <span>Dừng ghi âm ({recordingDuration}s)</span>
                    </button>
                  )}

                  {/* Playback recorded audio */}
                  {audioUrl && !isRecording && (
                    <button
                      type="button"
                      onClick={handleToggleRecordedPlayback}
                      style={{
                        padding: '12px 20px',
                        borderRadius: '9999px',
                        border: '1.5px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#334155',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {isPlayingRecorded ? <Pause size={16} /> : <Play size={16} />}
                      <span>{isPlayingRecorded ? 'Tạm dừng' : 'Nghe lại'}</span>
                    </button>
                  )}

                  {/* Submit evaluation */}
                  {(audioUrl || (showDirectInput && directTextInput.trim())) && (
                    <button
                      type="button"
                      onClick={handleSubmitPractice}
                      disabled={isSubmitting}
                      style={{
                        padding: '12px 26px',
                        borderRadius: '9999px',
                        border: 'none',
                        backgroundColor: '#047857',
                        color: '#ffffff',
                        fontSize: '15px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {isSubmitting ? (
                        <span>Đang chấm phát âm...</span>
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          <span>Gửi đánh giá</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Direct Text Input Fallback Toggle */}
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowDirectInput((prev) => !prev)}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {showDirectInput ? 'Ẩn chế độ nhập văn bản' : 'Thử nghiệm nhập văn bản nếu chưa có micro'}
                  </button>
                </div>

                {showDirectInput && (
                  <div style={{ width: '100%', maxWidth: '480px', display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={directTextInput}
                      onChange={(e) => setDirectTextInput(e.target.value)}
                      placeholder="Nhập chữ Hán bạn phát âm để kiểm tra..."
                      style={{
                        flex: 1,
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Assessment Result Section */}
              {assessmentResult && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    border: '1.5px solid #d1fae5',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={22} color="#047857" />
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                        Kết quả đánh giá phát âm
                      </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {assessmentResult.isDirectTextInput && (
                        <div
                          style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: '1px solid #cbd5e1',
                          }}
                        >
                          Thử nghiệm DirectText (Không tính vào năng lực)
                        </div>
                      )}
                      <div
                        style={{
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          backgroundColor: assessmentResult.transcriptAccuracyPercent >= 80 ? '#dcfce7' : '#fef3c7',
                          color: assessmentResult.transcriptAccuracyPercent >= 80 ? '#15803d' : '#b45309',
                          fontSize: '13px',
                          fontWeight: 800,
                        }}
                      >
                        Độ khớp: {assessmentResult.transcriptAccuracyPercent}%
                      </div>
                    </div>
                  </div>

                  {/* Transcript Alignment Details */}
                  <div style={{ backgroundColor: '#f8fafc', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '13px', color: '#475569' }}>
                      <strong>Văn bản chuẩn:</strong> {assessmentResult.targetTextZh}
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569' }}>
                      <strong>AI nhận diện được:</strong>{' '}
                      <span style={{ color: assessmentResult.recognizedTranscriptZh ? '#0f172a' : '#94a3b8' }}>
                        {assessmentResult.recognizedTranscriptZh || '(Không nhận diện được âm thanh)'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      <strong>Độ tin cậy STT:</strong>{' '}
                      {assessmentResult.sttConfidence != null
                        ? `${Math.round(assessmentResult.sttConfidence * 100)}%`
                        : 'Nhà cung cấp không hỗ trợ (N/A)'}
                    </div>

                    {/* Word-by-word Breakdown */}
                    {assessmentResult.wordBreakdown.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
                          Chi tiết từng âm tiết:
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {assessmentResult.wordBreakdown.map((w, idx) => (
                            <span
                              key={idx}
                              title={w.tipVi || ''}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 700,
                                backgroundColor: w.status === 'MATCHED' ? '#dcfce7' : '#fee2e2',
                                color: w.status === 'MATCHED' ? '#15803d' : '#b91c1c',
                                border: `1px solid ${w.status === 'MATCHED' ? '#86efac' : '#fca5a5'}`,
                              }}
                            >
                              {w.characterOrWord}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feedback Vi */}
                  <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
                    <strong>Nhận xét:</strong> {assessmentResult.evaluationFeedbackVi}
                  </div>

                  {/* Explicit Metric Disclaimer Box */}
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#64748b',
                      backgroundColor: '#f1f5f9',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      lineHeight: 1.4,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                    }}
                  >
                    <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>
                      <strong>Giới hạn kỹ thuật:</strong> {assessmentResult.toneAssessmentNote}
                    </span>
                  </div>

                  {/* Next Question Action */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={handleNextItem}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: '#047857',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>Luyện từ tiếp theo</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '48px', textAlign: 'center', border: '1.5px solid #e2e8f0' }}>
              <BookOpen size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#64748b', fontSize: '14px' }}>Chưa có bài luyện nào cho cấp độ này.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI CONVERSATION ROOM                                               */}
      {/* ========================================================================= */}
      {activeTab === 'CONVERSATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!activeSession ? (
            /* Scenario Selector & Start View */
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                border: '1.5px solid #e2e8f0',
                padding: '32px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Chọn tình huống hội thoại với AI
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
                AI sẽ đóng vai nhân vật đối thoại (nhân viên phục vụ, bạn học, đồng nghiệp...) và giúp bạn luyện phản xạ giao tiếp tự nhiên.
              </p>

              {/* HSK Level for Conversation */}
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Cấp độ HSK mục tiêu:</span>
                {[1, 2, 3, 4].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setConvoHsk(lvl)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      border: convoHsk === lvl ? '2px solid #047857' : '1px solid #cbd5e1',
                      backgroundColor: convoHsk === lvl ? '#047857' : '#ffffff',
                      color: convoHsk === lvl ? '#ffffff' : '#334155',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    HSK {lvl}
                  </button>
                ))}
              </div>

              {/* Scenario Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                {scenarios.map((sc) => (
                  <div
                    key={sc.code}
                    onClick={() => setSelectedScenarioCode(sc.code)}
                    style={{
                      padding: '18px',
                      borderRadius: '16px',
                      border: selectedScenarioCode === sc.code ? '2px solid #10b981' : '1.5px solid #e2e8f0',
                      backgroundColor: selectedScenarioCode === sc.code ? '#ecfdf5' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                      {sc.titleZh}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#047857', marginBottom: '6px' }}>
                      {sc.titleVi}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                      {sc.descriptionVi}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleStartConversation}
                  disabled={isConvoLoading}
                  style={{
                    padding: '14px 32px',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: '#047857',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(4, 120, 87, 0.3)',
                  }}
                >
                  <MessageSquare size={18} />
                  <span>{isConvoLoading ? 'Đang khởi tạo...' : 'Bắt đầu hội thoại'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Active Conversation Room View */
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                border: '1.5px solid #e2e8f0',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              }}
            >
              {/* Session Top Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    {activeSession.scenarioTitle}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    HSK {activeSession.hskLevel} • Trạng thái: {activeSession.status === 'ACTIVE' ? 'Đang diễn ra' : 'Đã kết thúc'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeSession.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={handleEndConversation}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#b91c1c',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Kết thúc phiên
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveSession(null)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      color: '#475569',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Đổi tình huống
                  </button>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '480px', overflowY: 'auto', padding: '8px 4px' }}>
                {activeSession.messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      backgroundColor: msg.role === 'user' ? '#047857' : '#f8fafc',
                      color: msg.role === 'user' ? '#ffffff' : '#0f172a',
                      borderRadius: '16px',
                      padding: '14px 18px',
                      border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                      {msg.contentZh}
                    </div>
                    {msg.pinyin && (
                      <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>
                        {msg.pinyin}
                      </div>
                    )}
                    {msg.contentVi && (
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>
                        {msg.contentVi}
                      </div>
                    )}

                    {/* Correction suggestion if AI noticed errors */}
                    {msg.correction && msg.correction.hasError && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.3)', fontSize: '12px' }}>
                        <div>💡 <strong>Gợi ý tự nhiên hơn:</strong> {msg.correction.naturalSuggestionZh}</div>
                        <div style={{ opacity: 0.85 }}>{msg.correction.explanationVi}</div>
                      </div>
                    )}
                  </div>
                ))}

                {activeSession.summaryVi && (
                  <div style={{ backgroundColor: '#ecfdf5', borderRadius: '12px', padding: '14px 18px', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '13px' }}>
                    <strong>Tổng kết buổi hội thoại:</strong> {activeSession.summaryVi}
                  </div>
                )}
              </div>

              {/* Active Conversation Input Controls */}
              {activeSession.status === 'ACTIVE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                  <form onSubmit={handleSendConvoMessage} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={convoInput}
                      onChange={(e) => setConvoInput(e.target.value)}
                      placeholder="Gõ tin nhắn tiếng Trung hoặc ghi âm bên dưới..."
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isConvoLoading || !convoInput.trim()}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: '#047857',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Send size={15} />
                      <span>Gửi</span>
                    </button>
                  </form>

                  {/* Audio Microphone Input for Conversation */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#b91c1c',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Mic size={14} />
                        <span>Ghi âm giọng nói</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#b91c1c',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Square size={14} fill="#ffffff" />
                        <span>Dừng ({recordingDuration}s)</span>
                      </button>
                    )}

                    {audioUrl && !isRecording && (
                      <button
                        type="button"
                        onClick={handleSendConvoAudio}
                        disabled={convoAudioSubmitting}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#047857',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {convoAudioSubmitting ? 'Đang gửi âm thanh...' : 'Gửi audio lên AI'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HISTORY & STATS                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'HISTORY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Stats Cards */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1.5px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#047857' }}>{stats.totalSpeakingAttempts}</div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Tổng lượt luyện phát âm</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1.5px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#2563eb' }}>{stats.averageAccuracyPercent}%</div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Độ chính xác trung bình</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1.5px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#d97706' }}>{stats.completedWords}</div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Từ vựng đã luyện</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1.5px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#7c3aed' }}>{stats.completedSentences + stats.completedScenarios}</div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Câu & Tình huống</div>
              </div>
            </div>
          )}

          {/* Attempts History List */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '1.5px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              Lịch sử các lượt luyện phát âm gần đây
            </h3>

            {isLoadingHistory ? (
              <p style={{ color: '#64748b', fontSize: '14px' }}>Đang tải lịch sử...</p>
            ) : historyList.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px' }}>Bạn chưa có lượt luyện phát âm nào.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {historyList.map((h) => (
                  <div
                    key={h.attemptId}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                        {h.targetTextZh}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        HSK {h.hskLevel} • Nhận diện: &quot;{h.recognizedTranscriptZh || 'N/A'}&quot; • {new Date(h.attemptedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 800,
                          backgroundColor: h.transcriptAccuracyPercent >= 80 ? '#dcfce7' : '#fef3c7',
                          color: h.transcriptAccuracyPercent >= 80 ? '#15803d' : '#b45309',
                        }}
                      >
                        {h.transcriptAccuracyPercent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
