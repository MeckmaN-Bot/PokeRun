import type { TrainerGender } from '../types';

const TRAINER_SPRITES: Record<TrainerGender, string> = {
  male: 'https://play.pokemonshowdown.com/sprites/trainers/red.png',
  female: 'https://play.pokemonshowdown.com/sprites/trainers/leaf-gen3.png',
};

export const TRAINER_NAMES: Record<TrainerGender, string> = {
  male: 'Red',
  female: 'Leaf',
};

export function getTrainerSprite(gender: TrainerGender): string {
  return TRAINER_SPRITES[gender];
}
