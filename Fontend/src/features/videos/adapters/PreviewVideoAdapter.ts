import type { VideoPlayerAdapter, VideoPlaybackState } from '../types';

export class PreviewVideoAdapter implements VideoPlayerAdapter {
  private currentTime = 0;
  private duration: number;
  private subscribers: Set<(currentTime: number) => void> = new Set();
  private playbackState: VideoPlaybackState = 'paused';

  constructor(initialDuration = 180) {
    this.duration = initialDuration;
  }

  public play(): void {
    this.playbackState = 'playing';
  }

  public pause(): void {
    this.playbackState = 'paused';
  }

  public seekTo(seconds: number): void {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));
    this.subscribers.forEach((cb) => cb(this.currentTime));
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration;
  }

  public subscribeToTimeUpdates(callback: (currentTime: number) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public getPlaybackState(): VideoPlaybackState {
    return this.playbackState;
  }

  public setPlaybackRate(_rate: number): void {
    // No-op for preview mode
  }

  public destroy(): void {
    this.subscribers.clear();
  }
}
