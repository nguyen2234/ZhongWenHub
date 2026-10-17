export type VideoSourceType = 'html5' | 'youtube' | 'preview';

export type VideoPlaybackState =
  | 'unstarted'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'ended'
  | 'error';

/**
 * Common abstraction interface for all video player adapters (HTML5, YouTube IFrame, Preview Fallback)
 */
export interface VideoPlayerAdapter {
  play(): void | Promise<void>;
  pause(): void;
  seekTo(seconds: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  subscribeToTimeUpdates(callback: (currentTime: number) => void): () => void;
  getPlaybackState(): VideoPlaybackState;
  setPlaybackRate?(rate: number): void;
  destroy?(): void;
}

export interface SubtitleToken {
  hanzi: string;
  pinyin: string;
  meaning: string;
  hskLevel?: number;
}

export interface VideoSubtitleLine {
  id: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  tokens?: SubtitleToken[];
}

export interface VideoLessonItem {
  id: string;
  title: string;
  chineseTitle: string;
  hskLevel: number;
  topic: string;
  durationSeconds: number;
  durationLabel: string;
  thumbnailUrl: string;
  videoUrl?: string; // Valid playable MP4/WebM URL
  videoSourceType: VideoSourceType;
  youtubeVideoId?: string; // YouTube Video ID (e.g. '4lHwBZr66so')
  description: string;
  viewCount: number;
  isDemo: boolean;
  source: 'DEMO_DATASET' | 'OFFICIAL_CURRICULUM' | 'YOUTUBE_PODCAST';
  videoStatus?: 'ready' | 'processing' | 'preview_only';
  hasPlayableVideo?: boolean;
  hasCaptions?: boolean;
  hasSpeakingPractice?: boolean;
  externalSourceUrl?: string;
  sourceNote?: string;
  isVerified?: boolean;
  licenseInfo?: string;
  subtitles: VideoSubtitleLine[];
}

export type VideoFilterLevel = 'all' | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type VideoTopicFilter =
  | 'all'
  | 'daily'
  | 'travel'
  | 'food'
  | 'grammar'
  | 'hsk-exam'
  | 'culture'
  | 'podcast';
export type VideoSourceFilter = 'all' | 'playable' | 'youtube' | 'html5';
