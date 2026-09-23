class AudioMetronome {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private intervalId: number | null = null;
  private bpm: number = 180;
  private onTickCallback?: (tickCount: number) => void;
  private tickCount: number = 0;

  constructor() {
    // Lazy AudioContext initialization
  }

  private initCtx() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public start(spm: number = 180, onTick?: (tickCount: number) => void) {
    this.initCtx();
    this.bpm = spm;
    this.onTickCallback = onTick;
    this.isPlaying = true;
    this.tickCount = 0;

    const intervalMs = (60 / this.bpm) * 1000;

    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }

    this.playClick();
    this.intervalId = window.setInterval(() => {
      this.playClick();
    }, intervalMs);
  }

  public setSpm(spm: number) {
    this.bpm = spm;
    if (this.isPlaying) {
      this.start(spm, this.onTickCallback);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private playClick() {
    if (!this.audioCtx) return;
    try {
      this.tickCount++;
      const isAccent = this.tickCount % 4 === 1;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = isAccent ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isAccent ? 1200 : 880, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.06);

      if (this.onTickCallback) {
        this.onTickCallback(this.tickCount);
      }
    } catch {
      // Audio context might be restricted before user interaction
    }
  }
}

export const metronomeInstance = new AudioMetronome();
