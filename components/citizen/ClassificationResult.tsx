'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Leaf, Recycle, Zap, HardHat } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { animations } from '@/lib/theme';
import { WASTE_TYPES } from '@/config/constants';
import { WasteType } from '@/types';
import { ClassificationResult as ClassificationData } from '@/lib/roboflow';

interface ClassificationResultProps {
  result: ClassificationData;
}

const wasteIcons: Record<WasteType, any> = {
  biodegradable: Leaf,
  recyclable: Recycle,
  hazardous: AlertTriangle,
  ewaste: Zap,
  construction: HardHat,
};

export function ClassificationResult({ result }: ClassificationResultProps) {
  const wasteConfig = WASTE_TYPES[result.wasteType];
  const Icon = wasteIcons[result.wasteType];

  // Group items by name and calculate average confidence
  const groupedItems = result.detectedItems.reduce(
    (acc, item) => {
      const existing = acc.find((g) => g.item.toLowerCase() === item.item.toLowerCase());
      if (existing) {
        existing.count += 1;
        existing.totalConfidence += item.confidence;
      } else {
        acc.push({
          item: item.item,
          category: item.category,
          count: 1,
          totalConfidence: item.confidence,
        });
      }
      return acc;
    },
    [] as Array<{
      item: string;
      category: WasteType;
      count: number;
      totalConfidence: number;
    }>
  );

  // Calculate average confidence for each group
  const groupedItemsWithAvg = groupedItems.map((group) => ({
    ...group,
    avgConfidence: group.totalConfidence / group.count,
  }));

  return (
    <motion.div {...animations.slideUp} className="space-y-4">
      {/* Main Classification */}
      <Card className="border-2" style={{ borderColor: wasteConfig.color }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div
              className="rounded-full p-3"
              style={{ backgroundColor: `${wasteConfig.color}20` }}
            >
              <Icon className="h-6 w-6" style={{ color: wasteConfig.color }} />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {wasteConfig.label}
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </CardTitle>
              <CardDescription>Primary waste category detected</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Confidence</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
            <Progress value={result.confidence * 100} className="h-2" />
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Primary Item Detected:</p>
            <Badge variant="secondary" className="text-sm">
              {result.primaryItem}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* All Detected Items */}
      {result.detectedItems.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Detected Items</CardTitle>
            <CardDescription>
              {groupedItemsWithAvg.length} unique item{groupedItemsWithAvg.length !== 1 ? 's' : ''} found in the image
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupedItemsWithAvg.map((group, index) => {
                const itemConfig = WASTE_TYPES[group.category];
                return (
                  <motion.div
                    key={index}
                    {...animations.slideLeft}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: itemConfig.color }}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {group.item} <span className="text-muted-foreground">x {group.count}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {itemConfig.label}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(group.avgConfidence * 100)}%
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.wasteType === 'biodegradable' && (
            <div className="text-sm space-y-2">
              <p className="font-medium text-green-600">♻️ Biodegradable Waste</p>
              <p className="text-muted-foreground">
                This waste can decompose naturally. It's perfect for composting and will break down
                into organic matter.
              </p>
            </div>
          )}
          {result.wasteType === 'recyclable' && (
            <div className="text-sm space-y-2">
              <p className="font-medium text-blue-600">♻️ Recyclable Waste</p>
              <p className="text-muted-foreground">
                This material can be processed and reused. Recycling helps conserve resources and
                reduce landfill waste.
              </p>
            </div>
          )}
          {result.wasteType === 'hazardous' && (
            <div className="text-sm space-y-2">
              <p className="font-medium text-red-600">⚠️ Hazardous Waste</p>
              <p className="text-muted-foreground">
                This waste requires special handling and disposal. Never dispose of it with regular
                trash.
              </p>
            </div>
          )}
          {result.wasteType === 'ewaste' && (
            <div className="text-sm space-y-2">
              <p className="font-medium text-amber-600">⚡ E-Waste</p>
              <p className="text-muted-foreground">
                Electronic waste contains valuable materials that can be recovered. Proper disposal
                prevents environmental contamination.
              </p>
            </div>
          )}
          {result.wasteType === 'construction' && (
            <div className="text-sm space-y-2">
              <p className="font-medium text-purple-600">🏗️ Construction Waste</p>
              <p className="text-muted-foreground">
                Construction materials can often be reused or recycled for new building projects.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
