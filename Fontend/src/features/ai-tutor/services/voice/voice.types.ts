/**
 * Voice Service Contracts & State Definitions for AI Tutor Live Mode
 * ZhongWenHub EdTech Platform
 */

export type VoiceSessionState =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'SPEAKING'
  | 'INTERRUPTED'
  | 'PAUSED'
  | 'ENDED'
  | 'ERROR';

export type VoiceSessionMode =
  | 'free_talk'
  | 'daily_conversation'
  | 'roleplay'
  | 'hsk_speaking';

export interface VoiceTurn {
  id: string;
  speaker: 'user' | 'assistant';
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  timestamp: string;
  audioDurationSec?: number;
}

export interface GuidedResponseSuggestion {
  id: string;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
}

export interface UsefulVocabItem {
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  hskLevel?: number;
}

export interface VoiceSessionMetrics {
  sessionId: string;
  mode: VoiceSessionMode;
  topic: string;
  hskLevel: number;
  durationSeconds: number;
  turnCount: number;
  interruptionCount: number;
  vocabularyPracticed: UsefulVocabItem[];
  grammarPointsObserved: string[];
}

export interface VoiceSessionReviewData extends VoiceSessionMetrics {
  completedAt: string;
  feedbackSummary: string;
  /**
   * Clearly marked as demonstration/sample score to avoid fabricating real AI evaluation.
   */
  isDemoEvaluation: boolean;
  demoPronunciationScore?: number;
  suggestedNextPractice: string;
}

export interface AudioInputConfig {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
}

export interface AudioInputAdapter {
  startRecording(config?: AudioInputConfig): Promise<MediaStream | null>;
  stopRecording(): Promise<void>;
  isRecording(): boolean;
}

export interface SpeechRecognitionResult {
  transcript: string;
  pinyin?: string;
  isFinal: boolean;
  confidence: number;
}

export interface SpeechRecognitionAdapter {
  start(onResult: (result: SpeechRecognitionResult) => void, onError: (error: Error) => void): void;
  stop(): void;
  isRecognizing(): boolean;
}

export interface VoiceActivityDetector {
  start(stream: MediaStream, onSpeechStart: () => void, onSpeechEnd: () => void): void;
  stop(): void;
  isActive(): boolean;
}

export interface SpeechPlaybackAdapter {
  playSpeech(text: string, onEnded?: () => void): Promise<void>;
  stopSpeech(): void;
  isPlaying(): boolean;
}

export interface RealtimeConversationAdapter {
  connect(sessionId: string): Promise<void>;
  disconnect(): Promise<void>;
  sendAudioChunk(chunk: ArrayBuffer): void;
  onAudioReceived(handler: (audio: ArrayBuffer) => void): void;
  onTranscriptReceived(handler: (turn: VoiceTurn) => void): void;
}
