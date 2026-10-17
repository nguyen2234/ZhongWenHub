import type { VideoPlayerAdapter, VideoPlaybackState } from '../types';

export class Html5VideoAdapter implements VideoPlayerAdapter {
  private videoEl: HTMLVideoElement | null = null;
  private subscribers: Set<(currentTime: number) => void> = new Set();
  private playbackState: VideoPlaybackState = 'unstarted';

  constructor(videoElement: HTMLVideoElement | null) {
    this.videoEl = videoElement;
    this.bindEvents();
  }

  public setVideoElement(el: HTMLVideoElement | null): void {
    this.unbindEvents();
    this.videoEl = el;
    this.bindEvents();
  }

  private handleTimeUpdate = () => {
    if (!this.videoEl) return;
    const time = this.videoEl.currentTime;
    this.subscribers.forEach((cb) => cb(time));
  };

  private handlePlay = () => {
    this.playbackState = 'playing';
  };

  private handlePause = () => {
    this.playbackState = 'paused';
  };

  private handleWaiting = () => {
    this.playbackState = 'buffering';
  };

  private handleEnded = () => {
    this.playbackState = 'ended';
  };

  private handleError = () => {
    this.playbackState = 'error';
  };

  private bindEvents(): void {
    if (!this.videoEl) return;
    this.videoEl.addEventListener('timeupdate', this.handleTimeUpdate);
    this.videoEl.addEventListener('play', this.handlePlay);
    this.videoEl.addEventListener('pause', this.handlePause);
    this.videoEl.addEventListener('waiting', this.handleWaiting);
    this.videoEl.addEventListener('ended', this.handleEnded);
    this.videoEl.addEventListener('error', this.handleError);
  }

  private unbindEvents(): void {
    if (!this.videoEl) return;
    this.videoEl.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.videoEl.removeEventListener('play', this.handlePlay);
    this.videoEl.removeEventListener('pause', this.handlePause);
    this.videoEl.removeEventListener('waiting', this.handleWaiting);
    this.videoEl.removeEventListener('ended', this.handleEnded);
    this.videoEl.removeEventListener('error', this.handleError);
  }

  public play(): void | Promise<void> {
    if (!this.videoEl) return;
    return this.videoEl.play();
  }

  public pause(): void {
    if (!this.videoEl) return;
    this.videoEl.pause();
  }

  public seekTo(seconds: number): void {
    if (!this.videoEl) return;
    const clamped = Math.max(0, Math.min(seconds, this.getDuration() || seconds));
    this.videoEl.currentTime = clamped;
    this.handleTimeUpdate();
  }

  public getCurrentTime(): number {
    return this.videoEl ? this.videoEl.currentTime : 0;
  }

  public getDuration(): number {
    return this.videoEl && !isNaN(this.videoEl.duration) ? this.videoEl.duration : 0;
  }

  public subscribeToTimeUpdates(callback: (currentTime: number) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public getPlaybackState(): VideoPlaybackState {
    if (!this.videoEl) return 'unstarted';
    if (this.videoEl.error) return 'error';
    if (this.videoEl.seeking) return 'buffering';
    if (this.videoEl.ended) return 'ended';
    return this.playbackState;
  }

  public setPlaybackRate(rate: number): void {
    if (this.videoEl) {
      this.videoEl.playbackRate = rate;
    }
  }

  public destroy(): void {
    this.unbindEvents();
    this.subscribers.clear();
    this.videoEl = null;
  }
}
