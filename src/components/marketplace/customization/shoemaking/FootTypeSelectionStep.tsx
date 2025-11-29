import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface FootTypeSelectionStepProps {
  selectedFootType: string;
  onFootTypeSelect: (type: string) => void;
}

const footTypes = [
  {
    id: "flat",
    name: "Flat Feet",
    description: "Low or no visible arch",
    icon: "👣",
  },
  {
    id: "wide",
    name: "Wide Feet",
    description: "Broader foot width",
    icon: "🦶",
  },
  {
    id: "slim",
    name: "Slim Feet",
    description: "Narrow foot width",
    icon: "👟",
  },
  {
    id: "high-arch",
    name: "High Arches",
    description: "Pronounced arch curve",
    icon: "🏃",
  },
  {
    id: "neutral",
    name: "Neutral Arch",
    description: "Standard arch height",
    icon: "👞",
  },
];

const FootTypeSelectionStep = ({
  selectedFootType,
  onFootTypeSelect,
}: FootTypeSelectionStepProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-display font-semibold mb-1">Select Your Foot Type</h3>
        <p className="text-sm text-muted-foreground">
          This helps us create the perfect fit and comfort
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {footTypes.map((type) => {
          const isSelected = selectedFootType === type.id;
          return (
            <Card
              key={type.id}
              className={`p-4 cursor-pointer transition-all hover:border-primary relative ${
                isSelected ? "border-primary bg-primary/5 shadow-sm" : ""
              }`}
              onClick={() => onFootTypeSelect(type.id)}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <div className="text-4xl mb-2">{type.icon}</div>
                <h4 className="font-semibold text-sm mb-1">{type.name}</h4>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="bg-accent/10 rounded-lg p-3 text-xs text-muted-foreground">
        <p className="font-medium mb-1">💡 Tip:</p>
        <p>
          If you're unsure, "Neutral Arch" is a safe choice. Our artisans will fine-tune the fit based on your measurements.
        </p>
      </div>
    </div>
  );
};

export default FootTypeSelectionStep;
