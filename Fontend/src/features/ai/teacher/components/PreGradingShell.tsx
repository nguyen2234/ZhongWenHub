import React, { useState, useEffect } from 'react';
import {
  PenTool,
  Sparkles,
  CheckCircle2,
  Clock,
  Check,
  Edit2,
} from 'lucide-react';
import { teacherAIService } from '../services/teacher-ai.service';
import type { AIGradingJob, TeacherGradingReview } from '../types/teacher-grading-ai.types';

export const PreGradingShell: React.FC = () => {
  const [jobs, setJobs] = useState<AIGradingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<AIGradingJob | null>(null);

  // Review states
  const [adjustedScore, setAdjustedScore] = useState<number>(0);
  const [teacherComment, setTeacherComment] = useState<string>('');
  const [savedReview, setSavedReview] = useState<TeacherGradingReview | null>(null);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await teacherAIService.getPreGradingJobs();
      setJobs(data);
      if (data.length > 0) {
        setSelectedJob(data[0]);
        if (data[0].suggestions[0]) {
          setAdjustedScore(data[0].suggestions[0].proposedScore);
          setTeacherComment('Bài dịch tốt, câu chữ chuẩn xác.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleAcceptAISuggestion = () => {
    if (!selectedJob || !selectedJob.suggestions[0]) return;
    const sug = selectedJob.suggestions[0];
    const review: TeacherGradingReview = {
      reviewId: `rev-${Date.now()}`,
      attemptId: selectedJob.attemptId,
      assignmentId: selectedJob.assignmentId,
      teacherId: 'tch-001',
      status: 'ACCEPTED_AS_IS',
      adjustedScore: sug.proposedScore,
      teacherFinalComment: 'Đồng ý với đề xuất của AI. Bản dịch chuẩn.',
      reviewedAt: new Date().toISOString(),
      originalSuggestion: sug,
    };
    setSavedReview(review);
  };

  const handleSaveTeacherAdjustment = () => {
    if (!selectedJob || !selectedJob.suggestions[0]) return;
    const sug = selectedJob.suggestions[0];
    const review: TeacherGradingReview = {
      reviewId: `rev-${Date.now()}`,
      attemptId: selectedJob.attemptId,
      assignmentId: selectedJob.assignmentId,
      teacherId: 'tch-001',
      status: 'MODIFIED_BY_TEACHER',
      adjustedScore,
      teacherFinalComment: teacherComment,
      reviewedAt: new Date().toISOString(),
      originalSuggestion: sug,
    };
    setSavedReview(review);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
      {/* Left Column: Submissions Queue */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <PenTool size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
              Hàng Chờ Tiền Chấm Điểm
            </h3>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
            {jobs.length} lượt nộp
          </span>
        </div>

        {loading && (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
            Đang tải hàng chờ bài nộp...
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div
            style={{
              padding: 'var(--space-6)',
              textAlign: 'center',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--muted)',
              fontSize: 'var(--text-xs)',
            }}
          >
            Hiện tại không có bài tự luận nào đang chờ tiền chấm điểm AI.
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {jobs.map((job) => {
              const isSelected = selectedJob?.jobId === job.jobId;
              return (
                <div
                  key={job.jobId}
                  onClick={() => setSelectedJob(job)}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: isSelected ? 'rgba(67, 56, 202, 0.05)' : 'var(--background)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)' }}>
                      {job.studentName}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        color: '#d97706',
                        fontWeight: 600,
                      }}
                    >
                      Cần GV duyệt
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    Bài tập: Ngữ pháp câu chữ 把 và 被
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '10px', color: 'var(--muted)' }}>
                    <Clock size={11} />
                    <span>Nộp lúc: 14:30 14/10/2026</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: AI Suggestion & Teacher Approval Desk */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
          minHeight: '480px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
              Phê Duyệt Đề Xuất Điểm AI (Teacher-in-the-Loop)
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              Giáo viên nắm quyền quyết định tối cao đối với điểm số chính thức
            </p>
          </div>

          <span
            style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(67, 56, 202, 0.1)',
              color: 'var(--primary)',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            Quy trình an toàn
          </span>
        </div>

        {selectedJob && selectedJob.suggestions[0] && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Student Answer Box */}
            <div
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--neutral-bg)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                CÂU HỎI 4: DỊCH CÂU HÁN - VIỆT (promptHanzi: 这本书被他借走了。)
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.5 }}>
                &quot;{String(selectedJob.suggestions[0].studentAnswer)}&quot;
              </div>
            </div>

            {/* AI Suggestion Card */}
            <div
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(67, 56, 202, 0.3)',
                backgroundColor: 'rgba(67, 56, 202, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)' }}>
                    Đề xuất từ AI Pre-Grading Engine (Độ tin cậy 92%)
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--primary)' }}>
                  {selectedJob.suggestions[0].proposedScore} / {selectedJob.suggestions[0].maxPoints} điểm
                </div>
              </div>

              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--foreground)' }}>
                <strong>Nhận xét ngữ pháp:</strong> {selectedJob.suggestions[0].grammarFeedbackVi}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                <strong>Lý giải:</strong> {selectedJob.suggestions[0].reasoningNotes}
              </div>
            </div>

            {/* Teacher Decision Form */}
            <div
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <h4 style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)' }}>
                Quyết định của Giáo viên Bộ môn
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, marginBottom: '2px' }}>
                    Điểm chính thức:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={selectedJob.suggestions[0].maxPoints}
                    value={adjustedScore}
                    onChange={(e) => setAdjustedScore(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 600, marginBottom: '2px' }}>
                    Lời phê của giáo viên:
                  </label>
                  <input
                    type="text"
                    value={teacherComment}
                    onChange={(e) => setTeacherComment(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      fontSize: 'var(--text-xs)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                <button
                  type="button"
                  onClick={handleAcceptAISuggestion}
                  className="ds-btn ds-btn-primary"
                  style={{ height: '36px', fontSize: 'var(--text-xs)', gap: '6px' }}
                >
                  <Check size={14} />
                  <span>Chấp nhận gợi ý AI ({selectedJob.suggestions[0].proposedScore}đ)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveTeacherAdjustment}
                  className="ds-btn ds-btn-outline"
                  style={{ height: '36px', fontSize: 'var(--text-xs)', gap: '6px' }}
                >
                  <Edit2 size={14} />
                  <span>Lưu điểm điều chỉnh ({adjustedScore}đ)</span>
                </button>
              </div>
            </div>

            {/* Review Receipt Banner */}
            {savedReview && (
              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--text-xs)',
                  color: '#059669',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={16} />
                <span>
                  Đã ghi nhận kết quả chấm điểm của giáo viên: <strong>{savedReview.adjustedScore} điểm</strong> (Trạng thái: {savedReview.status})
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
