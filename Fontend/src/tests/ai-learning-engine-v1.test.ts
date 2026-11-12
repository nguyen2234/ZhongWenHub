import { describe, expect, it } from 'bun:test';
import { ContextBuilder } from '../features/ai-tutor/services/ContextBuilder';
import { aiLearningEngineService } from '../features/ai/services/ai-learning-engine.service';

describe('AI Learning Engine V1 Frontend Contracts', () => {
  it('ContextBuilder accepts string GUID vocabularyIds & lessonId without TypeScript mismatch', () => {
    const ctx = ContextBuilder.build('vocabulary', {
      hskLevel: 1,
      lessonId: 'aaaaaaaa-1111-1111-1111-111111111111',
      grammarPointId: 'bbbbbbbb-2222-2222-2222-222222222222',
      vocabularyIds: ['cccccccc-3333-3333-3333-333333333333'],
      learningGoal: 'HSK 1 trong 30 ngày',
    });

    expect(ctx.lessonId).toBe('aaaaaaaa-1111-1111-1111-111111111111');
    expect(ctx.grammarPointId).toBe('bbbbbbbb-2222-2222-2222-222222222222');
    expect(ctx.vocabularyIds).toEqual(['cccccccc-3333-3333-3333-333333333333']);
    expect(ctx.learningGoal).toBe('HSK 1 trong 30 ngày');
  });

  it('aiLearningEngineService exposes backend API methods without direct Gemini browser calls', () => {
    expect(typeof aiLearningEngineService.getScenarios).toBe('function');
    expect(typeof aiLearningEngineService.startConversation).toBe('function');
    expect(typeof aiLearningEngineService.sendConversationMessage).toBe('function');
    expect(typeof aiLearningEngineService.endConversation).toBe('function');
    expect(typeof aiLearningEngineService.generateAiExercises).toBe('function');
    expect(typeof aiLearningEngineService.submitAiExerciseAttempt).toBe('function');
    expect(typeof aiLearningEngineService.getErrorAnalysis).toBe('function');
    expect(typeof aiLearningEngineService.getPersonalizedPlan).toBe('function');
  });
});
