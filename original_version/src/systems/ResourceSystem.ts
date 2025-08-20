import { Ship, ResourceDrop } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';
import { ShipSystem } from './ShipSystem';

export class ResourceSystem {
  private static readonly ATTRACTION_RADIUS = 80; // Radius for resource attraction
  private static readonly ATTRACTION_FORCE = 150; // Force of attraction

  static checkResourceCollection(ship: Ship, resourceDrops: ResourceDrop[]): ResourceDrop[] {
    const collected: ResourceDrop[] = [];
    
    for (const resource of resourceDrops) {
      if (resource.collected) continue;

      const distance = MathUtils.distance(
        ship.position, resource.position
      );

      if (distance < ship.radius + resource.radius) {
        // Always try to add resource - let addResource handle the logic
        if (ShipSystem.addResource(ship, resource.type)) {
          resource.collected = true;
          collected.push(resource);
        }
      }
    }
    
    return collected;
  }

  static removeCollectedResources(resourceDrops: ResourceDrop[]): ResourceDrop[] {
    return resourceDrops.filter(resource => !resource.collected);
  }

  static updateResourceDrops(resourceDrops: ResourceDrop[], deltaTime: number): void {
    for (const resource of resourceDrops) {
      if (resource.collected) continue;
      
      // Update position based on velocity
      resource.position.x += resource.velocity.x * deltaTime;
      resource.position.y += resource.velocity.y * deltaTime;
      
      // Apply friction to gradually slow down the drift
      resource.velocity.x *= 0.98;
      resource.velocity.y *= 0.98;
    }
  }

  static updateResourceAttraction(resourceDrops: ResourceDrop[], ship: Ship, deltaTime: number): void {
    for (const resource of resourceDrops) {
      if (resource.collected) continue;
      
      const distance = MathUtils.distance(resource.position, ship.position);
      
      // If within attraction radius, pull toward ship
      if (distance <= this.ATTRACTION_RADIUS && distance > 0) {
        const direction = {
          x: ship.position.x - resource.position.x,
          y: ship.position.y - resource.position.y
        };
        const normalized = MathUtils.normalize(direction);
        
        // Stronger attraction when closer (inverse square falloff)
        const attractionStrength = this.ATTRACTION_FORCE * (1 - (distance / this.ATTRACTION_RADIUS));
        
        // Apply attraction force to velocity
        resource.velocity.x += normalized.x * attractionStrength * deltaTime;
        resource.velocity.y += normalized.y * attractionStrength * deltaTime;
      }
    }
  }
}