/**
 * Phase FE-1 & FE-2 Automated Test Suite
 * Validates Student Dashboard Refinement, Professional AI Tutor Workspace,
 * Voice Session State Machine, Barge-In Interruption, and HSK 7-9 Support.
 */

import { VoiceSessionController } from '../features/ai-tutor/services/voice/VoiceSessionController';
import { AITutorService } from '../features/ai-tutor/services/AITutorService';
import { hskLevelIdToNumber, hskNumberToLevelId } from '../utils/hsk.utils';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`[PASS] ${msg}`);
    passed++;
  } else {
    console.error(`[FAIL] ${msg}`);
    failed++;
  }
}

async function runTests() {
  console.log('=== STARTING PHASE FE-1 & FE-2 AI TUTOR WORKSPACE TESTS ===\n');

  // TEST 01: Voice Session Controller initializes in IDLE state
  const controller = new VoiceSessionController();
  assert(controller.getState() === 'IDLE', 'TEST 01: VoiceSessionController initializes in IDLE state');
  assert(controller.getTurns().length === 0, 'TEST 02: Initial turns array is empty');
  assert(controller.getMetrics().interruptionCount === 0, 'TEST 03: Initial interruption count is 0');

  // TEST 04: Starting session transitions to SPEAKING and generates assistant greeting
  await controller.startSession('daily_conversation', 'Gọi đồ uống tại quán cà phê', 2);
  assert(controller.getState() === 'SPEAKING', 'TEST 04: startSession transitions to SPEAKING');
  assert(controller.getTurns().length === 1, 'TEST 05: Session starts with 1 greeting turn');
  assert(controller.getTurns()[0].speaker === 'assistant', 'TEST 06: Initial speaker is assistant');
  assert(controller.getTurns()[0].hanzi.includes('你想喝点什么'), 'TEST 07: Greeting contains scenario text');

  // TEST 08: Barge-in interruption
  controller.interruptAssistant();
  assert(controller.getState() === 'INTERRUPTED', 'TEST 08: interruptAssistant immediately sets state to INTERRUPTED');
  assert(controller.getMetrics().interruptionCount === 1, 'TEST 09: Interruption count is incremented to 1');

  // Wait for transition to LISTENING
  await new Promise((resolve) => setTimeout(resolve, 250));
  assert(controller.getState() === 'LISTENING', 'TEST 10: State swiftly snaps to LISTENING after interruption');

  // TEST 11: Stale playback prevention
  const currentCount = controller.getTurns().length;
  controller.cancelPlayback();
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert(controller.getTurns().length === currentCount, 'TEST 11: Stale speech timeout cannot append zombie turns');

  // TEST 12: Pause and resume session
  controller.pauseSession();
  assert(controller.getState() === 'PAUSED', 'TEST 12: pauseSession transitions state to PAUSED');
  controller.resumeSession();
  assert(controller.getState() === 'LISTENING', 'TEST 13: resumeSession restores LISTENING state');

  // TEST 14: Simulated user utterance and assistant response
  controller.sendUserUtterance({
    hanzi: '我要一杯冰美式咖啡。',
    pinyin: 'Wǒ yào yībēi bīng měishì kāfēi.',
    vietnamese: 'Tôi muốn một ly Americano đá.',
  });
  assert(controller.getState() === 'PROCESSING', 'TEST 14: User utterance transitions state to PROCESSING');
  assert(controller.getTurns().length === 2, 'TEST 15: User utterance appended to turn history');
  assert(controller.getTurns()[1].speaker === 'user', 'TEST 16: Turn speaker is correctly user');

  // Wait for AI response processing (~1.3s)
  await new Promise((resolve) => setTimeout(resolve, 1350));
  assert(controller.getState() === 'SPEAKING', 'TEST 17: AI synthesizes response and transitions to SPEAKING');
  assert(controller.getTurns().length === 3, 'TEST 18: Assistant turn appended to history');
  assert(controller.getTurns()[2].speaker === 'assistant', 'TEST 19: Turn speaker is assistant');

  // TEST 20: Stop session and honest post-session review data
  const review = controller.stopSession();
  assert(controller.getState() === 'ENDED', 'TEST 20: stopSession transitions state to ENDED');
  assert(review.isDemoEvaluation === true, 'TEST 21: Review explicitly marks evaluation as demo');
  assert(review.vocabularyPracticed.length > 0, 'TEST 22: Review captures vocabulary practiced');
  assert(review.grammarPointsObserved.length > 0, 'TEST 23: Review captures grammar points observed');
  assert(review.turnCount === 3, 'TEST 24: Turn count matches recorded turns');

  // TEST 25: AITutorService Chat Generation for practice errors
  const errResponse = await AITutorService.sendChatMessage({
    conversationId: 'test-conv-1',
    message: 'Tại sao câu của tôi sai?',
    mode: 'EXPLAIN',
    context: {
      source: 'practice',
      hskLevel: 2,
      exerciseContext: {
        exerciseId: 'ex-101',
        question: 'Điền từ thích hợp vào chỗ trống',
        userAnswer: 'shì',
        correctAnswer: '想 (xiǎng)',
        promptHanzi: '我 ___ 喝茶。',
      },
    },
  });
  assert(errResponse.type === 'structured', 'TEST 25: AITutorService returns structured response');
  assert(errResponse.blocks.length > 0, 'TEST 26: Response contains structured learning blocks');
  assert(errResponse.suggestedActions.length > 0, 'TEST 27: Response provides suggested prompt actions');

  // TEST 28: AITutorService Sentence Correction
  const corrResponse = await AITutorService.sendChatMessage({
    conversationId: 'test-conv-2',
    message: 'Sửa giúp tôi câu này: 我想喝咖啡了',
    mode: 'CORRECT',
    context: {
      source: 'dashboard',
      hskLevel: 2,
    },
  });
  const hasCorrection = corrResponse.blocks.some((b) => b.type === 'correction');
  assert(hasCorrection, 'TEST 28: AITutorService returns correction block for sentence review');

  // TEST 29: HSK 7-9 Level Support
  assert(hskLevelIdToNumber('level-hsk-79') === 7, 'TEST 29: level-hsk-79 resolves to level 7');
  assert(hskLevelIdToNumber('hsk7-9') === 7, 'TEST 30: hsk7-9 resolves to level 7');
  assert(hskNumberToLevelId(7) === 'level-hsk-79', 'TEST 31: Numeric level 7 maps to level-hsk-79');
  assert(hskNumberToLevelId(8) === 'level-hsk-79', 'TEST 32: Numeric level 8 maps to level-hsk-79');
  assert(hskNumberToLevelId(9) === 'level-hsk-79', 'TEST 33: Numeric level 9 maps to level-hsk-79');

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    throw new Error(`${failed} tests failed`);
  }
}

runTests().catch((e) => {
  console.error(e);
});
