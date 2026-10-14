import React, { useState } from 'react';
import { Eye, Smartphone, Monitor, Sparkles, RefreshCw } from 'lucide-react';
import type { EditorSectionKey, LessonEditorDraft } from '../../types';
import { LessonPlayerAdapter } from '../../../../../features/lesson/adapters/lesson-player.adapter';

// Import presentational step components from student feature
import { IntroStep } from '../../../../../features/lesson/steps/IntroStep';
import { VocabularyStep } from '../../../../../features/lesson/steps/VocabularyStep';
import { GrammarStep } from '../../../../../features/lesson/steps/GrammarStep';
import { DialogueStep } from '../../../../../features/lesson/steps/DialogueStep';
import { ListeningStep } from '../../../../../features/lesson/steps/ListeningStep';
import { ExerciseStep } from '../../../../../features/lesson/steps/ExerciseStep';

interface LessonPreviewCanvasProps {
  draft: LessonEditorDraft;
  activeAuthoringSection: EditorSectionKey;
}

const SECTION_LABELS: Record<EditorSectionKey, string> = {
  intro: '1. Giới thiệu',
  vocabulary: '2. Từ vựng',
  grammar: '3. Ngữ pháp',
  dialogue: '4. Hội thoại',
  listening: '5. Luyện nghe',
  practice: '6. Luyện tập',
  quiz: '7. Kiểm tra',
};

export const LessonPreviewCanvas: React.FC<LessonPreviewCanvasProps> = ({
  draft,
  activeAuthoringSection,
}) => {
  // Sync preview section with authoring section, or allow manual override
  const [overridePreviewSection, setOverridePreviewSection] = useState<EditorSectionKey | null>(null);
  const [deviceMode, setDeviceMode] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [previewKey, setPreviewKey] = useState(0);

  const previewSection = overridePreviewSection ?? activeAuthoringSection;

  const handleResetSimulation = () => {
    setOverridePreviewSection(null);
    setPreviewKey((k) => k + 1);
  };

  const adaptedIntro = LessonPlayerAdapter.toIntroStepData(draft);
  const adaptedVocab = LessonPlayerAdapter.toVocabularyStepData(draft);
  const adaptedGrammar = LessonPlayerAdapter.toGrammarStepData(draft);
  const adaptedDialogue = LessonPlayerAdapter.toDialogueStepData(draft);
  const adaptedListening = LessonPlayerAdapter.toListeningStepData(draft);
  const adaptedPractice = LessonPlayerAdapter.toPracticeStepData(draft);
  const adaptedQuiz = LessonPlayerAdapter.toQuizStepData(draft);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--surface-sunken, #f8fafc)',
        borderRadius: 'var(--radius-xl)',
        border: '1.5px solid var(--border)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Top Preview Control Bar */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Eye size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)' }}>
            LIVE PREVIEW
          </span>
          <span
            style={{
              fontSize: 'var(--text-2xs)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <Sparkles size={11} /> Mô phỏng học viên (Simulation)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Device viewport toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--background)',
              padding: '2px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              className="ds-btn ds-btn-ghost ds-btn-xs"
              style={{
                backgroundColor: deviceMode === 'DESKTOP' ? 'var(--surface)' : 'transparent',
                fontWeight: deviceMode === 'DESKTOP' ? 700 : 500,
                padding: '2px 6px',
              }}
              onClick={() => setDeviceMode('DESKTOP')}
              title="Khung nhìn Máy tính (Desktop View)"
            >
              <Monitor size={13} />
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-ghost ds-btn-xs"
              style={{
                backgroundColor: deviceMode === 'MOBILE' ? 'var(--surface)' : 'transparent',
                fontWeight: deviceMode === 'MOBILE' ? 700 : 500,
                padding: '2px 6px',
              }}
              onClick={() => setDeviceMode('MOBILE')}
              title="Khung nhìn Di động (Mobile View)"
            >
              <Smartphone size={13} />
            </button>
          </div>

          <button
            type="button"
            className="ds-btn ds-btn-ghost ds-btn-xs"
            onClick={handleResetSimulation}
            title="Tải lại mô phỏng bước"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Preview Section Switcher Tabs */}
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          backgroundColor: 'var(--background)',
          padding: 'var(--space-2) var(--space-3)',
          borderBottom: '1px solid var(--border)',
          gap: 'var(--space-1)',
        }}
      >
        {(Object.keys(SECTION_LABELS) as EditorSectionKey[]).map((secKey) => {
          const isSelected = previewSection === secKey;
          return (
            <button
              key={secKey}
              type="button"
              onClick={() => setOverridePreviewSection(secKey === activeAuthoringSection ? null : secKey)}
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                backgroundColor: isSelected ? 'var(--surface)' : 'transparent',
                color: isSelected ? 'var(--primary)' : 'var(--muted)',
                fontSize: 'var(--text-xs)',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {SECTION_LABELS[secKey]}
            </button>
          );
        })}
      </div>

      {/* Player Simulation Viewport */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <div
          key={previewKey}
          style={{
            width: '100%',
            maxWidth: deviceMode === 'MOBILE' ? '390px' : '680px',
            backgroundColor: 'var(--surface)',
            borderRadius: deviceMode === 'MOBILE' ? 'var(--radius-2xl)' : 'var(--radius-xl)',
            border: deviceMode === 'MOBILE' ? '4px solid #1e293b' : '1px solid var(--border)',
            padding: 'var(--space-5)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
            minHeight: '440px',
            transition: 'max-width 0.25s ease',
          }}
        >
          {previewSection === 'intro' && <IntroStep lesson={adaptedIntro} />}

          {previewSection === 'vocabulary' && (
            <VocabularyStep vocabulary={adaptedVocab} />
          )}

          {previewSection === 'grammar' && (
            <GrammarStep grammar={adaptedGrammar} />
          )}

          {previewSection === 'dialogue' && (
            <DialogueStep dialogue={adaptedDialogue} />
          )}

          {previewSection === 'listening' && (
            <ListeningStep listening={adaptedListening} />
          )}

          {previewSection === 'practice' && (
            <ExerciseStep exercises={adaptedPractice} />
          )}

          {previewSection === 'quiz' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-3)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                }}
              >
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#92400e' }}>
                  KỲ ĐÁNH GIÁ (QUIZ) · BÀI TẬP TÍNH ĐIỂM
                </span>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#92400e' }}>
                  Tổng {draft.exercises.filter((e) => e.section === 'QUIZ').length} câu hỏi
                </span>
              </div>
              <ExerciseStep exercises={adaptedQuiz} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
