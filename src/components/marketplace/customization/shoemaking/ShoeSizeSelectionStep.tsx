import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ruler, HelpCircle } from "lucide-react";

interface ShoeSizeSelectionStepProps {
  selectedSize: string;
  onSizeSelect: (size: string) => void;
  onNeedHelp: () => void;
}

const shoeSizes = {
  EU: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
  US: ["4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"],
  UK: ["3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"],
};

const ShoeSizeSelectionStep = ({
  selectedSize,
  onSizeSelect,
  onNeedHelp,
}: ShoeSizeSelectionStepProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-display font-semibold mb-1">Select Your Shoe Size</h3>
        <p className="text-sm text-muted-foreground">Choose your size from the chart below</p>
      </div>

      {/* Size Chart */}
      <Card className="p-4 bg-muted/30">
        <div className="space-y-4">
          {Object.entries(shoeSizes).map(([system, sizes]) => (
            <div key={system}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">{system}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const sizeValue = `${system}-${size}`;
                  const isSelected = selectedSize === sizeValue;
                  return (
                    <Button
                      key={size}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSizeSelect(sizeValue)}
                      className={isSelected ? "bg-primary" : ""}
                    >
                      {size}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Help Section */}
      <Card className="p-4 border-dashed bg-accent/5">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Not sure about your size?</p>
            <p className="text-xs text-muted-foreground mb-2">
              We can help you find the perfect fit based on your foot measurements.
            </p>
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0 text-primary"
              onClick={onNeedHelp}
            >
              <Ruler className="h-4 w-4 mr-1" />
              Guide me with measurements
            </Button>
          </div>
        </div>
      </Card>

      {/* Measurement Guide */}
      <div className="bg-muted/20 rounded-lg p-3 text-xs text-muted-foreground">
        <p className="font-medium mb-1">How to measure your foot:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Stand on a piece of paper with your heel against a wall</li>
          <li>Mark the longest part of your foot</li>
          <li>Measure the distance from the wall to the mark</li>
        </ol>
      </div>
    </div>
  );
};

export default ShoeSizeSelectionStep;
