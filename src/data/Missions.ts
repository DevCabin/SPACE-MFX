import { Mission } from '../types/GameTypes';

export const MISSIONS: Mission[] = [
  {
    id: 'mine',
    name: 'Mining Operation',
    description: 'Extract all valuable resources from the asteroid field. Clear every asteroid to complete the mission.',
    objective: 'Mine all asteroids in the sector',
    victoryCondition: 'allAsteroidsMined'
  },
  {
    id: 'fight',
    name: 'Extermination Protocol',
    description: 'Eliminate all hostile threats in the sector. Destroy all space monsters and enemy forces.',
    objective: 'Destroy all space monsters and enemies',
    victoryCondition: 'allEnemiesDefeated'
  },
  {
    id: 'explore',
    name: 'Colonial Expansion',
    description: 'Establish dominance over the sector by claiming and fortifying all planetary bodies.',
    objective: 'Colonize all planets in the sector',
    victoryCondition: 'allPlanetsColonized'
  }
];