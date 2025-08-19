import { ShipInput } from './ShipSystem';

export class InputSystem {
  private keys: Set<string> = new Set();
  private keysPressed: Set<string> = new Set();
  private keysReleased: Set<string> = new Set();
  private mousePressed: boolean = false;
  private mousePosition: { x: number; y: number } = { x: 0, y: 0 };
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

    // Mouse events for shooting
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left click
        this.mousePressed = true;
        e.preventDefault();
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) { // Left click
        this.mousePressed = false;
        e.preventDefault();
      }
    });

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Mouse movement tracking
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePosition.x = e.clientX - rect.left;
      this.mousePosition.y = e.clientY - rect.top;
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
      fire: this.keys.has('Space') || this.mousePressed,
      bomb: this.keys.has('KeyB'),
      buyBomb: this.keys.has('KeyN'),
      emergencyMelee: this.keys.has('KeyK'),
      reverse: this.keys.has('ArrowDown') || this.keys.has('KeyS')
    };
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

  getMousePosition(): { x: number; y: number } {
    return { ...this.mousePosition };
  }
}