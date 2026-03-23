import { cn } from "@/lib/utils";
import { Paintbrush, Printer } from "lucide-react";

interface CanvasTypeStepProps {
  selectedType: string;
  onTypeSelect: (type: string) => void;
}

const canvasTypes = [
  {
    id: "painting",
    label: "Hand Painting",
    description: "Original hand-painted artwork crafted by a skilled artisan",
    icon: Paintbrush,
    badge: "Artisan Made",
  },
  {
    id: "printed",
    label: "Printed Canvas",
    description: "High-quality digital print on premium canvas material",
    icon: Printer,
    badge: "High Resolution",
  },
];

const CanvasTypeStep = ({ selectedType, onTypeSelect }: CanvasTypeStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Select Canvas Type</h3>
        <p className="text-sm text-muted-foreground">Choose between a hand-painted original or a printed canvas.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {canvasTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => onTypeSelect(type.id)}
              className={cn(
                "relative border-2 rounded-xl p-5 text-left transition-all hover:border-primary",
                isSelected ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center mb-3",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="font-semibold mb-1">{type.label}</p>
              <p className="text-xs text-muted-foreground">{type.description}</p>
              <span className="inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {type.badge}
              </span>
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CanvasTypeStep;
