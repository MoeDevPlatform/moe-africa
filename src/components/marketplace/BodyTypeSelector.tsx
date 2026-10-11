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
  // Half-widths in the 40x70 viewBox: shoulders, waist, hip, hem.
  const p =
    variant === "slim"
      ? { s: 6.5, w: 5.5, h: 7, hem: 7 }
      : variant === "athletic"
        ? { s: 10, w: 8, h: 8.5, hem: 8 }
        : variant === "average"
          ? { s: 8.5, w: 6.5, h: 9, hem: 9 }
          : variant === "curvy"
            ? { s: 8, w: 5.5, h: 11, hem: 11 }
            : { s: 12, w: 10.5, h: 13.5, hem: 13.5 }; // plus
  const { s, w, h, hem } = p;

  const d = [
    `M${20 - s} 19`,
    `Q${20 - s} 16.5 20 16.5`,
    `Q${20 + s} 16.5 ${20 + s} 19`,
    // gentle taper into the waist
    `C${20 + s} 23 ${20 + w} 27 ${20 + w} 33`,
    // flare out to the hips
    `C${20 + w} 39 ${20 + h} 42 ${20 + h} 50`,
    // round into the hem
    `Q${20 + h} 59 ${20 + hem} 61`,
    `L${20 - hem} 61`,
    `Q${20 - h} 59 ${20 - h} 50`,
    `C${20 - h} 42 ${20 - w} 39 ${20 - w} 33`,
    `C${20 - w} 27 ${20 - s} 23 ${20 - s} 19`,
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
