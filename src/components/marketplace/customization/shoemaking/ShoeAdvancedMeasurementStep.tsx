import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ShoeAdvancedMeasurementStepProps {
  measurements: Record<string, string>;
  onMeasurementChange: (field: string, value: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

const measurementFields = [
  { id: "footLength", label: "Heel-to-Toe Length", unit: "cm", tooltip: "Measure from heel to longest toe" },
  { id: "ballWidth", label: "Ball Width", unit: "cm", tooltip: "Widest part of foot" },
  { id: "archLength", label: "Arch Length", unit: "cm", tooltip: "From heel to ball of foot" },
  { id: "instepHeight", label: "Instep Height", unit: "cm", tooltip: "Top of foot at highest point" },
  { id: "ankleCircumference", label: "Ankle Circumference", unit: "cm", tooltip: "Around ankle bone" },
];

const ShoeAdvancedMeasurementStep = ({
  measurements,
  onMeasurementChange,
  notes,
  onNotesChange,
}: ShoeAdvancedMeasurementStepProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-display font-semibold mb-1">Advanced Measurements</h3>
        <p className="text-sm text-muted-foreground">
          Optional: Provide precise measurements for a perfect fit
        </p>
      </div>

      {/* AI Preview Placeholder */}
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-dashed">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
            <span className="text-2xl">👟</span>
          </div>
          <p className="text-xs text-muted-foreground">
            AI-Powered Fit Preview (Coming Soon)
          </p>
          <Badge variant="secondary" className="text-[10px] mt-2">
            Futuristic Visualization
          </Badge>
        </div>
      </Card>

      {/* Measurement Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {measurementFields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-xs font-medium">
              {field.label}
              <span className="text-muted-foreground ml-1">({field.unit})</span>
            </Label>
            <Input
              id={field.id}
              type="number"
              step="0.1"
              placeholder={`Enter ${field.label.toLowerCase()}`}
              value={measurements[field.id] || ""}
              onChange={(e) => onMeasurementChange(field.id, e.target.value)}
              className="h-9 text-sm"
            />
            <p className="text-[10px] text-muted-foreground">{field.tooltip}</p>
          </div>
        ))}
      </div>

      {/* Additional Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-xs font-medium">
          Additional Notes
        </Label>
        <Textarea
          id="notes"
          placeholder="Any special requirements, comfort preferences, or fitting concerns..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          className="text-sm resize-none"
        />
        <p className="text-[10px] text-muted-foreground">
          Optional: Share any specific preferences or concerns about fit
        </p>
      </div>

      <div className="bg-muted/20 rounded-lg p-3 text-xs text-muted-foreground">
        <p className="font-medium mb-1">📏 Measurement Tips:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Measure at the end of the day when feet are slightly swollen</li>
          <li>Wear the type of socks you'll wear with these shoes</li>
          <li>Stand while measuring for accurate results</li>
        </ul>
      </div>
    </div>
  );
};

export default ShoeAdvancedMeasurementStep;
