import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CanvasNotesStepProps {
  notes: string;
  onNotesChange: (value: string) => void;
}

const CanvasNotesStep = ({ notes, onNotesChange }: CanvasNotesStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Additional Notes</h3>
        <p className="text-sm text-muted-foreground">Share any special instructions with the artisan.</p>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Instructions for the Artisan</Label>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="E.g. 'Please use warm tones, focus on the face in portrait, remove the background...'"
          className="min-h-[140px] resize-none"
        />
        <p className="text-xs text-muted-foreground">{notes.length}/1000 characters</p>
      </div>

      <div className="bg-muted/40 rounded-xl p-4 space-y-2">
        <p className="text-sm font-medium">💡 Helpful tips:</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Mention preferred colors or color combinations</li>
          <li>Describe background preferences (plain, blurred, removed)</li>
          <li>Note any people or elements to focus on</li>
          <li>Specify artistic style if not chosen above</li>
        </ul>
      </div>
    </div>
  );
};

export default CanvasNotesStep;
