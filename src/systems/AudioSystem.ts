export class AudioSystem {
  private static audioContext: AudioContext | null = null;
  private static enabled: boolean = true;

  static initialize(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Audio not supported');
      this.enabled = false;
    }
  }

  static playMiningHit(): void {
    if (!this.enabled || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  static playResourceCollection(): void {
    if (!this.enabled || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  static playEnemyDestruction(): void {
    if (!this.enabled || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    // Use white noise for a more organic "poof" or "crunch" sound
    const noiseBuffer = this.audioContext.createBuffer(1, 4096, this.audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const bandpassFilter = this.audioContext.createBiquadFilter();
    bandpassFilter.type = 'bandpass';
    bandpassFilter.frequency.setValueAtTime(500, this.audioContext.currentTime);
    bandpassFilter.Q.setValueAtTime(10, this.audioContext.currentTime);
    
    noiseSource.connect(bandpassFilter);
    bandpassFilter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Softer, shorter sound with quick decay
    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
    
    noiseSource.start();
    noiseSource.stop(this.audioContext.currentTime + 0.1);
  }

  static playWeaponFire(): void {
    if (!this.enabled || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0.03, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  static playSpaceMonsterWarning(): void {
    if (!this.enabled || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Sci-fi warning horn - low to high sweep
    oscillator.frequency.setValueAtTime(120, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.3);
    oscillator.frequency.exponentialRampToValueAtTime(180, this.audioContext.currentTime + 0.6);
    
    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.12, this.audioContext.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.6);
  }

  static playCosmicEggHeartbeat(): void {
    if (!this.enabled || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Deep, ominous heartbeat thud - lower frequency than mining hit
    oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.2);
    oscillator.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.4);
    
    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, this.audioContext.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.4);
  }
}
