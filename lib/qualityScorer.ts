import { IWasteInventory } from '@/types';

/**
 * Calculates a quality score (0-100) for waste inventory based on:
 * - Verification status (+20 points)
 * - Large quantity bonus (+10 points for quantity > 100 kg)
 * - Freshness bonus (+15 points for inventory < 7 days old)
 * 
 * Base score: 50
 * Maximum score: 100
 */
export function calculateQualityScore(inventory: IWasteInventory): number {
  let score = 50; // Base score

  // Verified inventory bonus
  if (inventory.verified) {
    score += 20;
  }

  // Large quantity bonus
  if (inventory.quantity > 100) {
    score += 10;
  }

  // Freshness bonus (stored < 7 days)
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(inventory.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreation < 7) {
    score += 15;
  }

  return Math.min(100, score);
}
