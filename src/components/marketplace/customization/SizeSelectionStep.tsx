import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

interface SizeSelectionStepProps {
  selectedSize: string;
  onSizeSelect: (size: string) => void;
  onNeedHelp: () => void;
}

const SizeSelectionStep = ({ selectedSize, onSizeSelect, onNeedHelp }: SizeSelectionStepProps) => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-display font-semibold mb-2">Select Your Size</h3>
        <p className="text-muted-foreground">Choose a standard size or get personalized measurements.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Standard Sizes</Label>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Info className="h-4 w-4" />
                Size Guide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Size Chart Guide</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-2">Size</th>
                        <th className="text-left p-2">Chest (cm)</th>
                        <th className="text-left p-2">Waist (cm)</th>
                        <th className="text-left p-2">Hips (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.map((size, idx) => (
                        <tr key={size} className="border-b">
                          <td className="p-2 font-medium">{size}</td>
                          <td className="p-2">{80 + idx * 5} - {85 + idx * 5}</td>
                          <td className="p-2">{70 + idx * 5} - {75 + idx * 5}</td>
                          <td className="p-2">{85 + idx * 5} - {90 + idx * 5}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Measurements may vary by artisan. For best results, choose custom measurements.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
          {sizes.map((size) => (
            <Button
              key={size}
              variant={selectedSize === size ? "default" : "outline"}
              className={cn(
                "h-14 text-lg font-semibold",
                selectedSize === size && "bg-primary"
              )}
              onClick={() => onSizeSelect(size)}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      <div className="border rounded-xl p-6 bg-muted/30">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Info className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold mb-2">Need a more precise fit?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Let us help you measure for a custom-tailored experience.
            </p>
            <Button variant="outline" onClick={onNeedHelp}>
              Get Measurement Help
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeSelectionStep;
