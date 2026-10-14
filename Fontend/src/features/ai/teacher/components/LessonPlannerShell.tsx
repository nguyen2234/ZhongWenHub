import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
  Loader2,
} from 'lucide-react';
import { teacherAIService } from '../services/teacher-ai.service';
import type { LessonPlanInput, GeneratedLessonPlanPreview } from '../types/teacher-ai.types';

export const LessonPlannerShell: React.FC = () => {
  const [formData, setFormData] = useState<LessonPlanInput>({
    classId: 'cls-001',
    hskLevel: 'HSK 3',
    topic: 'Ngữ pháp câu chữ 把 và cách diễn đạt trong sinh hoạt',
    learningObjectives: 'Học viên hiểu quy tắc đặt câu với chữ 把, phân biệt với câu chủ động thông thường và tự tin đặt được 5 câu chuẩn.',
    durationMinutes: 45,
    teachingStyle: 'COMMUNICATIVE',
    additionalInstructions: 'Tập trung vào các tình huống thực tế: nhờ vả, dặn dò công việc.',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planPreview, setPlanPreview] = useState<GeneratedLessonPlanPreview | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) {
      setError('Vui lòng nhập chủ đề bài giảng.');
      return;
    }
    if (!formData.learningObjectives.trim()) {
      setError('Vui lòng nhập mục tiêu bài giảng.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await teacherAIService.generateLessonPlanDraft(formData);
      setPlanPreview(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tạo giáo án';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!planPreview) return;
    const text = `${planPreview.title} (${planPreview.hskLevel} - ${planPreview.durationMinutes} phút)\n\n` +
      planPreview.stages.map((s) => `[Bước ${s.stageNumber}] ${s.title} (${s.durationMinutes}p)\n- Hoạt động GV: ${s.teacherActivitiesVi}\n- Hoạt động HV: ${s.studentActivitiesVi}\n- Trọng tâm: ${s.targetHanziAndGrammar.join(', ')}`).join('\n\n') +
      `\n\nBài tập về nhà đề xuất: ${planPreview.suggestedHomework}`;

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
      {/* Left Column: Input Form */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(67, 56, 202, 0.1)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
              Thiết lập Thông số Giáo án AI
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Biên soạn khung bài giảng 5 bước tinh gọn theo chuẩn HSK
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Row 1: Class & HSK Level */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                Lớp áp dụng
              </label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: 'var(--text-xs)',
                  outline: 'none',
                }}
              >
                <option value="cls-001">Lớp HSK 3 - K24 (Tối 2-4-6)</option>
                <option value="cls-002">Lớp HSK 2 Cơ bản (Tối 3-5-7)</option>
                <option value="cls-003">Lớp HSK 4 Đọc hiểu chuyên sâu</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                Cấp độ HSK
              </label>
              <select
                value={formData.hskLevel}
                onChange={(e) => setFormData({ ...formData, hskLevel: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: 'var(--text-xs)',
                  outline: 'none',
                }}
              >
                <option value="HSK 1">HSK 1</option>
                <option value="HSK 2">HSK 2</option>
                <option value="HSK 3">HSK 3</option>
                <option value="HSK 4">HSK 4</option>
                <option value="HSK 5">HSK 5</option>
                <option value="HSK 6">HSK 6</option>
                <option value="HSK 7-9">HSK 7–9 (Cao cấp)</option>
              </select>
            </div>
          </div>

          {/* Topic */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
              Chủ đề bài giảng *
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="VD: Cấu trúc câu chữ 把 trong khẩu ngữ"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: 'var(--text-xs)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Objectives */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
              Mục tiêu đầu ra bài học *
            </label>
            <textarea
              rows={3}
              value={formData.learningObjectives}
              onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
              placeholder="Học viên sẽ hiểu được quy tắc gì và thực hành được những mẫu câu nào..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: 'var(--text-xs)',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Row 2: Duration & Teaching Style */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                Thời lượng bài dạy
              </label>
              <select
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: 'var(--text-xs)',
                  outline: 'none',
                }}
              >
                <option value={45}>45 phút (1 tiết tiêu chuẩn)</option>
                <option value={60}>60 phút (Buổi phụ đạo)</option>
                <option value={90}>90 phút (2 tiết liền)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                Phong cách giảng dạy
              </label>
              <select
                value={formData.teachingStyle}
                onChange={(e) => setFormData({ ...formData, teachingStyle: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: 'var(--text-xs)',
                  outline: 'none',
                }}
              >
                <option value="COMMUNICATIVE">Giao tiếp thực hành (Khẩu ngữ)</option>
                <option value="STRUCTURED_EXAM">Cấu trúc đề thi HSK chuẩn</option>
                <option value="INTERACTIVE_GAMIFIED">Tương tác trò chơi ghép thẻ</option>
                <option value="VOCABULARY_INTENSIVE">Tập trung từ vựng chuyên sâu</option>
              </select>
            </div>
          </div>

          {/* Additional instructions */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
              Chỉ dẫn bổ sung cho AI
            </label>
            <input
              type="text"
              value={formData.additionalInstructions || ''}
              onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
              placeholder="VD: Nhấn mạnh vào lỗi người Việt hay mắc khi dùng câu chữ 把..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: 'var(--text-xs)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="ds-btn ds-btn-primary"
            style={{ marginTop: 'var(--space-2)', height: '40px', fontSize: 'var(--text-xs)', fontWeight: 700, gap: '6px' }}
          >
            {loading ? <Loader2 size={15} className="spin-animation" /> : <Sparkles size={15} />}
            <span>{loading ? 'Đang soạn thảo giáo án...' : 'Tạo Khung Giáo Án AI'}</span>
          </button>
        </form>
      </div>

      {/* Right Column: Generated Plan Preview */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          minHeight: '480px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Layers size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
              Xem Trước Bản Thảo Giáo Án
            </h3>
          </div>

          {planPreview && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleCopy}
                className="ds-btn ds-btn-outline"
                style={{ height: '30px', padding: '0 10px', fontSize: '11px', gap: '4px' }}
              >
                {copySuccess ? <CheckCircle2 size={12} color="#059669" /> : <Copy size={12} />}
                <span>{copySuccess ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>
            </div>
          )}
        </div>

        {!planPreview && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-8)',
              textAlign: 'center',
              color: 'var(--muted)',
              gap: 'var(--space-2)',
            }}
          >
            <BookOpen size={32} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Chưa có giáo án nào được tạo</span>
            <span style={{ fontSize: 'var(--text-xs)', maxWidth: '280px' }}>
              Nhập các thông số bài giảng bên trái và nhấn &quot;Tạo Khung Giáo Án AI&quot; để xem cấu trúc phân bổ thời gian.
            </span>
          </div>
        )}

        {planPreview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div
              style={{
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--neutral-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
                  {planPreview.title}
                </h4>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {planPreview.hskLevel} • Tổng thời lượng: {planPreview.durationMinutes} phút
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(67, 56, 202, 0.1)',
                  color: 'var(--primary)',
                }}
              >
                Bản thảo AI
              </span>
            </div>

            {/* Stages Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {planPreview.stages.map((stage) => (
                <div
                  key={stage.stageNumber}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)' }}>
                      Bước {stage.stageNumber}: {stage.title}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={11} />
                      {stage.durationMinutes} phút
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--foreground)', marginTop: '2px' }}>
                    <strong>Hoạt động GV:</strong> {stage.teacherActivitiesVi}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    <strong>Hoạt động HV:</strong> {stage.studentActivitiesVi}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>Trọng tâm:</span>
                    {stage.targetHanziAndGrammar.map((token, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--neutral-bg)',
                          border: '1px solid var(--border)',
                          fontFamily: 'var(--font-hanzi)',
                        }}
                      >
                        {token}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Homework */}
            <div
              style={{
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                fontSize: 'var(--text-xs)',
              }}
            >
              <strong style={{ color: '#059669' }}>Bài tập về nhà gợi ý: </strong>
              <span style={{ color: 'var(--foreground)' }}>{planPreview.suggestedHomework}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
