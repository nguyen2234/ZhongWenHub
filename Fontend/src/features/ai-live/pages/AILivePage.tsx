import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  Play,
  Square,
  Send,
  Languages,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  History,
} from 'lucide-react';
import {
  aiLearningEngineService,
  type AiConversationSession,
  type ConversationScenario,
} from '../../ai/services/ai-learning-engine.service';

export const AILivePage: React.FC = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<ConversationScenario[]>([]);
  const [sessions, setSessions] = useState<AiConversationSession[]>([]);
  const [activeSession, setActiveSession] = useState<AiConversationSession | null>(null);
  const [selectedHsk, setSelectedHsk] = useState<number>(1);
  const [selectedScenario, setSelectedScenario] = useState<string>('daily-greeting');
  const [showPinyin, setShowPinyin] = useState<boolean>(true);
  const [showVietnamese, setShowVietnamese] = useState<boolean>(false);
  const [messageInput, setMessageInput] = useState<string>('');
  const [loadingInit, setLoadingInit] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoadingInit(true);
        setErrorMsg(null);
        const [scenList, sessList] = await Promise.all([
          aiLearningEngineService.getScenarios(),
          aiLearningEngineService.listConversations(),
        ]);
        if (!active) return;
        setScenarios(scenList);
        setSessions(sessList);
        if (scenList.length > 0) {
          setSelectedScenario(scenList[0].code);
        }
        const openSession = sessList.find((s) => s.status === 'ACTIVE');
        if (openSession) {
          const detail = await aiLearningEngineService.getConversation(openSession.id);
          if (!active) return;
          setActiveSession(detail);
          setShowPinyin(detail.showPinyin);
          setShowVietnamese(detail.showVietnamese);
        }
      } catch (err) {
        if (!active) return;
        setErrorMsg(err instanceof Error ? err.message : 'Không thể tải dữ liệu phòng hội thoại AI.');
      } finally {
        if (active) setLoadingInit(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleStartSession = async () => {
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const created = await aiLearningEngineService.startConversation({
        hskLevel: selectedHsk,
        scenarioCode: selectedScenario,
        showPinyin,
        showVietnamese,
      });
      setActiveSession(created);
      setSessions((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể bắt đầu phiên hội thoại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResumeSession = async (sessionId: string) => {
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const detail = await aiLearningEngineService.getConversation(sessionId);
      setActiveSession(detail);
      setShowPinyin(detail.showPinyin);
      setShowVietnamese(detail.showVietnamese);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể tải phiên hội thoại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDisplay = async (nextPinyin: boolean, nextVi: boolean) => {
    setShowPinyin(nextPinyin);
    setShowVietnamese(nextVi);
    if (!activeSession) return;
    try {
      const updated = await aiLearningEngineService.updateConversationPreferences(activeSession.id, {
        showPinyin: nextPinyin,
        showVietnamese: nextVi,
      });
      setActiveSession(updated);
    } catch {
      // Keep local toggle responsive even if preference sync fails momentarily
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    if (!activeSession || activeSession.status !== 'ACTIVE') return;
    const text = (textOverride ?? messageInput).trim();
    if (!text) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const updated = await aiLearningEngineService.sendConversationMessage(activeSession.id, {
        message: text,
        requestVietnamese: showVietnamese,
      });
      setActiveSession(updated);
      if (!textOverride) setMessageInput('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể gửi tin nhắn tới AI.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const result = await aiLearningEngineService.endConversation(activeSession.id);
      setActiveSession(result);
      setSessions((prev) => prev.map((s) => (s.id === result.id ? result : s)));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể kết thúc phiên hội thoại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 16px 48px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '16px 20px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            aria-label="Quay lại Dashboard"
            style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--background)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--foreground)' }}>
                Phòng Luyện Giao Tiếp AI (HSK 1–4)
              </h1>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#047857' }}>
                Hội thoại văn bản V1
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
              Luyện phản xạ tiếng Trung theo tình huống, bật/tắt Pinyin & nghĩa tiếng Việt, phát hiện lỗi ngữ pháp/từ vựng.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => void handleToggleDisplay(!showPinyin, showVietnamese)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: showPinyin ? 'var(--primary)' : 'var(--background)', color: showPinyin ? '#ffffff' : 'var(--foreground)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            Pinyin: {showPinyin ? 'BẬT' : 'TẮT'}
          </button>
          <button
            type="button"
            onClick={() => void handleToggleDisplay(showPinyin, !showVietnamese)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: showVietnamese ? 'var(--primary)' : 'var(--background)', color: showVietnamese ? '#ffffff' : 'var(--foreground)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Languages size={14} />
            Nghĩa Việt: {showVietnamese ? 'BẬT' : 'TẮT'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px', alignItems: 'start' }}>
        {/* Left Setup & History Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '18px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Thiết lập phiên mới</h2>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)' }}>
                Cấp độ HSK
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[1, 2, 3, 4].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedHsk(lvl)}
                    style={{
                      padding: '8px 0',
                      borderRadius: '10px',
                      border: selectedHsk === lvl ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: selectedHsk === lvl ? 'rgba(230, 0, 18, 0.08)' : 'var(--background)',
                      color: selectedHsk === lvl ? 'var(--primary)' : 'var(--foreground)',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    HSK {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="ai-scenario-select" style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--muted)' }}>
                Tình huống hội thoại
              </label>
              <select
                id="ai-scenario-select"
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '13px' }}
              >
                {scenarios.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.titleVi} ({s.titleZh}) — HSK {s.minHskLevel}+
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                disabled={submitting || loadingInit}
                onClick={() => void handleStartSession()}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary)', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: submitting ? 0.7 : 1 }}
              >
                <Play size={14} />
                <span>Bắt đầu phiên</span>
              </button>
              {activeSession?.status === 'ACTIVE' && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleEndSession()}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#b91c1c', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Square size={14} />
                  <span>Kết thúc</span>
                </button>
              )}
            </div>
          </div>

          {/* Session History */}
          <div style={{ padding: '18px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 800 }}>
              <History size={16} />
              <span>Lịch sử phiên luyện tập ({sessions.length})</span>
            </div>
            {sessions.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                Chưa có phiên hội thoại nào. Hãy chọn tình huống và nhấn Bắt đầu phiên.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => void handleResumeSession(s.id)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: activeSession?.id === s.id ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: 'var(--background)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                      <span>{s.scenarioTitle}</span>
                      <span style={{ color: s.status === 'ACTIVE' ? '#047857' : 'var(--muted)' }}>
                        HSK {s.hskLevel} · {s.status === 'ACTIVE' ? 'Đang mở' : 'Đã xong'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                      {s.messageCount} tin nhắn
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Chat Area */}
        <div style={{ gridColumn: 'span 2', minWidth: 0, padding: '18px', borderRadius: '16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '480px' }}>
          {loadingInit ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
              Đang tải phòng hội thoại AI...
            </div>
          ) : !activeSession ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={32} color="var(--muted)" />
              <div style={{ fontSize: '15px', fontWeight: 700 }}>Chưa có phiên hội thoại đang mở</div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', maxWidth: '420px' }}>
                Chọn cấp độ HSK 1–4 và tình huống bên trái, sau đó nhấn "Bắt đầu phiên" để luyện giao tiếp tiếng Trung.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>
                    {activeSession.scenarioTitle} (HSK {activeSession.hskLevel})
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {activeSession.speechCapabilityNote}
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', backgroundColor: activeSession.status === 'ACTIVE' ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)', color: activeSession.status === 'ACTIVE' ? '#047857' : 'var(--muted)' }}>
                  {activeSession.status === 'ACTIVE' ? 'Đang hội thoại' : 'Đã kết thúc'}
                </span>
              </div>

              {/* Messages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                {activeSession.messages.map((m) => (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: '6px' }}>
                    <div
                      style={{
                        maxWidth: '85%',
                        padding: '12px 14px',
                        borderRadius: '14px',
                        backgroundColor: m.role === 'user' ? 'var(--primary)' : 'var(--background)',
                        color: m.role === 'user' ? '#ffffff' : 'var(--foreground)',
                        border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                      }}
                    >
                      <div style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.5 }}>{m.contentZh}</div>
                      {showPinyin && m.pinyin && (
                        <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '4px' }}>{m.pinyin}</div>
                      )}
                      {showVietnamese && m.contentVi && (
                        <div style={{ fontSize: '13px', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border)' }}>
                          {m.contentVi}
                        </div>
                      )}
                    </div>

                    {m.correction && (m.correction.hasError || m.correction.naturalSuggestionZh) && (
                      <div style={{ maxWidth: '85%', padding: '10px 12px', borderRadius: '12px', backgroundColor: m.correction.hasError ? '#fffbeb' : '#f0fdf4', border: m.correction.hasError ? '1px solid #fde68a' : '1px solid #bbf7d0', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {m.correction.hasError && (
                          <div style={{ fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={13} />
                            <span>Gợi ý sửa ({m.correction.errorCategory || 'ngữ pháp'}): {m.correction.explanationVi}</span>
                          </div>
                        )}
                        {m.correction.naturalSuggestionZh && (
                          <div style={{ color: '#065f46', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <Sparkles size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span>
                              Diễn đạt tự nhiên hơn: <strong>{m.correction.naturalSuggestionZh}</strong>
                              {showPinyin && m.correction.naturalSuggestionPinyin ? ` (${m.correction.naturalSuggestionPinyin})` : ''}
                              {showVietnamese && m.correction.naturalSuggestionVi ? ` — ${m.correction.naturalSuggestionVi}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {m.suggestedReplies && m.suggestedReplies.length > 0 && activeSession.status === 'ACTIVE' && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {m.suggestedReplies.map((reply) => (
                          <button
                            key={reply}
                            type="button"
                            disabled={submitting}
                            onClick={() => void handleSendMessage(reply)}
                            style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '9999px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', cursor: 'pointer' }}
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {activeSession.summaryVi && (
                <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#065f46', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} />
                  <span>{activeSession.summaryVi}</span>
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendMessage();
                }}
                style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}
              >
                <input
                  type="text"
                  value={messageInput}
                  disabled={submitting || activeSession.status !== 'ACTIVE'}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={activeSession.status === 'ACTIVE' ? 'Nhập câu tiếng Trung của bạn (ví dụ: 你好！我想喝茶。)...' : 'Phiên đã kết thúc'}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
                />
                <button
                  type="submit"
                  disabled={submitting || activeSession.status !== 'ACTIVE' || !messageInput.trim()}
                  style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary)', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  <span>{submitting ? 'Đang gửi...' : 'Gửi'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
