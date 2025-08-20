import { Particle, Vector2D } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';

export class ParticleSystem {
  static createExplosionParticles(position: Vector2D, count: number = 8): Particle[] {
    const particles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = MathUtils.randomBetween(50, 150);
      const size = MathUtils.randomBetween(2, 6);
      
      particles.push({
        id: MathUtils.generateId(),
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        color: this.getExplosionColor(),
        size,
        life: 1.0,
        maxLife: 1.0,
        type: 'explosion'
      });
    }
    
    return particles;
  }

  static createCollectionParticles(position: Vector2D, resourceType: 'rawMaterial' | 'powerGem'): Particle[] {
    const particles: Particle[] = [];
    const count = 6;
    const color = resourceType === 'rawMaterial' ? '#6699cc' : '#ff8800';
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = MathUtils.randomBetween(30, 80);
      
      particles.push({
        id: MathUtils.generateId(),
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        color,
        size: MathUtils.randomBetween(1, 3),
        life: 0.8,
        maxLife: 0.8,
        type: 'collection'
      });
    }
    
    return particles;
  }

  static createSparkParticles(position: Vector2D, direction: Vector2D, count: number = 4): Particle[] {
    const particles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      const spread = 0.5; // Spread angle in radians
      const baseAngle = Math.atan2(direction.y, direction.x);
      const angle = baseAngle + (Math.random() - 0.5) * spread;
      const speed = MathUtils.randomBetween(80, 120);
      
      particles.push({
        id: MathUtils.generateId(),
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        color: '#ffff88',
        size: MathUtils.randomBetween(1, 2),
        life: 0.3,
        maxLife: 0.3,
        type: 'spark'
      });
    }
    
    return particles;
  }

  static updateParticles(particles: Particle[], deltaTime: number): void {
    for (const particle of particles) {
      // Update position
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      
      // Apply friction/gravity
      particle.velocity.x *= 0.95;
      particle.velocity.y *= 0.95;
      
      // Update life
      particle.life -= deltaTime;
    }
  }

  static removeDeadParticles(particles: Particle[]): Particle[] {
    return particles.filter(particle => particle.life > 0);
  }

  private static getExplosionColor(): string {
    const colors = ['#ff6600', '#ff8800', '#ffaa00', '#ff4400', '#cc3300'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}