import type { VideoPlayerAdapter, VideoPlaybackState } from '../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;

export function loadYouTubeIFrameAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }
  if (ytApiPromise) {
    return ytApiPromise;
  }

  ytApiPromise = new Promise<void>((resolve, reject) => {
    // Check if script is already present
    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = () => {
        reject(new Error('Failed to load YouTube IFrame API'));
      };
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousReady) previousReady();
      resolve();
    };

    // Polling fallback in case onYouTubeIframeAPIReady already fired
    const interval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(interval);
        resolve();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      if (window.YT && window.YT.Player) {
        resolve();
      } else {
        reject(new Error('YouTube API load timeout'));
      }
    }, 10000);
  });

  return ytApiPromise;
}

export class YouTubeIFrameAdapter implements VideoPlayerAdapter {
  private player: any = null;
  private subscribers: Set<(currentTime: number) => void> = new Set();
  private timerId: any = null;
  private playbackState: VideoPlaybackState = 'unstarted';
  private duration: number = 0;
  private onStateChangeCallback?: (state: VideoPlaybackState) => void;
  private onErrorCallback?: (errorCode: number) => void;
  private isDestroyed = false;

  constructor(
    container: HTMLElement | string,
    videoId: string,
    options?: {
      onReady?: () => void;
      onStateChange?: (state: VideoPlaybackState) => void;
      onError?: (errorCode: number) => void;
    }
  ) {
    this.onStateChangeCallback = options?.onStateChange;
    this.onErrorCallback = options?.onError;
    this.initPlayer(container, videoId, options?.onReady);
  }

  private async initPlayer(
    container: HTMLElement | string,
    videoId: string,
    onReady?: () => void
  ): Promise<void> {
    try {
      await loadYouTubeIFrameAPI();
      if (this.isDestroyed) return;

      this.player = new window.YT.Player(container, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            if (this.isDestroyed) return;
            try {
              this.duration = event.target.getDuration() || 0;
            } catch {
              this.duration = 0;
            }
            if (onReady) onReady();
          },
          onStateChange: (event: any) => {
            if (this.isDestroyed) return;
            this.handleYTStateChange(event.data);
          },
          onError: (event: any) => {
            if (this.isDestroyed) return;
            this.playbackState = 'error';
            this.stopPolling();
            if (this.onErrorCallback) this.onErrorCallback(event.data);
          },
        },
      });
    } catch {
      this.playbackState = 'error';
    }
  }

  private handleYTStateChange(data: number): void {
    if (!window.YT) return;
    switch (data) {
      case window.YT.PlayerState.UNSTARTED:
        this.playbackState = 'unstarted';
        this.stopPolling();
        break;
      case window.YT.PlayerState.PLAYING:
        this.playbackState = 'playing';
        this.startPolling();
        break;
      case window.YT.PlayerState.PAUSED:
        this.playbackState = 'paused';
        this.stopPolling();
        this.emitCurrentTime();
        break;
      case window.YT.PlayerState.BUFFERING:
        this.playbackState = 'buffering';
        break;
      case window.YT.PlayerState.ENDED:
        this.playbackState = 'ended';
        this.stopPolling();
        this.emitCurrentTime();
        break;
      default:
        break;
    }
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.playbackState);
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.emitCurrentTime();
    this.timerId = setInterval(() => {
      this.emitCurrentTime();
    }, 200);
  }

  private stopPolling(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private emitCurrentTime(): void {
    const time = this.getCurrentTime();
    this.subscribers.forEach((cb) => cb(time));
  }

  public play(): void {
    if (this.player && typeof this.player.playVideo === 'function') {
      try {
        this.player.playVideo();
      } catch {}
    }
  }

  public pause(): void {
    if (this.player && typeof this.player.pauseVideo === 'function') {
      try {
        this.player.pauseVideo();
      } catch {}
    }
  }

  public seekTo(seconds: number): void {
    if (this.player && typeof this.player.seekTo === 'function') {
      try {
        this.player.seekTo(seconds, true);
        this.emitCurrentTime();
      } catch {}
    }
  }

  public getCurrentTime(): number {
    if (this.player && typeof this.player.getCurrentTime === 'function') {
      try {
        return this.player.getCurrentTime() || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  public getDuration(): number {
    if (this.player && typeof this.player.getDuration === 'function') {
      try {
        const d = this.player.getDuration();
        if (d > 0) this.duration = d;
      } catch {}
    }
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

  public setPlaybackRate(rate: number): void {
    if (this.player && typeof this.player.setPlaybackRate === 'function') {
      try {
        this.player.setPlaybackRate(rate);
      } catch {}
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.stopPolling();
    this.subscribers.clear();
    if (this.player && typeof this.player.destroy === 'function') {
      try {
        this.player.destroy();
      } catch {}
    }
    this.player = null;
  }
}
