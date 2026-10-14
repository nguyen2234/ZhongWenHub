import type {
  EditorSectionKey,
  LessonEditorDraft,
  LessonValidationSummary,
  SectionValidationResult,
  ValidationIssue,
} from '../types/lesson-editor.types';

class LessonValidationService {
  /**
   * Kiểm tra tính hoàn thiện nội dung biên tập của bản nháp bài học (Content Authoring Validation).
   * Không lưu hoặc kiểm tra trực tiếp bên trong component giao diện.
   */
  validate(draft: LessonEditorDraft): LessonValidationSummary {
    const issues: ValidationIssue[] = [];
    const sectionResults: Record<EditorSectionKey, SectionValidationResult> = {
      intro: { status: 'COMPLETE', issues: [] },
      vocabulary: { status: 'COMPLETE', issues: [] },
      grammar: { status: 'COMPLETE', issues: [] },
      dialogue: { status: 'COMPLETE', issues: [] },
      listening: { status: 'COMPLETE', issues: [] },
      practice: { status: 'COMPLETE', issues: [] },
      quiz: { status: 'COMPLETE', issues: [] },
    };

    // 1. INTRO RULES
    const introIssues: string[] = [];
    if (!draft.intro.titleZh || !draft.intro.titleZh.trim()) {
      introIssues.push('Tiêu đề tiếng Trung (Hán tự) là bắt buộc.');
      issues.push({
        section: 'intro',
        severity: 'ERROR',
        message: 'Thiếu tiêu đề tiếng Trung (Hán tự).',
      });
    }
    if (!draft.intro.titleVi || !draft.intro.titleVi.trim()) {
      introIssues.push('Tiêu đề dịch tiếng Việt là bắt buộc.');
      issues.push({
        section: 'intro',
        severity: 'ERROR',
        message: 'Thiếu tiêu đề dịch tiếng Việt.',
      });
    }
    const validObjectives = draft.intro.objectives.filter((o) => o && o.trim().length > 0);
    if (validObjectives.length < 2) {
      introIssues.push(`Cần ít nhất 2 mục tiêu bài học (hiện có: ${validObjectives.length}).`);
      issues.push({
        section: 'intro',
        severity: 'WARNING',
        message: `Cần ít nhất 2 mục tiêu bài học (hiện có: ${validObjectives.length}).`,
      });
    }

    if (introIssues.some((msg) => msg.includes('bắt buộc'))) {
      sectionResults.intro = { status: 'WARNING', issues: introIssues };
    } else if (introIssues.length > 0) {
      sectionResults.intro = { status: 'INCOMPLETE', issues: introIssues };
    } else {
      sectionResults.intro = { status: 'COMPLETE', issues: [] };
    }

    // 2. VOCABULARY RULES: >= 5 attached words
    const vocabCount = draft.vocabularies.length;
    const vocabIssues: string[] = [];
    if (vocabCount < 5) {
      vocabIssues.push(`Cần gắn tối thiểu 5 từ vựng từ kho chuẩn (hiện có: ${vocabCount}/5).`);
      issues.push({
        section: 'vocabulary',
        severity: vocabCount === 0 ? 'WARNING' : 'WARNING',
        message: `Cần ít nhất 5 từ vựng (hiện có: ${vocabCount}).`,
      });
      sectionResults.vocabulary = {
        status: vocabCount === 0 ? 'INCOMPLETE' : 'WARNING',
        issues: vocabIssues,
      };
    } else {
      sectionResults.vocabulary = { status: 'COMPLETE', issues: [] };
    }

    // 3. GRAMMAR RULES: >= 1 grammar point
    const grammarCount = draft.grammars.length;
    const grammarIssues: string[] = [];
    if (grammarCount < 1) {
      grammarIssues.push('Cần liên kết tối thiểu 1 điểm ngữ pháp trọng tâm.');
      issues.push({
        section: 'grammar',
        severity: 'WARNING',
        message: 'Chưa gắn điểm ngữ pháp trọng tâm nào.',
      });
      sectionResults.grammar = { status: 'INCOMPLETE', issues: grammarIssues };
    } else {
      sectionResults.grammar = { status: 'COMPLETE', issues: [] };
    }

    // 4. DIALOGUE RULES: >= 4 dialogue lines
    const lineCount = draft.dialogue.lines.length;
    const dialogueIssues: string[] = [];
    if (!draft.dialogue.title || !draft.dialogue.title.trim()) {
      dialogueIssues.push('Cần đặt tiêu đề cho ngữ cảnh bài hội thoại.');
    }
    if (lineCount < 4) {
      dialogueIssues.push(`Cần tối thiểu 4 lượt câu thoại thực tế (hiện có: ${lineCount}/4).`);
      issues.push({
        section: 'dialogue',
        severity: 'WARNING',
        message: `Hội thoại cần tối thiểu 4 câu (hiện có: ${lineCount}).`,
      });
      sectionResults.dialogue = {
        status: lineCount === 0 ? 'INCOMPLETE' : 'WARNING',
        issues: dialogueIssues,
      };
    } else {
      sectionResults.dialogue = {
        status: dialogueIssues.length > 0 ? 'WARNING' : 'COMPLETE',
        issues: dialogueIssues,
      };
    }

    // 5. LISTENING RULES: >= 1 listening activity
    const listeningCount = draft.listenings.length;
    const listeningIssues: string[] = [];
    if (listeningCount < 1) {
      listeningIssues.push('Cần tạo ít nhất 1 bài tập luyện nghe hiểu.');
      issues.push({
        section: 'listening',
        severity: 'WARNING',
        message: 'Chưa có hoạt động luyện nghe nào.',
      });
      sectionResults.listening = { status: 'INCOMPLETE', issues: listeningIssues };
    } else {
      // Validate each listening item
      const missingAudio = draft.listenings.some((l) => !l.audioUrl || !l.audioUrl.trim());
      if (missingAudio) {
        listeningIssues.push('Một số hoạt động nghe chưa điền đường dẫn hoặc mã âm thanh Audio.');
        sectionResults.listening = { status: 'WARNING', issues: listeningIssues };
      } else {
        sectionResults.listening = { status: 'COMPLETE', issues: [] };
      }
    }

    // 6. PRACTICE RULES: >= 3 exercises with section === 'PRACTICE'
    const practiceExercises = draft.exercises.filter((e) => e.section === 'PRACTICE');
    const practiceIssues: string[] = [];
    if (practiceExercises.length < 3) {
      practiceIssues.push(`Cần tạo tối thiểu 3 bài tập luyện tập tương tác (hiện có: ${practiceExercises.length}/3).`);
      issues.push({
        section: 'practice',
        severity: 'WARNING',
        message: `Phần Luyện tập cần ít nhất 3 bài tập (hiện có: ${practiceExercises.length}).`,
      });
      sectionResults.practice = {
        status: practiceExercises.length === 0 ? 'INCOMPLETE' : 'WARNING',
        issues: practiceIssues,
      };
    } else {
      sectionResults.practice = { status: 'COMPLETE', issues: [] };
    }

    // 7. QUIZ RULES: >= 3 exercises with section === 'QUIZ'
    const quizExercises = draft.exercises.filter((e) => e.section === 'QUIZ');
    const quizIssues: string[] = [];
    if (quizExercises.length < 3) {
      quizIssues.push(`Cần tạo tối thiểu 3 câu hỏi kiểm tra đánh giá (hiện có: ${quizExercises.length}/3).`);
      issues.push({
        section: 'quiz',
        severity: 'WARNING',
        message: `Phần Kiểm tra cần ít nhất 3 câu hỏi (hiện có: ${quizExercises.length}).`,
      });
      sectionResults.quiz = {
        status: quizExercises.length === 0 ? 'INCOMPLETE' : 'WARNING',
        issues: quizIssues,
      };
    } else {
      sectionResults.quiz = { status: 'COMPLETE', issues: [] };
    }

    // Calculate totals
    const totalErrors = issues.filter((i) => i.severity === 'ERROR').length;
    const totalWarnings = issues.filter((i) => i.severity === 'WARNING').length;

    let overallStatus: 'COMPLETE' | 'INCOMPLETE' | 'WARNING' = 'COMPLETE';
    if (totalErrors > 0) {
      overallStatus = 'WARNING';
    } else if (totalWarnings > 0) {
      const anyIncomplete = Object.values(sectionResults).some((r) => r.status === 'INCOMPLETE');
      overallStatus = anyIncomplete ? 'INCOMPLETE' : 'WARNING';
    }

    return {
      overallStatus,
      sections: sectionResults,
      totalErrors,
      totalWarnings,
    };
  }
}

export const lessonValidationService = new LessonValidationService();
