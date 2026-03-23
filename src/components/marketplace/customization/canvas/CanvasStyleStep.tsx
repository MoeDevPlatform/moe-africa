import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CanvasStyleOptions {
  frame: string;
  finish: string;
  paintingStyle: string;
  colorEnhancement: boolean;
}

const frameOptions = [
  { id: "unframed", label: "Unframed", priceModifier: 0 },
  { id: "wooden-frame", label: "Wooden Frame", priceModifier: 4500 },
  { id: "metal-frame", label: "Metal Frame", priceModifier: 6500 },
];

const finishOptions = [
  { id: "matte", label: "Matte", priceModifier: 0 },
  { id: "glossy", label: "Glossy", priceModifier: 1500 },
  { id: "satin", label: "Satin", priceModifier: 2000 },
];

const paintingStyleOptions = [
  { id: "realistic", label: "Realistic", priceModifier: 0 },
  { id: "abstract", label: "Abstract", priceModifier: 0 },
  { id: "pop-art", label: "Pop Art", priceModifier: 3000 },
  { id: "impressionist", label: "Impressionist", priceModifier: 2500 },
  { id: "digital-art", label: "Digital Art", priceModifier: 0 },
];

interface CanvasStyleStepProps {
  options: CanvasStyleOptions;
  onChange: (field: keyof CanvasStyleOptions, value: string | boolean) => void;
  canvasType: string;
}

const SelectGroup = ({
  label,
  items,
  selected,
  onSelect,
}: {
  label: string;
  items: { id: string; label: string; priceModifier: number }[];
  selected: string;
  onSelect: (id: string) => void;
}) => (
  <div className="space-y-3">
    <Label className="text-sm font-medium">{label}</Label>
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isSelected = selected === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              "border-2 rounded-lg px-3 py-2 text-sm transition-all hover:border-primary",
              isSelected ? "border-primary bg-primary/5 font-medium" : "border-border"
            )}
          >
            {item.label}
            {item.priceModifier > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
                +₦{item.priceModifier.toLocaleString()}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

const CanvasStyleStep = ({ options, onChange, canvasType }: CanvasStyleStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Style & Finishing Options</h3>
        <p className="text-sm text-muted-foreground">Customise the presentation of your canvas order.</p>
      </div>

      <SelectGroup
        label="Frame"
        items={frameOptions}
        selected={options.frame}
        onSelect={(v) => onChange("frame", v)}
      />

      <SelectGroup
        label="Finish"
        items={finishOptions}
        selected={options.finish}
        onSelect={(v) => onChange("finish", v)}
      />

      {canvasType === "painting" && (
        <SelectGroup
          label="Painting Style"
          items={paintingStyleOptions}
          selected={options.paintingStyle}
          onSelect={(v) => onChange("paintingStyle", v)}
        />
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium">Color Enhancement</Label>
        <button
          onClick={() => onChange("colorEnhancement", !options.colorEnhancement)}
          className={cn(
            "border-2 rounded-lg px-4 py-3 text-sm w-full text-left transition-all hover:border-primary",
            options.colorEnhancement ? "border-primary bg-primary/5" : "border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Color Enhancement</p>
              <p className="text-xs text-muted-foreground mt-0.5">Boost vibrancy and contrast for richer output</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">+₦2,000</Badge>
          </div>
        </button>
      </div>
    </div>
  );
};

export { frameOptions, finishOptions, paintingStyleOptions };
export default CanvasStyleStep;
