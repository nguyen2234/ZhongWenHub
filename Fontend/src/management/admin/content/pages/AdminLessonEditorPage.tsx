import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Eye,
  Edit3,
  Layers,
  Sparkles,
} from 'lucide-react';

import { curriculumService } from '../services/curriculum.service';
import { lessonValidationService } from '../services/lesson-validation.service';
import type {
  EditorSectionKey,
  LessonEditorDraft,
} from '../types';

import { SectionNavigation } from '../components/editor/SectionNavigation';
import { IntroSectionEditor } from '../components/editor/IntroSectionEditor';
import { VocabularySectionEditor } from '../components/editor/VocabularySectionEditor';
import { GrammarSectionEditor } from '../components/editor/GrammarSectionEditor';
import { DialogueSectionEditor } from '../components/editor/DialogueSectionEditor';
import { ListeningSectionEditor } from '../components/editor/ListeningSectionEditor';
import { PracticeSectionEditor } from '../components/editor/PracticeSectionEditor';
import { QuizSectionEditor } from '../components/editor/QuizSectionEditor';
import { LessonPreviewCanvas } from '../components/editor/LessonPreviewCanvas';
import { ValidationModal } from '../components/editor/ValidationModal';
import { ConfirmLeaveDialog } from '../components/editor/ConfirmLeaveDialog';

export const AdminLessonEditorPage: React.FC = () => {
  const { lessonId = 'les-8' } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  // Draft State Management initialized synchronously
  const [prevLessonId, setPrevLessonId] = useState(lessonId);
  const [savedLesson, setSavedLesson] = useState<LessonEditorDraft>(() =>
    curriculumService.getLessonEditorData(lessonId)
  );
  const [draftLesson, setDraftLesson] = useState<LessonEditorDraft>(() =>
    curriculumService.getLessonEditorData(lessonId)
  );
  const [activeSection, setActiveSection] = useState<EditorSectionKey>('intro');

  if (prevLessonId !== lessonId) {
    setPrevLessonId(lessonId);
    const data = curriculumService.getLessonEditorData(lessonId);
    setSavedLesson(JSON.parse(JSON.stringify(data)));
    setDraftLesson(JSON.parse(JSON.stringify(data)));
  }

  // Modals & Dialogs
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isConfirmLeaveOpen, setIsConfirmLeaveOpen] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string | null>(null);

  // Responsive layout mode for < 1280px
  const [mobileTab, setMobileTab] = useState<'AUTHORING' | 'PREVIEW'>('AUTHORING');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Determine if draft is dirty
  const isDirty = useMemo(() => {
    if (!savedLesson || !draftLesson) return false;
    return JSON.stringify(savedLesson) !== JSON.stringify(draftLesson);
  }, [savedLesson, draftLesson]);

  // Browser-level beforeunload guard when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Validation Summary
  const validationSummary = useMemo(() => {
    if (!draftLesson) {
      return {
        overallStatus: 'INCOMPLETE' as const,
        sections: {
          intro: { status: 'INCOMPLETE' as const, issues: [] },
          vocabulary: { status: 'INCOMPLETE' as const, issues: [] },
          grammar: { status: 'INCOMPLETE' as const, issues: [] },
          dialogue: { status: 'INCOMPLETE' as const, issues: [] },
          listening: { status: 'INCOMPLETE' as const, issues: [] },
          practice: { status: 'INCOMPLETE' as const, issues: [] },
          quiz: { status: 'INCOMPLETE' as const, issues: [] },
        },
        totalErrors: 0,
        totalWarnings: 0,
      };
    }
    return lessonValidationService.validate(draftLesson);
  }, [draftLesson]);

  // Item counts for section badges
  const itemCounts = useMemo(() => {
    if (!draftLesson) {
      return {
        vocabularyCount: 0,
        grammarCount: 0,
        dialogueLineCount: 0,
        listeningCount: 0,
        practiceCount: 0,
        quizCount: 0,
      };
    }
    return {
      vocabularyCount: draftLesson.vocabularies.length,
      grammarCount: draftLesson.grammars.length,
      dialogueLineCount: draftLesson.dialogue.lines.length,
      listeningCount: draftLesson.listenings.length,
      practiceCount: draftLesson.exercises.filter((e) => e.section === 'PRACTICE').length,
      quizCount: draftLesson.exercises.filter((e) => e.section === 'QUIZ').length,
    };
  }, [draftLesson]);

  // Safe navigation handler
  const handleSafeBack = useCallback(() => {
    if (isDirty) {
      setPendingNavigationPath('/management/admin/curriculum');
      setIsConfirmLeaveOpen(true);
    } else {
      navigate('/management/admin/curriculum');
    }
  }, [isDirty, navigate]);

  const handleConfirmDiscard = () => {
    setIsConfirmLeaveOpen(false);
    if (pendingNavigationPath) {
      navigate(pendingNavigationPath);
    } else {
      navigate('/management/admin/curriculum');
    }
  };

  // Explicit Save Draft action
  const handleSaveDraft = () => {
    if (!draftLesson) return;
    const persisted = curriculumService.saveLessonDraft(lessonId, draftLesson);
    setSavedLesson(JSON.parse(JSON.stringify(persisted)));
    setDraftLesson(JSON.parse(JSON.stringify(persisted)));
    setSaveSuccessMessage('Đã lưu bản nháp thành công!');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Publish action
  const handlePublish = () => {
    if (!draftLesson) return;
    const updated = { ...draftLesson, status: 'PUBLISHED' as const };
    const persisted = curriculumService.saveLessonDraft(lessonId, updated);
    setSavedLesson(JSON.parse(JSON.stringify(persisted)));
    setDraftLesson(JSON.parse(JSON.stringify(persisted)));
    setSaveSuccessMessage('Đã xuất bản bài học thành công!');
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Submit for review action
  const handleSubmitReview = () => {
    if (!draftLesson) return;
    const updated = { ...draftLesson, status: 'PENDING_REVIEW' as const };
    const persisted = curriculumService.saveLessonDraft(lessonId, updated);
    setSavedLesson(JSON.parse(JSON.stringify(persisted)));
    setDraftLesson(JSON.parse(JSON.stringify(persisted)));
    setSaveSuccessMessage('Đã gửi duyệt bài học thành công!');
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  if (!draftLesson) {
    return (
      <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--muted)' }}>
        Đang tải không gian soạn bài...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        width: '100%',
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      {/* 1. STUDIO HEADER BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-5)',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Left: Back button & Breadcrumb / Lesson title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={handleSafeBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={15} /> Giáo trình
          </button>

          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border)' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 600 }}>
                Bài {draftLesson.lessonNumber}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>·</span>
              <h2
                style={{
                  margin: 0,
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-hanzi)',
                  color: 'var(--foreground)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {draftLesson.intro.titleZh || 'Chưa đặt tiêu đề'}
              </h2>
              {draftLesson.intro.titleVi && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 500 }}>
                  ({draftLesson.intro.titleVi})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center / Right: Status badge & Dirty indicator & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {/* Status Badge */}
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor:
                draftLesson.status === 'PUBLISHED'
                  ? '#dcfce7'
                  : draftLesson.status === 'PENDING_REVIEW'
                  ? '#fef3c7'
                  : 'var(--background)',
              color:
                draftLesson.status === 'PUBLISHED'
                  ? '#15803d'
                  : draftLesson.status === 'PENDING_REVIEW'
                  ? '#92400e'
                  : 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            {draftLesson.status === 'PUBLISHED'
              ? 'Đã xuất bản'
              : draftLesson.status === 'PENDING_REVIEW'
              ? 'Chờ duyệt'
              : 'Bản nháp'}
          </span>

          {/* Dirty indicator */}
          {isDirty ? (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                color: '#ea580c',
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Chưa lưu
            </span>
          ) : (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CheckCircle size={13} style={{ color: 'var(--success, #10b981)' }} /> Đã lưu
            </span>
          )}

          {saveSuccessMessage && (
            <span style={{ fontSize: 'var(--text-xs)', color: '#15803d', fontWeight: 600 }}>
              {saveSuccessMessage}
            </span>
          )}

          {/* Action buttons */}
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={() => setIsValidationModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} /> Kiểm tra nội dung
          </button>

          <button
            type="button"
            className="ds-btn ds-btn-primary ds-btn-sm"
            onClick={handleSaveDraft}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={14} /> Lưu bản nháp
          </button>
        </div>
      </div>

      {/* 2. TABLET / MOBILE VIEW TOGGLE (< 1280px) */}
      <div
        className="editor-tablet-mobile-toggle"
        style={{
          display: 'none',
          backgroundColor: 'var(--surface)',
          padding: 'var(--space-2)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          justifyContent: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <button
          type="button"
          className={`ds-btn ds-btn-sm ${mobileTab === 'AUTHORING' ? 'ds-btn-primary' : 'ds-btn-outline'}`}
          onClick={() => setMobileTab('AUTHORING')}
          style={{ flex: 1, maxWidth: '240px' }}
        >
          <Edit3 size={15} /> Soạn thảo nội dung
        </button>
        <button
          type="button"
          className={`ds-btn ds-btn-sm ${mobileTab === 'PREVIEW' ? 'ds-btn-primary' : 'ds-btn-outline'}`}
          onClick={() => setMobileTab('PREVIEW')}
          style={{ flex: 1, maxWidth: '240px' }}
        >
          <Eye size={15} /> Xem trước học viên (Preview)
        </button>
      </div>

      {/* 3. MAIN WORKSPACE (55% Authoring · 45% Live Preview on Desktop) */}
      <div
        className="editor-workspace-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 55fr) minmax(0, 45fr)',
          gap: 'var(--space-5)',
          alignItems: 'start',
          flex: 1,
        }}
      >
        {/* LEFT COLUMN: AUTHORING (55%) */}
        <div
          className={`editor-authoring-column ${mobileTab === 'PREVIEW' ? 'hide-on-tablet' : ''}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          {/* Section Navigation Header / Tabs */}
          <div
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <Layers size={17} style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
                7 PHÂN ĐOẠN BIÊN TẬP NỘI DUNG
              </h3>
            </div>

            <SectionNavigation
              activeSection={activeSection}
              onSelectSection={setActiveSection}
              validationSummary={validationSummary}
              itemCounts={itemCounts}
            />
          </div>

          {/* Active Section Content Editor */}
          <div style={{ flex: 1 }}>
            {activeSection === 'intro' && (
              <IntroSectionEditor
                intro={draftLesson.intro}
                onChange={(updatedIntro) =>
                  setDraftLesson((prev) => ({ ...prev, intro: updatedIntro }))
                }
              />
            )}

            {activeSection === 'vocabulary' && (
              <VocabularySectionEditor
                lessonId={draftLesson.lessonId}
                vocabularies={draftLesson.vocabularies}
                onChange={(updatedVocabs) =>
                  setDraftLesson((prev) => ({ ...prev, vocabularies: updatedVocabs }))
                }
              />
            )}

            {activeSection === 'grammar' && (
              <GrammarSectionEditor
                lessonId={draftLesson.lessonId}
                grammars={draftLesson.grammars}
                onChange={(updatedGrammars) =>
                  setDraftLesson((prev) => ({ ...prev, grammars: updatedGrammars }))
                }
              />
            )}

            {activeSection === 'dialogue' && (
              <DialogueSectionEditor
                dialogue={draftLesson.dialogue}
                onChange={(updatedDialogue) =>
                  setDraftLesson((prev) => ({ ...prev, dialogue: updatedDialogue }))
                }
              />
            )}

            {activeSection === 'listening' && (
              <ListeningSectionEditor
                lessonId={draftLesson.lessonId}
                listenings={draftLesson.listenings}
                onChange={(updatedListenings) =>
                  setDraftLesson((prev) => ({ ...prev, listenings: updatedListenings }))
                }
              />
            )}

            {activeSection === 'practice' && (
              <PracticeSectionEditor
                lessonId={draftLesson.lessonId}
                exercises={draftLesson.exercises}
                onChange={(updatedExercises) =>
                  setDraftLesson((prev) => ({ ...prev, exercises: updatedExercises }))
                }
              />
            )}

            {activeSection === 'quiz' && (
              <QuizSectionEditor
                lessonId={draftLesson.lessonId}
                exercises={draftLesson.exercises}
                onChange={(updatedExercises) =>
                  setDraftLesson((prev) => ({ ...prev, exercises: updatedExercises }))
                }
              />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW (45%) */}
        <div
          className={`editor-preview-column ${mobileTab === 'AUTHORING' ? 'hide-on-tablet' : ''}`}
          style={{
            position: 'sticky',
            top: 'var(--space-4)',
            height: 'calc(100vh - 120px)',
            minHeight: '600px',
          }}
        >
          <LessonPreviewCanvas
            draft={draftLesson}
            activeAuthoringSection={activeSection}
          />
        </div>
      </div>

      {/* Validation Checklist Drawer/Modal */}
      <ValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        summary={validationSummary}
        currentStatus={draftLesson.status}
        onPublish={handlePublish}
        onSubmitForReview={handleSubmitReview}
      />

      {/* Confirm Leave Navigation Guard Dialog */}
      <ConfirmLeaveDialog
        isOpen={isConfirmLeaveOpen}
        onContinueEditing={() => setIsConfirmLeaveOpen(false)}
        onDiscardAndLeave={handleConfirmDiscard}
      />

      {/* Responsive Styles for Workspace */}
      <style>{`
        @media (max-width: 1279px) {
          .editor-tablet-mobile-toggle {
            display: flex !important;
          }
          .editor-workspace-container {
            grid-template-columns: 1fr !important;
          }
          .editor-authoring-column.hide-on-tablet {
            display: none !important;
          }
          .editor-preview-column.hide-on-tablet {
            display: none !important;
          }
          .editor-preview-column {
            position: static !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
};
