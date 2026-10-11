import { cn } from "@/lib/utils";
import { BODY_TYPE_OPTIONS } from "@/lib/productVariations";

interface BodyTypeSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
}

/**
 * Parametric figure silhouettes — shoulder / bust / waist / hip proportions
 * per build, drawn as smooth symmetric curves. No external images.
 */
function Silhouette({ variant }: { variant: string }) {
  // Half-widths in the 40x70 viewBox: shoulders, chest, waist, hips, hem.
  const p =
    variant === "slim"
      ? { s: 6.5, b: 6, w: 5, h: 7.5, hem: 6 }
      : variant === "athletic"
        ? { s: 10, b: 8, w: 6.5, h: 8, hem: 7 }
        : variant === "average"
          ? { s: 8.5, b: 8, w: 6.5, h: 9.5, hem: 8 }
          : variant === "curvy"
            ? { s: 8, b: 9.5, w: 5.5, h: 12, hem: 10 }
            : { s: 11.5, b: 12, w: 11, h: 14, hem: 12.5 }; // plus
  const { s, b, w, h, hem } = p;

  const d = [
    `M${20 - s} 19`,
    `Q${20 - s} 16.5 20 16.5`,
    `Q${20 + s} 16.5 ${20 + s} 19`,
    // torso: shoulders → chest → waist
    `C${20 + s} 24 ${20 + b} 26 ${20 + b} 30`,
    `C${20 + b} 34 ${20 + w} 34.5 ${20 + w} 38`,
    // waist → hips → rounded hem
    `C${20 + w} 44 ${20 + h} 46 ${20 + h} 53`,
    `Q${20 + h} 59.5 ${20 + hem} 61`,
    `L${20 - hem} 61`,
    `Q${20 - h} 59.5 ${20 - h} 53`,
    `C${20 - h} 46 ${20 - w} 44 ${20 - w} 38`,
    `C${20 - w} 34.5 ${20 - b} 34 ${20 - b} 30`,
    `C${20 - b} 26 ${20 - s} 24 ${20 - s} 19`,
    "Z",
  ].join(" ");

  return (
    <svg
      viewBox="0 0 40 70"
      className="h-14 w-10 mx-auto"
      aria-hidden="true"
      fill="currentColor"
    >
      <circle cx="20" cy="9.5" r="5.2" opacity="0.9" />
      <path d="M18.6 13.5 L21.4 13.5 L21.9 17.5 L18.1 17.5 Z" opacity="0.9" />
      <path d={d} opacity="0.85" />
    </svg>
  );
}

const BodyTypeSelector = ({ value, onChange, required }: BodyTypeSelectorProps) => {
  return (
    <div className="space-y-2" data-testid="body-type-selector">
      <p className="text-sm font-medium">
        Body type
        {required ? <span className="text-destructive"> *</span> : null}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {BODY_TYPE_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`body-type-${opt.value}`}
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              className={cn(
                "shrink-0 w-20 h-[120px] rounded-lg border-2 flex flex-col items-center justify-center gap-1 p-2 transition-colors",
                selected
                  ? "border-primary text-primary bg-primary/5 selected"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              <Silhouette variant={opt.value} />
              <span className="text-[10px] leading-tight text-center font-medium">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BodyTypeSelector;
