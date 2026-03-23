import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CanvasSize {
  id: string;
  label: string;
  dimensions: string;
  priceModifier: number;
  isCustom?: boolean;
}

export const canvasSizes: CanvasSize[] = [
  { id: "small", label: "Small", dimensions: "12×16 inches", priceModifier: 0 },
  { id: "medium", label: "Medium", dimensions: "16×20 inches", priceModifier: 5000 },
  { id: "large", label: "Large", dimensions: "24×36 inches", priceModifier: 12000 },
  { id: "xlarge", label: "Extra Large", dimensions: "36×48 inches", priceModifier: 22000 },
  { id: "custom", label: "Custom Size", dimensions: "You specify", priceModifier: 8000, isCustom: true },
];

interface CanvasSizeStepProps {
  selectedSize: string;
  onSizeSelect: (sizeId: string) => void;
  customWidth: string;
  customHeight: string;
  onCustomDimensionChange: (field: "width" | "height", value: string) => void;
}

const CanvasSizeStep = ({
  selectedSize,
  onSizeSelect,
  customWidth,
  customHeight,
  onCustomDimensionChange,
}: CanvasSizeStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Select Canvas Size</h3>
        <p className="text-sm text-muted-foreground">Size affects the final price. Custom sizes available.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {canvasSizes.map((size) => {
          const isSelected = selectedSize === size.id;
          return (
            <button
              key={size.id}
              onClick={() => onSizeSelect(size.id)}
              className={cn(
                "border-2 rounded-xl p-4 text-left transition-all hover:border-primary relative",
                isSelected ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{size.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{size.dimensions}</p>
                </div>
                {size.priceModifier > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    +₦{size.priceModifier.toLocaleString()}
                  </Badge>
                )}
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedSize === "custom" && (
        <div className="border border-border rounded-xl p-4 space-y-4 bg-muted/30">
          <p className="text-sm font-medium">Enter your custom dimensions (inches):</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Width (inches)</Label>
              <Input
                type="number"
                placeholder="e.g. 20"
                value={customWidth}
                onChange={(e) => onCustomDimensionChange("width", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Height (inches)</Label>
              <Input
                type="number"
                placeholder="e.g. 30"
                value={customHeight}
                onChange={(e) => onCustomDimensionChange("height", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasSizeStep;
