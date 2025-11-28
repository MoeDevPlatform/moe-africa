import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MeasurementStepProps {
  measurements: Record<string, string>;
  onMeasurementChange: (field: string, value: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

const measurementFields = [
  { id: "chest", label: "Chest", placeholder: "e.g. 95", tooltip: "Measure around the widest part of your chest" },
  { id: "waist", label: "Waist", placeholder: "e.g. 85", tooltip: "Measure around your natural waistline" },
  { id: "hips", label: "Hips", placeholder: "e.g. 100", tooltip: "Measure around the fullest part of your hips" },
  { id: "shoulder", label: "Shoulder Width", placeholder: "e.g. 45", tooltip: "Measure from shoulder point to shoulder point" },
  { id: "sleeve", label: "Sleeve Length", placeholder: "e.g. 60", tooltip: "Measure from shoulder to wrist" },
  { id: "inseam", label: "Inseam", placeholder: "e.g. 75", tooltip: "Measure from crotch to ankle" },
];

const MeasurementStep = ({ measurements, onMeasurementChange, notes, onNotesChange }: MeasurementStepProps) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Measurements & Details</h3>
        <p className="text-sm text-muted-foreground">Provide measurements for a perfect custom fit (optional but recommended).</p>
      </div>

      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between" size="sm">
            <span className="text-sm">Advanced Measurements (cm)</span>
            {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {measurementFields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor={field.id} className="text-sm">{field.label}</Label>
                  <div className="group relative">
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-44 p-2 bg-popover border rounded-md shadow-lg text-xs z-10">
                      {field.tooltip}
                    </div>
                  </div>
                </div>
                <Input
                  id={field.id}
                  type="number"
                  placeholder={field.placeholder}
                  value={measurements[field.id] || ""}
                  onChange={(e) => onMeasurementChange(field.id, e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="space-y-3">
        <Label htmlFor="notes" className="text-sm">Special Requests or Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any specific details, fabric preferences, or design elements..."
          className="min-h-24 text-sm"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-sm">Upload Inspiration Images or Measurement Chart (Optional)</Label>
        <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs font-medium mb-0.5">Click to upload or drag and drop</p>
          <p className="text-[10px] text-muted-foreground">PNG, JPG up to 10MB</p>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
        <p className="text-xs text-primary">
          💡 <strong>Save for later:</strong> Your measurements will be saved to your profile for future orders.
        </p>
      </div>
    </div>
  );
};

export default MeasurementStep;
