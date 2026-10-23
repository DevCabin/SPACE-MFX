import { ShipInput } from './ShipSystem';

export class InputSystem {
  private keys: Set<string> = new Set();
  private keysPressed: Set<string> = new Set();
  private keysReleased: Set<string> = new Set();
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Make canvas focusable
    this.canvas.tabIndex = 0;
    this.canvas.focus();

    this.canvas.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) {
        this.keysPressed.add(e.code);
      }
      this.keys.add(e.code);
      // Always prevent default to keep focus in game
      e.preventDefault();
    });

    this.canvas.addEventListener('keyup', (e) => {
      this.keysReleased.add(e.code);
      this.keys.delete(e.code);
      e.preventDefault();
    });


    // Ensure canvas stays focused
    this.canvas.addEventListener('blur', () => {
      this.canvas.focus();
    });
  }

  getShipInput(): ShipInput {
    return {
      thrust: this.keys.has('ArrowUp') || this.keys.has('KeyW'),
      rotateLeft: this.keys.has('ArrowLeft') || this.keys.has('KeyA'),
      rotateRight: this.keys.has('ArrowRight') || this.keys.has('KeyD'),
      fire: this.keys.has('Space'),
      bomb: this.keys.has('KeyB'),
      buyBomb: this.keys.has('KeyN'),
      emergencyMelee: this.keys.has('KeyK'),
      reverse: this.keys.has('ArrowDown') || this.keys.has('KeyS')
    };
  }

  // Add method to handle leaderboard key press
  handleLeaderboardInput(): boolean {
    if (this.wasKeyJustPressed('KeyX')) {
      return true; // Signal to toggle leaderboard
    }
    return false;
  }

  // Get a single printable character that was just pressed (for text input like name entry)
  getJustPressedKey(): string | null {
    // Letter keys
    for (let i = 0; i < 26; i++) {
      const code = `Key${String.fromCharCode(65 + i)}`;
      if (this.wasKeyJustPressed(code)) {
        return String.fromCharCode(97 + i); // lowercase letter
      }
    }
    // Digit keys
    for (let i = 0; i < 10; i++) {
      const code = `Digit${i}`;
      if (this.wasKeyJustPressed(code)) {
        return String(i);
      }
    }
    // Space
    if (this.wasKeyJustPressed('Space')) {
      return ' ';
    }
    return null;
  }

  isKeyPressed(key: string): boolean {
    return this.keys.has(key);
  }

  wasKeyJustPressed(key: string): boolean {
    return this.keysPressed.has(key);
  }

  wasKeyJustReleased(key: string): boolean {
    return this.keysReleased.has(key);
  }

  clearFrameInput(): void {
    this.keysPressed.clear();
    this.keysReleased.clear();
  }
}
