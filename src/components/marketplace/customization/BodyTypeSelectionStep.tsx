import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, Users } from "lucide-react";

interface BodyType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const bodyTypes: BodyType[] = [
  { id: "slender", name: "Slender", description: "Lean and narrow build", icon: "👤" },
  { id: "athletic", name: "Athletic", description: "Toned with defined muscles", icon: "💪" },
  { id: "average", name: "Average", description: "Balanced proportions", icon: "🧍" },
  { id: "muscular", name: "Muscular", description: "Broad and well-built", icon: "🏋️" },
  { id: "curvy", name: "Curvy", description: "Pronounced curves", icon: "👗" },
  { id: "plus", name: "Plus Size", description: "Fuller figure", icon: "🫂" },
];

interface BodyTypeSelectionStepProps {
  selectedBodyType: string;
  onBodyTypeSelect: (bodyType: string) => void;
}

const BodyTypeSelectionStep = ({ selectedBodyType, onBodyTypeSelect }: BodyTypeSelectionStepProps) => {
  const selectedType = bodyTypes.find(bt => bt.id === selectedBodyType);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Select Your Body Type</h3>
        <p className="text-sm text-muted-foreground">
          This helps our artisans understand your build for a perfect custom fit.
        </p>
      </div>

      {selectedType && (
        <div className="border-2 border-primary rounded-lg p-4 bg-primary/5 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{selectedType.icon}</div>
            <div>
              <Badge className="mb-1.5 text-xs">Selected</Badge>
              <p className="font-display font-semibold text-base">{selectedType.name}</p>
              <p className="text-xs text-muted-foreground">{selectedType.description}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-primary">
            ✨ Fit recommendations have been adjusted for your {selectedType.name.toLowerCase()} build.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {bodyTypes.map((bodyType) => {
          const isSelected = selectedBodyType === bodyType.id;
          return (
            <button
              key={bodyType.id}
              onClick={() => onBodyTypeSelect(bodyType.id)}
              className={cn(
                "relative border-2 rounded-lg p-4 text-center transition-all hover:border-primary hover:shadow-md",
                isSelected ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <div className="text-3xl mb-2 transition-transform hover:scale-110">
                {bodyType.icon}
              </div>
              <h4 className="font-semibold mb-0.5 text-sm">{bodyType.name}</h4>
              <p className="text-xs text-muted-foreground">{bodyType.description}</p>
            </button>
          );
        })}
      </div>

      <div className="border-l-4 border-primary pl-3 py-2 bg-muted/30 rounded-r-md">
        <p className="text-xs text-muted-foreground">
          <strong>Pro tip:</strong> These visual guides help our artisans tailor with precision. 
          Your selection ensures the perfect fit for your unique body shape.
        </p>
      </div>
    </div>
  );
};

export default BodyTypeSelectionStep;
