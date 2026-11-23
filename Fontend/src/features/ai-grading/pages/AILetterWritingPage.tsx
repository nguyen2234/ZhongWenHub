import React, { useState, useEffect } from 'react';
import {
  Mail,
  Sparkles,
  Send,
  Copy,
  Check,
  BookOpen,
  HelpCircle,
  FileText,
  AlertCircle,
  History,
  RotateCcw,
  Languages,
} from 'lucide-react';
import {
  LetterWritingService,
  type GenerateLetterRequest,
  type GeneratedLetterResponse,
  type LetterSummary,
} from '../services/letter-writing.service';

const QUICK_TOPICS = [
  { topic: 'Thư xin nghỉ ốm gửi giáo viên', recipient: 'teacher', hsk: 3, tone: 'polite' },
  { topic: 'Thư mời bạn thân dự tiệc sinh nhật', recipient: 'friend', hsk: 2, tone: 'casual' },
  { topic: 'Thư ứng tuyển thực tập sinh', recipient: 'employer', hsk: 4, tone: 'formal' },
  { topic: 'Thư cảm ơn đối tác sau chuyến công tác', recipient: 'business_partner', hsk: 5, tone: 'formal' },
  { topic: 'Thư hỏi thăm sức khỏe ông bà', recipient: 'elder', hsk: 2, tone: 'polite' },
];

export const AILetterWritingPage: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [recipientType, setRecipientType] = useState('friend');
  const [hskLevel, setHskLevel] = useState(3);
  const [tone, setTone] = useState('polite');
  const [length, setLength] = useState('medium');
  const [keyPoints, setKeyPoints] = useState('');
  const [userDraftText, setUserDraftText] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedLetterResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'letter' | 'pinyin_translation' | 'vocabulary' | 'corrections' | 'pedagogy'>('letter');

  const [historyList, setHistoryList] = useState<LetterSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const items = await LetterWritingService.getHistory(10);
      setHistoryList(items);
    } catch {
      // Ignore background history fetch errors
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMessage('Vui lòng nhập chủ đề bức thư.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setCopied(false);

    try {
      const req: GenerateLetterRequest = {
        topic: topic.trim(),
        recipientType,
        hskLevel,
        tone,
        length,
        keyPoints: keyPoints.trim() || undefined,
        userDraftText: userDraftText.trim() || undefined,
      };

      const res = await LetterWritingService.generateLetter(req);
      setResult(res);
      if (res.userDraftCorrections && res.userDraftCorrections.length > 0) {
        setActiveTab('corrections');
      } else {
        setActiveTab('letter');
      }
      loadHistory();
    } catch (err) {
      setErrorMessage(LetterWritingService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistoryItem = async (sessionId: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const detail = await LetterWritingService.getDetail(sessionId);
      setResult(detail);
      setActiveTab('letter');
    } catch (err) {
      setErrorMessage(LetterWritingService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = result.fullLetterZh;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px 20px 48px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.18)', padding: '5px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
          <Sparkles size={15} />
          <span>AI TRỢ LÝ THƯ TÍN & NÂNG CẤP VĂN PHONG TIẾNG TRUNG</span>
        </div>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '26px', fontWeight: 800 }}>
          Viết Thư & Sửa Thư Tín Bằng AI
        </h1>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.95, maxWidth: '780px', lineHeight: 1.6 }}>
          Hỗ trợ soạn thảo thư tiếng Trung chuẩn văn hóa, đúng xưng hô, đúng cấp bậc HSK 1–6. Phân tích lỗi ngữ pháp bản nháp của bạn và cung cấp từ vựng, mẫu câu trọng điểm cùng lời khuyên văn phong.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 460px) 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left column: Input Form & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={18} color="#2563eb" />
              <span>Thiết lập nội dung thư</span>
            </h2>

            {/* Quick Suggestions */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                Gợi ý chủ đề nhanh:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {QUICK_TOPICS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTopic(item.topic);
                      setRecipientType(item.recipient);
                      setHskLevel(item.hsk);
                      setTone(item.tone);
                    }}
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      color: '#334155',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {item.topic}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Chủ đề thư <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: Thư cảm ơn thầy cô nhân ngày 20/11..."
                  maxLength={200}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Người nhận thư
                  </label>
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="friend">Bạn bè (朋友)</option>
                    <option value="teacher">Thầy cô giáo (老师)</option>
                    <option value="employer">Nhà tuyển dụng (招聘方)</option>
                    <option value="business_partner">Đối tác kinh doanh (商业伙伴)</option>
                    <option value="elder">Trưởng bối / Người lớn tuổi (长辈)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Trình độ HSK
                  </label>
                  <select
                    value={hskLevel}
                    onChange={(e) => setHskLevel(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value={1}>HSK 1 (Cơ bản nhất)</option>
                    <option value={2}>HSK 2 (Giao tiếp đơn giản)</option>
                    <option value={3}>HSK 3 (Vừa phải - Đề xuất)</option>
                    <option value={4}>HSK 4 (Trung cấp mượt mà)</option>
                    <option value={5}>HSK 5 (Cao cấp, phong phú)</option>
                    <option value={6}>HSK 6 (Chuẩn văn chương)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Giọng điệu
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="polite">Lịch sự, tôn trọng (礼貌)</option>
                    <option value="casual">Thân mật, gần gũi (亲切)</option>
                    <option value="formal">Trang trọng, chuẩn mực (正式)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Độ dài thư
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="short">Ngắn gọn (1-2 đoạn)</option>
                    <option value="medium">Vừa phải (3 đoạn)</option>
                    <option value="detailed">Chi tiết, đầy đủ</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Ý chính cần đề cập (Tùy chọn)
                </label>
                <textarea
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  placeholder="Ví dụ: Cảm ơn vì đã giúp đỡ đồ án, chúc năm mới dồi dào sức khỏe, hẹn gặp lại vào tháng sau..."
                  rows={2}
                  maxLength={500}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Bản nháp của bạn để AI sửa lỗi (Tùy chọn)
                </label>
                <textarea
                  value={userDraftText}
                  onChange={(e) => setUserDraftText(e.target.value)}
                  placeholder="Dán câu tiếng Trung bạn tự viết vào đây để AI phân tích và sửa lỗi ngữ pháp..."
                  rows={3}
                  maxLength={1000}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              {errorMessage && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', color: '#b91c1c', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: loading ? '#94a3b8' : '#2563eb',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.15s',
                }}
              >
                {loading ? (
                  <>
                    <RotateCcw size={16} className="animate-spin" />
                    <span>AI đang biên soạn thư...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Tạo Thư Bằng AI</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* History widget */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={16} color="#64748b" />
                <span>Thư đã tạo gần đây</span>
              </h3>
              <button
                type="button"
                onClick={loadHistory}
                disabled={loadingHistory}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '12px' }}
              >
                Làm mới
              </button>
            </div>

            {historyList.length === 0 ? (
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                Chưa có thư nào được tạo.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {historyList.map((item) => (
                  <button
                    key={item.sessionId}
                    type="button"
                    onClick={() => handleSelectHistoryItem(item.sessionId)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: result?.sessionId === item.sessionId ? '#eff6ff' : '#f8fafc',
                      border: result?.sessionId === item.sessionId ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>{item.titleZh}</span>
                      <span style={{ fontSize: '10px', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '1px 6px', borderRadius: '4px' }}>
                        HSK {item.hskLevel}
                      </span>
                    </div>
                    {item.snippetZh && (
                      <span style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                        {item.snippetZh}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Generated Letter Preview & Detailed Tabs */}
        <div>
          {result ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {/* Header info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                      {result.titleZh || 'Bức Thư Tiếng Trung'}
                    </h2>
                    <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px' }}>
                      HSK {result.estimatedHskLevel}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Mô hình: {result.modelUsed || 'AI'} • Token: {result.totalTokensUsed}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCopy}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: copied ? '#f0fdf4' : '#ffffff',
                      color: copied ? '#16a34a' : '#334155',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép thư'}</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '8px', marginBottom: '20px', overflowX: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('letter')}
                  style={{
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: 'none',
                    borderBottom: activeTab === 'letter' ? '2px solid #2563eb' : '2px solid transparent',
                    color: activeTab === 'letter' ? '#2563eb' : '#64748b',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FileText size={15} />
                  <span>Toàn văn thư</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('pinyin_translation')}
                  style={{
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: 'none',
                    borderBottom: activeTab === 'pinyin_translation' ? '2px solid #2563eb' : '2px solid transparent',
                    color: activeTab === 'pinyin_translation' ? '#2563eb' : '#64748b',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Languages size={15} />
                  <span>Pinyin & Tiếng Việt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('vocabulary')}
                  style={{
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: 'none',
                    borderBottom: activeTab === 'vocabulary' ? '2px solid #2563eb' : '2px solid transparent',
                    color: activeTab === 'vocabulary' ? '#2563eb' : '#64748b',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <BookOpen size={15} />
                  <span>Từ vựng & Mẫu câu ({result.keyVocabulary.length + result.keyPatterns.length})</span>
                </button>

                {result.userDraftCorrections && result.userDraftCorrections.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('corrections')}
                    style={{
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: 'none',
                      borderBottom: activeTab === 'corrections' ? '2px solid #2563eb' : '2px solid transparent',
                      color: activeTab === 'corrections' ? '#2563eb' : '#64748b',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <HelpCircle size={15} />
                    <span>Sửa bản nháp ({result.userDraftCorrections.length})</span>
                  </button>
                )}

                {result.pedagogicalAdviceVi && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('pedagogy')}
                    style={{
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: 'none',
                      borderBottom: activeTab === 'pedagogy' ? '2px solid #2563eb' : '2px solid transparent',
                      color: activeTab === 'pedagogy' ? '#2563eb' : '#64748b',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Sparkles size={15} />
                    <span>Lời khuyên văn phong</span>
                  </button>
                )}
              </div>

              {/* Tab Contents */}
              {activeTab === 'letter' && (
                <div style={{ backgroundColor: '#fffdf5', border: '1px solid #fef3c7', borderRadius: '12px', padding: '24px 28px', fontFamily: '"Noto Serif SC", "Songti SC", serif' }}>
                  {result.salutationZh && (
                    <p style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                      {result.salutationZh}
                    </p>
                  )}
                  <div style={{ fontSize: '16px', lineHeight: 2, color: '#334155', whiteSpace: 'pre-line', textIndent: '2em' }}>
                    {result.bodyZh || result.fullLetterZh}
                  </div>
                  {result.closingZh && (
                    <p style={{ margin: '20px 0 0 0', fontSize: '16px', fontWeight: 600, color: '#1e293b', textAlign: 'left', textIndent: '2em' }}>
                      {result.closingZh}
                    </p>
                  )}
                  {result.signOffZh && (
                    <p style={{ margin: '16px 0 0 0', fontSize: '15px', color: '#475569', textAlign: 'right', whiteSpace: 'pre-line' }}>
                      {result.signOffZh}
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'pinyin_translation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: '#2563eb' }}>
                      Pinyin toàn văn thư
                    </h4>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.8, color: '#475569', whiteSpace: 'pre-line' }}>
                      {result.fullLetterPinyin || 'Chưa có dữ liệu pinyin.'}
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#f0fdf4', borderRadius: '12px', padding: '16px', border: '1px solid #dcfce7' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>
                      Bản dịch tiếng Việt
                    </h4>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.8, color: '#166534', whiteSpace: 'pre-line' }}>
                      {result.fullLetterVi || 'Chưa có bản dịch tiếng Việt.'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'vocabulary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {result.keyVocabulary && result.keyVocabulary.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                        Từ vựng trọng tâm trong thư
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                        {result.keyVocabulary.map((v, i) => (
                          <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', backgroundColor: '#f8fafc' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                              <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{v.wordZh}</span>
                              <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: 500 }}>{v.pinyin}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600, marginBottom: '4px' }}>
                              {v.meaningVi}
                            </div>
                            {v.usageNoteVi && (
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {v.usageNoteVi}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.keyPatterns && result.keyPatterns.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                        Mẫu câu cấu trúc thư tín
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {result.keyPatterns.map((p, i) => (
                          <div key={i} style={{ border: '1px solid #e0e7ff', borderRadius: '10px', padding: '12px', backgroundColor: '#f5f3ff' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#4338ca', marginBottom: '2px' }}>
                              {p.patternZh} {p.pinyin && <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 400 }}>({p.pinyin})</span>}
                            </div>
                            <div style={{ fontSize: '12px', color: '#3730a3', marginBottom: '4px' }}>
                              Ý nghĩa: {p.meaningVi}
                            </div>
                            {p.exampleSentence && (
                              <div style={{ fontSize: '12px', color: '#4b5563', fontStyle: 'italic', backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: '6px' }}>
                                Ví dụ: {p.exampleSentence}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'corrections' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {result.userDraftCorrections && result.userDraftCorrections.length > 0 ? (
                    result.userDraftCorrections.map((c, i) => (
                      <div key={i} style={{ border: '1px solid #fed7aa', borderRadius: '12px', padding: '14px', backgroundColor: '#fff7ed' }}>
                        <div style={{ marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#c2410c', textTransform: 'uppercase' }}>Câu gốc của bạn:</span>
                          <div style={{ fontSize: '14px', color: '#9a3412', textDecoration: 'line-through', marginTop: '2px' }}>
                            {c.originalText}
                          </div>
                        </div>
                        <div style={{ marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>AI Sửa lại:</span>
                          <div style={{ fontSize: '14px', color: '#166534', fontWeight: 700, marginTop: '2px' }}>
                            {c.correctedText}
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', backgroundColor: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ffedd5' }}>
                          💡 <strong>Giải thích:</strong> {c.reasonVi}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Không có lỗi nào cần sửa trong bản nháp.</p>
                  )}
                </div>
              )}

              {activeTab === 'pedagogy' && (
                <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '16px 20px', color: '#0369a1', lineHeight: 1.7, fontSize: '14px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} />
                    <span>Quy ước văn hóa & phong cách thư tín tiếng Trung</span>
                  </h4>
                  <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                    {result.pedagogicalAdviceVi}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '2px dashed #cbd5e1', padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '9999px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#3b82f6' }}>
                <Mail size={28} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>
                Chưa có nội dung thư nào được hiển thị
              </h3>
              <p style={{ margin: '0 auto', fontSize: '13px', color: '#64748b', maxWidth: '440px', lineHeight: 1.6 }}>
                Điền chủ đề thư ở cột bên trái hoặc chọn một trong các gợi ý mẫu để AI tự động biên soạn bức thư hoàn chỉnh cho bạn.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
