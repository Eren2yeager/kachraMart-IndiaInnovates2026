import { WasteType } from '@/types';

/**
 * Environmental conversion factors for calculating CO₂ savings and landfill diversion
 * Based on industry-standard estimates for waste recycling impact
 */
export const CONVERSION_FACTORS = {
  /**
   * CO₂ savings per kilogram of waste recycled (kg CO₂/kg waste)
   */
  co2Savings: {
    biodegradable: 0.5,  // Composting vs landfill methane emissions
    recyclable: 2.5,     // Manufacturing savings from recycled materials
    hazardous: 0,        // Requires special handling, no CO₂ benefit
    ewaste: 3.0,         // High energy savings from metal/component recovery
    construction: 1.0    // Reduced extraction and processing
  } as Record<WasteType, number>,

  /**
   * Landfill diversion eligibility by waste type
   * True if the waste type can be diverted from landfills through recycling/composting
   */
  landfillDiversion: {
    biodegradable: true,  // Can be composted
    recyclable: true,     // Can be recycled
    hazardous: false,     // Requires special disposal
    ewaste: true,         // Can be recycled for components
    construction: false   // Often requires special disposal
  } as Record<WasteType, boolean>
} as const;
