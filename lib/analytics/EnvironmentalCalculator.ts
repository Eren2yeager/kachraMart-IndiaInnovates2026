import { WasteType } from '@/types';
import { CONVERSION_FACTORS } from './conversionFactors';

export class EnvironmentalCalculator {
  /**
   * Calculate CO₂ savings from waste recycling
   * @param wasteByType - Waste quantities by type
   * @returns Total CO₂ saved in kilograms
   */
  calculateCO2Savings(wasteByType: Record<WasteType, number>): number {
    let totalCO2 = 0;
    
    for (const [type, quantity] of Object.entries(wasteByType)) {
      const factor = CONVERSION_FACTORS.co2Savings[type as WasteType];
      totalCO2 += quantity * factor;
    }
    
    return Math.round(totalCO2 * 100) / 100; // Round to 2 decimals
  }

  /**
   * Calculate landfill diversion metrics
   * @param wasteByType - Waste quantities by type
   * @returns Object with diverted quantity and percentage
   */
  calculateLandfillDiversion(wasteByType: Record<WasteType, number>): {
    diverted: number;
    percentage: number;
  } {
    let diverted = 0;
    let total = 0;
    
    for (const [type, quantity] of Object.entries(wasteByType)) {
      total += quantity;
      if (CONVERSION_FACTORS.landfillDiversion[type as WasteType]) {
        diverted += quantity;
      }
    }
    
    const percentage = total > 0 ? (diverted / total) * 100 : 0;
    
    return {
      diverted: Math.round(diverted * 100) / 100,
      percentage: Math.round(percentage * 100) / 100
    };
  }
}
