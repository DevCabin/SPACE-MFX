import { Vector2D, Ship } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';

export class CameraSystem {
  private static readonly FOLLOW_SPEED = 2;

  static updateCamera(camera: Vector2D, ship: Ship, deltaTime: number): void {
    // Smooth camera following
    const targetX = ship.position.x;
    const targetY = ship.position.y;
    
    camera.x = MathUtils.lerp(camera.x, targetX, this.FOLLOW_SPEED * deltaTime);
    camera.y = MathUtils.lerp(camera.y, targetY, this.FOLLOW_SPEED * deltaTime);
  }

  static worldToScreen(worldPos: Vector2D, camera: Vector2D, canvas: HTMLCanvasElement): Vector2D {
    return {
      x: worldPos.x - camera.x + canvas.width / 2,
      y: worldPos.y - camera.y + canvas.height / 2
    };
  }

  static screenToWorld(screenPos: Vector2D, camera: Vector2D, canvas: HTMLCanvasElement): Vector2D {
    return {
      x: screenPos.x + camera.x - canvas.width / 2,
      y: screenPos.y + camera.y - canvas.height / 2
    };
  }
}