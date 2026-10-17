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
  videoUrl?: string; // YouTube or MP4 url (sample video)
  description: string;
  viewCount: number;
  isDemo: true;
  source: 'DEMO_DATASET';
  subtitles: VideoSubtitleLine[];
}

export type VideoFilterLevel = 'all' | 1 | 2 | 3 | 4 | 5 | 6;
export type VideoTopicFilter = 'all' | 'daily' | 'travel' | 'food' | 'hsk-exam' | 'culture';
