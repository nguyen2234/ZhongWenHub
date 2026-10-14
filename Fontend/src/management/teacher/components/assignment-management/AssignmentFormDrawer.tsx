import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Send,
  Save,
  Layers,
  Lock,
  Info,
} from 'lucide-react';
import { hskRepositoryService } from '../../../admin/content/services/hsk-repository.service';
import type { HskLevel } from '../../../admin/content/types';
import type { SharedExerciseItem } from '../../../../features/exercise-engine/types';
import { assignmentService } from '../../services';
import { INITIAL_TEACHING_CLASSES, CURRENT_TEACHER_ID } from '../../data/mockTeacherPortalData';
import type {
  AssignmentDetailDTO,
  CreateAssignmentDTO,
  RetakePolicy,
  UpdateDraftAssignmentDTO,
} from '../../types';
import { AssignmentQuestionPickerModal } from './AssignmentQuestionPickerModal';

interface AssignmentFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId?: string | null;
  readOnly?: boolean;
  onSuccess: (saved: AssignmentDetailDTO, isPublish?: boolean) => void;
}

type SectionKey = 'BASIC' | 'QUESTIONS' | 'CLASSES' | 'SETTINGS' | 'PREVIEW';

interface SelectedQuestionFormItem {
  questionBankId: string | number;
  orderIndex: number;
  points: number;
  title: string;
  exerciseType: string;
  promptHanzi?: string;
  promptPinyin?: string;
  promptVietnamese?: string;
}

interface TargetClassFormItem {
  classId: string;
  className: string;
  classCode: string;
  selected: boolean;
  dueDate: string;
  closeDate: string;
}

export const AssignmentFormDrawer: React.FC<AssignmentFormDrawerProps> = ({
  isOpen,
  onClose,
  assignmentId,
  readOnly = false,
  onSuccess,
}) => {
  // Navigation Section
  const [activeSection, setActiveSection] = useState<SectionKey>('BASIC');

  // Loading & Error states
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Question Picker modal state
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);

  // Form Fields - Section A: Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hskLevelId, setHskLevelId] = useState('');
  const [hskLevels, setHskLevels] = useState<HskLevel[]>([]);

  // Form Fields - Section B: Questions
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestionFormItem[]>([]);

  // Form Fields - Section C: Target Classes
  const [targetClasses, setTargetClasses] = useState<TargetClassFormItem[]>([]);

  // Form Fields - Section D: Settings
  const [passingPoints, setPassingPoints] = useState<number>(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<string>('30');
  const [maxAttempts, setMaxAttempts] = useState<number>(2);
  const [retakePolicy, setRetakePolicy] = useState<RetakePolicy>('HIGHEST_SCORE');
  const [allowLateSubmission, setAllowLateSubmission] = useState<boolean>(true);
  const [latePenaltyPercent, setLatePenaltyPercent] = useState<number>(10);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<boolean>(true);

  // Metadata for edit mode
  const [currentStatus, setCurrentStatus] = useState<string>('DRAFT');
  const [isSnapshotted, setIsSnapshotted] = useState<boolean>(false);

  // Total Points computed
  const totalPoints = useMemo(() => {
    return selectedQuestions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  }, [selectedQuestions]);

  // Initial load
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);
    setValidationErrors({});
    setActiveSection('BASIC');

    // Load HSK Levels
    const levels = hskRepositoryService.getLevels();
    setHskLevels(levels);

    // Get owned classes for CURRENT_TEACHER_ID
    const owned = INITIAL_TEACHING_CLASSES.filter((c) => c.teacherId === CURRENT_TEACHER_ID);

    if (assignmentId) {
      // Edit / View existing assignment
      setLoading(true);
      assignmentService
        .getAssignmentById(assignmentId)
        .then((detail) => {
          if (!detail) {
            setErrorMsg(`Không tìm thấy bài tập #${assignmentId}`);
            return;
          }
          setTitle(detail.title);
          setDescription(detail.description || '');
          setHskLevelId(detail.hskLevelId);
          setCurrentStatus(detail.status);
          setIsSnapshotted(detail.isSnapshotted);

          // Questions
          setSelectedQuestions(
            detail.questions.map((q, idx) => ({
              questionBankId: q.questionBankId,
              orderIndex: idx,
              points: q.points,
              title: q.title,
              exerciseType: q.exerciseType,
              promptHanzi: q.promptHanzi,
              promptPinyin: q.promptPinyin,
              promptVietnamese: q.promptVietnamese,
            }))
          );

          // Targets
          const targetMap = new Map(detail.targets.map((t) => [t.classId, t]));
          setTargetClasses(
            owned.map((c) => {
              const matched = targetMap.get(c.id);
              return {
                classId: c.id,
                className: c.name,
                classCode: c.code,
                selected: !!matched,
                dueDate: matched?.dueDate ?? '',
                closeDate: matched?.closeDate ?? '',
              };
            })
          );

          // Settings
          setPassingPoints(detail.passingPoints);
          setTimeLimitMinutes(detail.timeLimitMinutes ? String(detail.timeLimitMinutes) : '');
          setMaxAttempts(detail.maxAttempts);
          setRetakePolicy(detail.retakePolicy);
          setAllowLateSubmission(detail.allowLateSubmission);
          setLatePenaltyPercent(detail.latePenaltyPercent);
          setShuffleQuestions(detail.shuffleQuestions);
          setShowCorrectAnswers(detail.showCorrectAnswers);
        })
        .catch((err) => {
          setErrorMsg(err.message || 'Lỗi khi tải thông tin bài tập.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Create new assignment
      setTitle('');
      setDescription('');
      setHskLevelId(levels[0]?.id ?? 'level-hsk-1');
      setSelectedQuestions([]);
      setCurrentStatus('DRAFT');
      setIsSnapshotted(false);

      // Default target classes (unselected)
      const defaultDueDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      setTargetClasses(
        owned.map((c) => ({
          classId: c.id,
          className: c.name,
          classCode: c.code,
          selected: false,
          dueDate: defaultDueDate,
          closeDate: '',
        }))
      );

      setPassingPoints(10);
      setTimeLimitMinutes('30');
      setMaxAttempts(2);
      setRetakePolicy('HIGHEST_SCORE');
      setAllowLateSubmission(true);
      setLatePenaltyPercent(10);
      setShuffleQuestions(false);
      setShowCorrectAnswers(true);
    }
  }, [isOpen, assignmentId]);

  // Adjust passingPoints automatically if total points decrease
  useEffect(() => {
    if (passingPoints > totalPoints && totalPoints > 0) {
      setPassingPoints(totalPoints);
    }
  }, [totalPoints, passingPoints]);

  // Reorder question items
  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (isLocked) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= selectedQuestions.length) return;

    const list = [...selectedQuestions];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);

    // Update orderIndex
    const reordered = list.map((item, idx) => ({ ...item, orderIndex: idx }));
    setSelectedQuestions(reordered);
  };

  const handlePointsChange = (index: number, newPoints: number) => {
    if (isLocked) return;
    const list = [...selectedQuestions];
    list[index] = { ...list[index], points: Math.max(1, newPoints) };
    setSelectedQuestions(list);
  };

  const handleRemoveQuestion = (index: number) => {
    if (isLocked) return;
    const list = selectedQuestions.filter((_, i) => i !== index);
    const reordered = list.map((item, idx) => ({ ...item, orderIndex: idx }));
    setSelectedQuestions(reordered);
  };

  // Add questions from picker modal
  const handlePickerConfirm = (pickedItems: SharedExerciseItem[]) => {
    if (isLocked) return;
    const existingIds = new Set(selectedQuestions.map((q) => String(q.questionBankId)));

    const newEntries: SelectedQuestionFormItem[] = [];
    pickedItems.forEach((p) => {
      if (!existingIds.has(String(p.id))) {
        newEntries.push({
          questionBankId: p.id,
          orderIndex: selectedQuestions.length + newEntries.length,
          points: 5, // Default 5 points
          title: p.title,
          exerciseType: p.type,
          promptHanzi: p.promptHanzi,
          promptPinyin: p.promptPinyin,
          promptVietnamese: p.promptVietnamese,
        });
      }
    });

    setSelectedQuestions([...selectedQuestions, ...newEntries]);
  };

  // Target class selection toggle
  const handleToggleClass = (classId: string) => {
    setTargetClasses((prev) =>
      prev.map((c) => (c.classId === classId ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleTargetDateChange = (
    classId: string,
    field: 'dueDate' | 'closeDate',
    val: string
  ) => {
    setTargetClasses((prev) =>
      prev.map((c) => (c.classId === classId ? { ...c, [field]: val } : c))
    );
  };

  // Lock status (cannot modify questions/scoring if not DRAFT)
  const isLocked = readOnly || (currentStatus !== 'DRAFT' && Boolean(assignmentId));

  // Client-side validation
  const validateForm = (isPublish: boolean = false): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Tiêu đề bài tập không được để trống.';
    }

    if (!hskLevelId) {
      errors.hskLevelId = 'Vui lòng chọn cấp độ HSK.';
    }

    if (isPublish) {
      if (selectedQuestions.length === 0) {
        errors.questions = 'Cần thêm ít nhất một câu hỏi trước khi phát hành.';
      }

      const hasInvalidPoints = selectedQuestions.some((q) => !q.points || q.points <= 0);
      if (hasInvalidPoints) {
        errors.questions = 'Tất cả câu hỏi phải có điểm số lớn hơn 0.';
      }

      const activeTargets = targetClasses.filter((c) => c.selected);
      if (activeTargets.length === 0) {
        errors.targets = 'Phải chọn ít nhất một lớp học để giao bài tập.';
      }

      for (const t of activeTargets) {
        if (!t.dueDate) {
          errors.targets = `Vui lòng đặt hạn nộp bài cho lớp "${t.className}".`;
          break;
        }
        if (t.closeDate && t.closeDate < t.dueDate) {
          errors.targets = `Ngày đóng nộp lớp "${t.className}" phải sau hoặc bằng hạn nộp.`;
          break;
        }
      }
    }

    if (passingPoints < 0) {
      errors.passingPoints = 'Điểm đạt không được nhỏ hơn 0.';
    } else if (totalPoints > 0 && passingPoints > totalPoints) {
      errors.passingPoints = `Điểm đạt (${passingPoints}) không được lớn hơn tổng điểm (${totalPoints}).`;
    }

    if (maxAttempts < 1) {
      errors.maxAttempts = 'Số lần làm tối đa phải >= 1.';
    }

    if (latePenaltyPercent < 0 || latePenaltyPercent > 100) {
      errors.latePenalty = 'Phần trăm phạt nộp muộn phải từ 0% đến 100%.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler: Draft Save or Publish
  const handleSubmit = async (publishAfterSave: boolean) => {
    setErrorMsg(null);
    if (!validateForm(publishAfterSave)) {
      // Automatically switch to the section with errors
      if (validationErrors.title || validationErrors.hskLevelId) {
        setActiveSection('BASIC');
      } else if (validationErrors.questions) {
        setActiveSection('QUESTIONS');
      } else if (validationErrors.targets) {
        setActiveSection('CLASSES');
      } else if (validationErrors.passingPoints || validationErrors.maxAttempts || validationErrors.latePenalty) {
        setActiveSection('SETTINGS');
      }
      return;
    }

    setSaving(true);
    try {
      const selectedTargets = targetClasses
        .filter((c) => c.selected)
        .map((c) => ({
          classId: c.classId,
          dueDate: c.dueDate || undefined,
          closeDate: c.closeDate || undefined,
        }));

      const payloadQuestions = selectedQuestions.map((q, idx) => ({
        questionBankId: q.questionBankId,
        orderIndex: idx,
        points: Number(q.points),
      }));

      const parsedTimeLimit = timeLimitMinutes.trim() ? parseInt(timeLimitMinutes, 10) : undefined;

      let result: AssignmentDetailDTO;

      if (!assignmentId) {
        // CREATE
        const createDto: CreateAssignmentDTO = {
          title: title.trim(),
          description: description.trim(),
          hskLevelId,
          timeLimitMinutes: parsedTimeLimit,
          maxAttempts,
          retakePolicy,
          passingPoints,
          allowLateSubmission,
          latePenaltyPercent,
          shuffleQuestions,
          showCorrectAnswers,
          questions: payloadQuestions,
          targets: selectedTargets,
        };

        const created = await assignmentService.createAssignment(createDto);
        if (publishAfterSave) {
          result = await assignmentService.publishAssignment(created.id);
        } else {
          result = created;
        }
      } else {
        // UPDATE DRAFT
        const updateDto: UpdateDraftAssignmentDTO = {
          title: title.trim(),
          description: description.trim(),
          hskLevelId,
          timeLimitMinutes: parsedTimeLimit,
          maxAttempts,
          retakePolicy,
          passingPoints,
          allowLateSubmission,
          latePenaltyPercent,
          shuffleQuestions,
          showCorrectAnswers,
          questions: payloadQuestions,
          targets: selectedTargets,
        };

        const updated = await assignmentService.updateDraftAssignment(assignmentId, updateDto);
        if (publishAfterSave && updated.status === 'DRAFT') {
          result = await assignmentService.publishAssignment(assignmentId);
        } else {
          result = updated;
        }
      }

      onSuccess(result, publishAfterSave);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu bài tập.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tp-drawer-backdrop" onClick={onClose}>
      <div
        className="tp-assign-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="tp-drawer-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 id="drawer-title" className="tp-drawer-title">
                {readOnly
                  ? 'Chi tiết bài tập về nhà'
                  : assignmentId
                  ? 'Chỉnh sửa bài tập về nhà'
                  : 'Tạo bài tập về nhà mới'}
              </h3>
              {isLocked && (
                <span
                  className="tp-badge"
                  style={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Lock size={11} />
                  <span>Chế độ khóa snapshot</span>
                </span>
              )}
            </div>
            <p className="tp-drawer-subtitle">
              Studio quản lý bài tập theo chuẩn kiến trúc Option A (Split-Pane Assessment Studio).
            </p>
          </div>
          <button
            type="button"
            className="tp-btn tp-btn--ghost"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="tp-section-nav">
          <button
            type="button"
            className={`tp-section-nav-item ${activeSection === 'BASIC' ? 'tp-section-nav-item--active' : ''}`}
            onClick={() => setActiveSection('BASIC')}
          >
            <span className="tp-section-badge">A</span>
            <span>Thông tin chung</span>
          </button>

          <button
            type="button"
            className={`tp-section-nav-item ${activeSection === 'QUESTIONS' ? 'tp-section-nav-item--active' : ''}`}
            onClick={() => setActiveSection('QUESTIONS')}
          >
            <span className="tp-section-badge">B</span>
            <span>Chọn câu hỏi ({selectedQuestions.length})</span>
          </button>

          <button
            type="button"
            className={`tp-section-nav-item ${activeSection === 'CLASSES' ? 'tp-section-nav-item--active' : ''}`}
            onClick={() => setActiveSection('CLASSES')}
          >
            <span className="tp-section-badge">C</span>
            <span>Giao cho lớp ({targetClasses.filter((c) => c.selected).length})</span>
          </button>

          <button
            type="button"
            className={`tp-section-nav-item ${activeSection === 'SETTINGS' ? 'tp-section-nav-item--active' : ''}`}
            onClick={() => setActiveSection('SETTINGS')}
          >
            <span className="tp-section-badge">D</span>
            <span>Cài đặt làm bài</span>
          </button>

          <button
            type="button"
            className={`tp-section-nav-item ${activeSection === 'PREVIEW' ? 'tp-section-nav-item--active' : ''}`}
            onClick={() => setActiveSection('PREVIEW')}
          >
            <span className="tp-section-badge">E</span>
            <span>Xem trước & Phát hành</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: '#fef2f2',
              borderBottom: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Locked Snapshot Notice */}
        {isSnapshotted && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: '#eff6ff',
              borderBottom: '1px solid #bfdbfe',
              color: '#1d4ed8',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Info size={16} style={{ flexShrink: 0 }} />
            <span>
              Bài tập đã phát hành snapshot phiên bản v1. Câu hỏi và cơ cấu điểm số được đóng băng bất biến để đảm bảo tính công bằng khi chấm điểm.
            </span>
          </div>
        )}

        {/* Drawer Body */}
        <div className="tp-drawer-body">
          {loading ? (
            <div className="tp-empty-state" style={{ minHeight: '300px' }}>
              <div className="tp-loading-spinner" />
              <p className="tp-empty-state-text" style={{ marginTop: '12px' }}>
                Đang tải dữ liệu bài tập...
              </p>
            </div>
          ) : (
            <>
              {/* ============================================================ */}
              {/* SECTION A: THÔNG TIN CƠ BẢN */}
              {/* ============================================================ */}
              {activeSection === 'BASIC' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="tp-form-group">
                    <label className="tp-form-label">
                      Tiêu đề bài tập <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="tp-input"
                      placeholder="VD: Ôn luyện từ vựng HSK 3 - Bài 1 đến 5"
                      value={title}
                      disabled={isLocked}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    {validationErrors.title && (
                      <span className="tp-form-error">{validationErrors.title}</span>
                    )}
                  </div>

                  <div className="tp-form-group">
                    <label className="tp-form-label">
                      Cấp độ HSK tương ứng <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <select
                      className="tp-select"
                      value={hskLevelId}
                      disabled={isLocked}
                      onChange={(e) => setHskLevelId(e.target.value)}
                    >
                      {hskLevels.map((lvl) => (
                        <option key={lvl.id} value={lvl.id}>
                          {lvl.name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.hskLevelId && (
                      <span className="tp-form-error">{validationErrors.hskLevelId}</span>
                    )}
                  </div>

                  <div className="tp-form-group">
                    <label className="tp-form-label">Mô tả và dặn dò của giáo viên</label>
                    <textarea
                      className="tp-textarea"
                      rows={4}
                      placeholder="Ghi chú thêm về yêu cầu, tài liệu tham khảo hoặc lưu ý khi làm bài..."
                      value={description}
                      disabled={isLocked}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SECTION B: CHỌN CÂU HỎI */}
              {/* ============================================================ */}
              {activeSection === 'QUESTIONS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                        Danh sách câu hỏi ({selectedQuestions.length} câu · Tổng {totalPoints} điểm)
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                        Chọn từ ngân hàng câu hỏi chuẩn hoặc sắp xếp thứ tự và cấu hình điểm từng câu.
                      </p>
                    </div>

                    {!isLocked && (
                      <button
                        type="button"
                        className="tp-btn tp-btn--primary"
                        onClick={() => setIsPickerOpen(true)}
                      >
                        <Plus size={15} />
                        <span>Chọn câu hỏi</span>
                      </button>
                    )}
                  </div>

                  {validationErrors.questions && (
                    <span className="tp-form-error">{validationErrors.questions}</span>
                  )}

                  {selectedQuestions.length === 0 ? (
                    <div className="tp-empty-state" style={{ minHeight: '220px' }}>
                      <Layers size={36} className="tp-empty-state-icon" />
                      <h4 className="tp-empty-state-title">Chưa chọn câu hỏi nào</h4>
                      <p className="tp-empty-state-text">
                        Nhấn nút "Chọn câu hỏi" phía trên để thêm các câu hỏi từ ngân hàng bài tập.
                      </p>
                    </div>
                  ) : (
                    <div className="tp-question-list">
                      {selectedQuestions.map((q, idx) => (
                        <div key={q.questionBankId} className="tp-question-item">
                          <div className="tp-question-item-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: '#f3f4f6',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                }}
                              >
                                {idx + 1}
                              </span>
                              <span
                                className="tp-badge"
                                style={{
                                  fontSize: '11px',
                                  backgroundColor: '#eef2ff',
                                  color: '#4338ca',
                                }}
                              >
                                {q.exerciseType}
                              </span>
                              <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                                {q.title}
                              </span>
                            </div>

                            <div className="tp-question-item-actions">
                              {/* Points input */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                                  Điểm:
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  className="tp-input"
                                  style={{ width: '60px', padding: '4px 6px', textAlign: 'center' }}
                                  value={q.points}
                                  disabled={isLocked}
                                  onChange={(e) =>
                                    handlePointsChange(idx, parseInt(e.target.value, 10) || 1)
                                  }
                                />
                              </div>

                              {/* Reorder Buttons */}
                              {!isLocked && (
                                <>
                                  <button
                                    type="button"
                                    className="tp-btn tp-btn--ghost"
                                    style={{ padding: '4px' }}
                                    disabled={idx === 0}
                                    onClick={() => moveQuestion(idx, 'up')}
                                    title="Di chuyển lên"
                                  >
                                    <ArrowUp size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="tp-btn tp-btn--ghost"
                                    style={{ padding: '4px' }}
                                    disabled={idx === selectedQuestions.length - 1}
                                    onClick={() => moveQuestion(idx, 'down')}
                                    title="Di chuyển xuống"
                                  >
                                    <ArrowDown size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="tp-btn tp-btn--ghost"
                                    style={{ padding: '4px', color: 'var(--danger)' }}
                                    onClick={() => handleRemoveQuestion(idx)}
                                    title="Xóa câu hỏi"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Preview snippet */}
                          {(q.promptHanzi || q.promptVietnamese) && (
                            <div className="tp-question-item-preview">
                              {q.promptHanzi && <span style={{ fontWeight: 600 }}>{q.promptHanzi} </span>}
                              {q.promptPinyin && <span style={{ color: '#4338ca' }}>({q.promptPinyin}) </span>}
                              {q.promptVietnamese && <span>• {q.promptVietnamese}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* SECTION C: GIAO CHO LỚP */}
              {/* ============================================================ */}
              {activeSection === 'CLASSES' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      Phân bổ lớp học phụ trách
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                      Chọn một hoặc nhiều lớp học mà bạn đang phụ trách để giao bài tập và thiết lập thời hạn.
                    </p>
                  </div>

                  {validationErrors.targets && (
                    <span className="tp-form-error">{validationErrors.targets}</span>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {targetClasses.map((cls) => (
                      <div
                        key={cls.classId}
                        className="tp-target-class-card"
                        style={{
                          borderColor: cls.selected ? 'var(--primary)' : 'var(--border)',
                          backgroundColor: cls.selected ? '#fcfdff' : 'var(--surface)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: isLocked ? 'default' : 'pointer',
                              fontWeight: 600,
                              fontSize: 'var(--text-sm)',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={cls.selected}
                              disabled={isLocked}
                              onChange={() => handleToggleClass(cls.classId)}
                            />
                            <span>{cls.className}</span>
                            <span
                              className="tp-badge"
                              style={{
                                fontSize: '10px',
                                backgroundColor: '#f3f4f6',
                                color: '#4b5563',
                              }}
                            >
                              {cls.classCode}
                            </span>
                          </label>

                          {cls.selected && (
                            <span
                              className="tp-badge"
                              style={{
                                fontSize: '10px',
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                              }}
                            >
                              Đã chọn giao
                            </span>
                          )}
                        </div>

                        {cls.selected && (
                          <div className="tp-target-class-dates">
                            <div className="tp-form-group" style={{ margin: 0 }}>
                              <label className="tp-form-label" style={{ fontSize: '11px' }}>
                                Hạn nộp bài (Due Date) <span style={{ color: 'var(--danger)' }}>*</span>
                              </label>
                              <input
                                type="date"
                                className="tp-input"
                                value={cls.dueDate}
                                disabled={isLocked}
                                onChange={(e) =>
                                  handleTargetDateChange(cls.classId, 'dueDate', e.target.value)
                                }
                              />
                            </div>

                            <div className="tp-form-group" style={{ margin: 0 }}>
                              <label className="tp-form-label" style={{ fontSize: '11px' }}>
                                Ngày đóng nộp (Close Date - Tùy chọn)
                              </label>
                              <input
                                type="date"
                                className="tp-input"
                                value={cls.closeDate}
                                disabled={isLocked}
                                onChange={(e) =>
                                  handleTargetDateChange(cls.classId, 'closeDate', e.target.value)
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SECTION D: CÀI ĐẶT LÀM BÀI */}
              {/* ============================================================ */}
              {activeSection === 'SETTINGS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      Quy chế và thiết lập đánh giá
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                      Cấu hình số lần làm, thời gian, chính sách nộp muộn và cách tính điểm.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    {/* Passing points */}
                    <div className="tp-form-group">
                      <label className="tp-form-label">
                        Điểm đạt (Passing Points)
                      </label>
                      <input
                        type="number"
                        className="tp-input"
                        min={0}
                        max={totalPoints || 100}
                        value={passingPoints}
                        disabled={isLocked}
                        onChange={(e) => setPassingPoints(Number(e.target.value) || 0)}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                        Tối đa: {totalPoints} điểm
                      </span>
                      {validationErrors.passingPoints && (
                        <span className="tp-form-error">{validationErrors.passingPoints}</span>
                      )}
                    </div>

                    {/* Time limit */}
                    <div className="tp-form-group">
                      <label className="tp-form-label">
                        Thời gian làm bài (Phút)
                      </label>
                      <input
                        type="number"
                        className="tp-input"
                        placeholder="Để trống nếu không giới hạn"
                        min={5}
                        max={300}
                        value={timeLimitMinutes}
                        disabled={isLocked}
                        onChange={(e) => setTimeLimitMinutes(e.target.value)}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                        Để trống = Không giới hạn thời gian
                      </span>
                    </div>

                    {/* Max attempts */}
                    <div className="tp-form-group">
                      <label className="tp-form-label">
                        Số lần làm tối đa (Attempts)
                      </label>
                      <input
                        type="number"
                        className="tp-input"
                        min={1}
                        max={10}
                        value={maxAttempts}
                        disabled={isLocked}
                        onChange={(e) => setMaxAttempts(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      />
                      {validationErrors.maxAttempts && (
                        <span className="tp-form-error">{validationErrors.maxAttempts}</span>
                      )}
                    </div>

                    {/* Retake Policy */}
                    <div className="tp-form-group">
                      <label className="tp-form-label">Chính sách tính điểm khi làm lại</label>
                      <select
                        className="tp-select"
                        value={retakePolicy}
                        disabled={isLocked}
                        onChange={(e) => setRetakePolicy(e.target.value as RetakePolicy)}
                      >
                        <option value="HIGHEST_SCORE">Lấy điểm cao nhất (Highest Score)</option>
                        <option value="LATEST_ATTEMPT">Lấy lần nộp cuối cùng (Latest Attempt)</option>
                      </select>
                    </div>
                  </div>

                  {/* Late Submission & Penalty */}
                  <div
                    style={{
                      borderTop: '1px solid var(--border)',
                      paddingTop: 'var(--space-3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                      <input
                        type="checkbox"
                        checked={allowLateSubmission}
                        disabled={isLocked}
                        onChange={(e) => setAllowLateSubmission(e.target.checked)}
                      />
                      <span>Cho phép học viên nộp muộn sau hạn chót (Late Submission)</span>
                    </label>

                    {allowLateSubmission && (
                      <div className="tp-form-group" style={{ maxWidth: '280px', marginLeft: '24px' }}>
                        <label className="tp-form-label" style={{ fontSize: '11px' }}>
                          Trừ điểm phạt nộp muộn (% điểm bài nộp)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            className="tp-input"
                            min={0}
                            max={100}
                            value={latePenaltyPercent}
                            disabled={isLocked}
                            onChange={(e) => setLatePenaltyPercent(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                          />
                          <span style={{ fontSize: 'var(--text-sm)' }}>%</span>
                        </div>
                      </div>
                    )}

                    {/* Question shuffling */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                      <input
                        type="checkbox"
                        checked={shuffleQuestions}
                        disabled={isLocked}
                        onChange={(e) => setShuffleQuestions(e.target.checked)}
                      />
                      <span>Xáo trộn ngẫu nhiên thứ tự câu hỏi khi học viên mở bài làm</span>
                    </label>

                    {/* Correct answers visibility */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                      <input
                        type="checkbox"
                        checked={showCorrectAnswers}
                        disabled={isLocked}
                        onChange={(e) => setShowCorrectAnswers(e.target.checked)}
                      />
                      <span>Cho phép học viên xem giải thích và đáp án đúng sau khi nộp bài</span>
                    </label>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SECTION E: XEM TRƯỚC & PHÁT HÀNH */}
              {/* ============================================================ */}
              {activeSection === 'PREVIEW' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      Xem trước và xác nhận phát hành
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                      Kiểm tra toàn diện thông số bài tập trước khi lưu bản nháp hoặc phát hành tới học viên.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="tp-summary-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span
                          className="tp-badge"
                          style={{
                            fontSize: '11px',
                            backgroundColor: '#eef2ff',
                            color: '#4338ca',
                            fontWeight: 600,
                            marginBottom: '4px',
                          }}
                        >
                          {hskLevels.find((l) => l.id === hskLevelId)?.name ?? 'HSK'}
                        </span>
                        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                          {title || 'Chưa đặt tiêu đề'}
                        </h3>
                        {description && (
                          <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                            {description}
                          </p>
                        )}
                      </div>

                      <span
                        className="tp-badge"
                        style={{
                          fontSize: '11px',
                          backgroundColor: currentStatus === 'PUBLISHED' ? '#ecfdf5' : '#f3f4f6',
                          color: currentStatus === 'PUBLISHED' ? '#047857' : '#374151',
                          fontWeight: 600,
                        }}
                      >
                        {currentStatus === 'PUBLISHED' ? 'Đã phát hành' : 'Bản nháp'}
                      </span>
                    </div>

                    <div className="tp-summary-grid">
                      <div className="tp-summary-item">
                        <span className="tp-summary-item-label">Số câu hỏi</span>
                        <span className="tp-summary-item-value">{selectedQuestions.length} câu</span>
                      </div>
                      <div className="tp-summary-item">
                        <span className="tp-summary-item-label">Tổng điểm</span>
                        <span className="tp-summary-item-value">{totalPoints} điểm</span>
                      </div>
                      <div className="tp-summary-item">
                        <span className="tp-summary-item-label">Điểm đạt tối thiểu</span>
                        <span className="tp-summary-item-value">{passingPoints} điểm</span>
                      </div>
                      <div className="tp-summary-item">
                        <span className="tp-summary-item-label">Thời gian làm bài</span>
                        <span className="tp-summary-item-value">
                          {timeLimitMinutes ? `${timeLimitMinutes} phút` : 'Không giới hạn'}
                        </span>
                      </div>
                      <div className="tp-summary-item">
                        <span className="tp-summary-item-label">Số lần làm tối đa</span>
                        <span className="tp-summary-item-value">{maxAttempts} lần</span>
                      </div>
                      <div className="tp-summary-item">
                        <span className="tp-summary-item-label">Chính sách tính điểm</span>
                        <span className="tp-summary-item-value">
                          {retakePolicy === 'HIGHEST_SCORE' ? 'Điểm cao nhất' : 'Lần nộp cuối'}
                        </span>
                      </div>
                    </div>

                    {/* Classes assigned */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-2)' }}>
                      <span className="tp-summary-item-label">Lớp học được giao:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        {targetClasses.filter((c) => c.selected).length > 0 ? (
                          targetClasses
                            .filter((c) => c.selected)
                            .map((c) => (
                              <span
                                key={c.classId}
                                className="tp-badge"
                                style={{
                                  fontSize: '11px',
                                  backgroundColor: '#f3f4f6',
                                  color: '#374151',
                                }}
                              >
                                {c.className} (Hạn: {c.dueDate || 'Chưa đặt'})
                              </span>
                            ))
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', fontStyle: 'italic' }}>
                            Chưa chọn lớp nào để giao bài.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Readiness Verification Banner */}
                  <div
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor:
                        selectedQuestions.length > 0 && targetClasses.filter((c) => c.selected).length > 0
                          ? '#f0fdf4'
                          : '#fffbeb',
                      border: `1px solid ${
                        selectedQuestions.length > 0 && targetClasses.filter((c) => c.selected).length > 0
                          ? '#bbf7d0'
                          : '#fef08a'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    {selectedQuestions.length > 0 && targetClasses.filter((c) => c.selected).length > 0 ? (
                      <>
                        <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                        <span style={{ color: '#166534' }}>
                          Bài tập đủ điều kiện phát hành! Khi phát hành, snapshot câu hỏi sẽ được đóng băng bất biến.
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
                        <span style={{ color: '#92400e' }}>
                          Cần chọn ít nhất 1 câu hỏi và 1 lớp học để đủ điều kiện phát hành bài tập.
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="tp-drawer-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
              Trạng thái: <strong>{currentStatus}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="tp-btn tp-btn--secondary"
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </button>

            {!readOnly && currentStatus === 'DRAFT' && (
              <>
                <button
                  type="button"
                  className="tp-btn tp-btn--secondary"
                  disabled={saving}
                  onClick={() => handleSubmit(false)}
                >
                  <Save size={15} />
                  <span>{saving ? 'Đang lưu...' : 'Lưu bản nháp'}</span>
                </button>

                <button
                  type="button"
                  className="tp-btn tp-btn--primary"
                  disabled={
                    saving ||
                    selectedQuestions.length === 0 ||
                    targetClasses.filter((c) => c.selected).length === 0
                  }
                  onClick={() => handleSubmit(true)}
                >
                  <Send size={15} />
                  <span>{saving ? 'Đang phát hành...' : 'Phát hành ngay'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Question Picker Modal */}
      <AssignmentQuestionPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        alreadySelectedIds={selectedQuestions.map((q) => q.questionBankId)}
        onConfirm={handlePickerConfirm}
        currentHskLevelId={hskLevelId}
      />
    </div>
  );
};
