/**
 * Web Audio Engine for Studio Playback & Video Export
 * Handles background music synthesis, voiceover playback, ducking, and audio stream routing.
 */

export class VideoAudioEngine {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isBgmPlaying = false;
  private currentVoiceSource: AudioBufferSourceNode | null = null;
  private currentVoiceElement: HTMLAudioElement | null = null;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmIntervalId: any = null;
  private mediaStreamDestination: MediaStreamAudioDestinationNode | null = null;

  constructor() {
    // AudioContext will be initialized on user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.25;

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.value = 0.95;

      this.mediaStreamDestination = this.ctx.createMediaStreamDestination();

      // Route to both speaker output and capture stream
      this.bgmGain.connect(this.masterGain);
      this.voiceGain.connect(this.masterGain);

      this.masterGain.connect(this.ctx.destination);
      this.masterGain.connect(this.mediaStreamDestination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAudioStream(): MediaStreamTrack | null {
    this.initContext();
    if (this.mediaStreamDestination) {
      const tracks = this.mediaStreamDestination.stream.getAudioTracks();
      return tracks[0] || null;
    }
    return null;
  }

  public setBgmVolume(volume: number) {
    this.initContext();
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public setVoiceVolume(volume: number) {
    this.initContext();
    if (this.voiceGain && this.ctx) {
      this.voiceGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  /**
   * Starts ambient cinematic background synth chord progression
   */
  public startBgm(theme: 'epic' | 'tech' | 'calm' | 'cinematic' = 'cinematic') {
    this.initContext();
    if (this.isBgmPlaying || !this.ctx || !this.bgmGain) return;

    this.isBgmPlaying = true;

    // Chords definitions (frequencies in Hz)
    const chordProgressions: Record<string, number[][]> = {
      cinematic: [
        [130.81, 196.0, 261.63, 392.0], // C minor / cinematic pad
        [116.54, 174.61, 233.08, 349.23], // Bb
        [103.83, 155.56, 207.65, 311.13], // Ab
        [98.0, 146.83, 196.0, 293.66], // G
      ],
      tech: [
        [146.83, 220.0, 293.66, 440.0], // D minor / tech
        [130.81, 196.0, 261.63, 392.0], // C
        [110.0, 164.81, 220.0, 329.63], // A
        [123.47, 185.0, 246.94, 370.0], // B
      ],
      calm: [
        [130.81, 164.81, 196.0, 246.94], // C maj7
        [110.0, 130.81, 164.81, 220.0], // A min7
        [87.31, 130.81, 174.61, 220.0], // F maj7
        [98.0, 123.47, 146.83, 196.0], // G
      ],
      epic: [
        [110.0, 164.81, 220.0, 277.18], // A
        [130.81, 196.0, 261.63, 329.63], // C
        [98.0, 146.83, 196.0, 246.94], // G
        [146.83, 220.0, 293.66, 370.0], // D
      ],
    };

    const chords = chordProgressions[theme] || chordProgressions.cinematic;
    let chordIndex = 0;

    const playChord = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;

      // Stop previous active oscillators
      this.bgmOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {}
      });
      this.bgmOscillators = [];

      const currentNotes = chords[chordIndex % chords.length];
      chordIndex++;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, this.ctx.currentTime);
      filter.connect(this.bgmGain);

      currentNotes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // Soft attack and decay envelope
        noteGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        noteGain.gain.linearRampToValueAtTime(0.18 / currentNotes.length, this.ctx.currentTime + 1.2);
        noteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 4.9);

        osc.connect(noteGain);
        noteGain.connect(filter);

        osc.start();
        osc.stop(this.ctx.currentTime + 5.0);
        this.bgmOscillators.push(osc);
      });
    };

    playChord();
    this.bgmIntervalId = setInterval(playChord, 4800);
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.bgmOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.bgmOscillators = [];
  }

  /**
   * Play narration audio (WAV data URI from Gemini TTS or fallback)
   */
  public async playVoiceAudio(audioUrl: string): Promise<void> {
    this.initContext();
    this.stopVoice();

    return new Promise((resolve) => {
      try {
        const audio = new Audio(audioUrl);
        this.currentVoiceElement = audio;

        if (this.ctx && this.voiceGain) {
          try {
            const source = this.ctx.createMediaElementSource(audio);
            source.connect(this.voiceGain);
          } catch (e) {
            // Already connected or browser policy
          }
        }

        // Apply audio ducking to BGM while voice plays
        if (this.bgmGain && this.ctx) {
          this.bgmGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.3);
        }

        audio.onended = () => {
          if (this.bgmGain && this.ctx) {
            this.bgmGain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.5);
          }
          resolve();
        };

        audio.onerror = () => {
          resolve();
        };

        audio.play().catch(() => {
          resolve();
        });
      } catch (e) {
        resolve();
      }
    });
  }

  /**
   * Web Speech API fallback when no Gemini TTS audio is available
   */
  public speakFallback(text: string, language: string = 'ko-KR'): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        setTimeout(resolve, 2000);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select Korean voice if available
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) => v.lang.startsWith(language.slice(0, 2)));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  public stopVoice() {
    if (this.currentVoiceElement) {
      try {
        this.currentVoiceElement.pause();
        this.currentVoiceElement.currentTime = 0;
      } catch (e) {}
      this.currentVoiceElement = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.3);
    }
  }

  public stopAll() {
    this.stopBgm();
    this.stopVoice();
  }
}

export const studioAudioEngine = new VideoAudioEngine();
