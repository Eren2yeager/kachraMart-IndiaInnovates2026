import { WasteType } from '@/types';

// Waste category mapping from detected items to waste types
const wasteCategoryMap: Record<string, WasteType> = {
  // RECYCLABLE
  'plastic-bottle': 'recyclable',
  'plastic-bag': 'recyclable',
  'metal-can': 'recyclable',
  'cardboard': 'recyclable',
  'paper': 'recyclable',

  // BIODEGRADABLE
  'food': 'biodegradable',
  'fruit': 'biodegradable',
  'vegetable': 'biodegradable',
  'egg-shell': 'biodegradable',
  'garden-leaves': 'biodegradable',

  // HAZARDOUS
  'battery': 'hazardous',
  'chemical-container': 'hazardous',
  'paint-can': 'hazardous',
  'medical-waste': 'hazardous',
  'pesticide-container': 'hazardous',

  // E-WASTE
  'mobile-phone': 'ewaste',
  'circuit-board': 'ewaste',
  'charger': 'ewaste',
  'laptop': 'ewaste',
  'keyboard': 'ewaste',

  // CONSTRUCTION
  'brick': 'construction',
  'cement-bag': 'construction',
  'tiles': 'construction',
  'construction-debris': 'construction',
};

export interface RoboflowDetection {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoboflowPrediction {
  detections: RoboflowDetection[];
  image: {
    height: number;
    width: number;
  };
}

export interface ClassificationResult {
  wasteType: WasteType;
  detectedItems: Array<{
    item: string;
    confidence: number;
    category: WasteType;
  }>;
  primaryItem: string;
  confidence: number;
  allDetections: RoboflowDetection[];
}

/**
 * Classify waste using Roboflow custom workflow
 * @param imageUrl - URL of the image to classify
 * @returns Classification result with waste type and detected items
 */
export async function classifyWaste(imageUrl: string): Promise<ClassificationResult> {
  try {
    console.log('Classifying image:', imageUrl);
    console.log('Using API key:', process.env.ROBOFLOW_API_KEY ? 'Present' : 'Missing');

    // Try the workflow endpoint with proper formatting
    const requestBody = {
      api_key: process.env.ROBOFLOW_API_KEY,
      inputs: {
        image: {
          type: 'url',
          value: imageUrl,
        },
      },
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(
      'https://serverless.roboflow.com/sanar-gautam/workflows/find-circuit-boards-concretes-papers-plastic-bottles-plastic-bags-cardboards-batteries-bricks-mobile-phones-fruit-peels-food-wastes-and-metal-cans',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('Roboflow response status:', response.status);
    console.log('Roboflow response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Roboflow error response:', errorText);
      
      // Parse the error to provide better feedback
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.blocks_errors && errorJson.blocks_errors.length > 0) {
          const blockError = errorJson.blocks_errors[0];
          throw new Error(
            `Roboflow workflow error in block "${blockError.block_id}" (${blockError.block_type}). ` +
            `This might be a workflow configuration issue. Please check your Roboflow workflow settings.`
          );
        }
      } catch (parseError) {
        // If we can't parse, throw the original error
      }
      
      throw new Error(`Roboflow API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Roboflow result:', JSON.stringify(result, null, 2));

    // Extract predictions from the workflow response
    // The response structure is: result.outputs[0].predictions.predictions (array of detections)
    const predictionsData = result.outputs?.[0]?.predictions;
    
    if (!predictionsData) {
      throw new Error('No predictions data in Roboflow response');
    }

    // Get the detections array - it's nested under predictions.predictions
    const detections = predictionsData.predictions || [];

    console.log('Detections found:', detections.length);
    
    if (!detections || detections.length === 0) {
      throw new Error('No waste items detected in the image');
    }

    // Create a RoboflowPrediction object with the correct structure
    const predictions: RoboflowPrediction = {
      detections: detections,
      image: predictionsData.image || { height: 0, width: 0 }
    };
    
    console.log('Parsed predictions:', JSON.stringify(predictions, null, 2));

    // Map detected items to waste categories
    const detectedItems = predictions.detections.map((detection) => {
      const normalizedClass = detection.class.toLowerCase().replace(/\s+/g, '-');
      const category = wasteCategoryMap[normalizedClass] || 'recyclable'; // Default to recyclable

      return {
        item: detection.class,
        confidence: detection.confidence,
        category,
      };
    });

    // Find the primary item (highest confidence)
    const primaryDetection = predictions.detections.reduce((prev, current) =>
      prev.confidence > current.confidence ? prev : current
    );

    const normalizedPrimaryClass = primaryDetection.class.toLowerCase().replace(/\s+/g, '-');
    const primaryCategory = wasteCategoryMap[normalizedPrimaryClass] || 'recyclable';

    // Determine overall waste type based on priority:
    // 1. Hazardous (highest priority)
    // 2. E-waste
    // 3. Construction
    // 4. Biodegradable
    // 5. Recyclable (default)
    let wasteType: WasteType = primaryCategory;

    const categories = detectedItems.map((item) => item.category);
    if (categories.includes('hazardous')) {
      wasteType = 'hazardous';
    } else if (categories.includes('ewaste')) {
      wasteType = 'ewaste';
    } else if (categories.includes('construction')) {
      wasteType = 'construction';
    } else if (categories.includes('biodegradable')) {
      wasteType = 'biodegradable';
    }

    return {
      wasteType,
      detectedItems,
      primaryItem: primaryDetection.class,
      confidence: primaryDetection.confidence,
      allDetections: predictions.detections,
    };
  } catch (error) {
    console.error('Roboflow classification error:', error);
    throw error;
  }
}

/**
 * Get waste category for a detected item
 */
export function getWasteCategory(itemClass: string): WasteType {
  const normalizedClass = itemClass.toLowerCase().replace(/\s+/g, '-');
  return wasteCategoryMap[normalizedClass] || 'recyclable';
}

/**
 * Get all supported waste items
 */
export function getSupportedWasteItems(): string[] {
  return Object.keys(wasteCategoryMap);
}
