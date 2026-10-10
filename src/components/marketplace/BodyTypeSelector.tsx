import { cn } from "@/lib/utils";
import { BODY_TYPE_OPTIONS } from "@/lib/productVariations";

interface BodyTypeSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
}

/** Simple silhouette SVGs — no external images. */
function Silhouette({ variant }: { variant: string }) {
  const scale =
    variant === "slim"
      ? 0.75
      : variant === "athletic"
        ? 0.9
        : variant === "average"
          ? 1
          : variant === "curvy"
            ? 1.15
            : 1.3;
  const hip =
    variant === "curvy" || variant === "plus" ? 18 * scale : 12 * scale;
  const shoulder =
    variant === "athletic" || variant === "plus" ? 16 * scale : 12 * scale;

  return (
    <svg
      viewBox="0 0 40 70"
      className="h-14 w-10 mx-auto"
      aria-hidden="true"
      fill="currentColor"
    >
      <circle cx="20" cy="10" r="6" opacity="0.9" />
      <path
        d={`M${20 - shoulder} 18
           Q20 22 ${20 + shoulder} 18
           L${20 + shoulder * 0.7} 36
           L${20 + hip} 58
           L${20 - hip} 58
           L${20 - shoulder * 0.7} 36
           Z`}
        opacity="0.85"
      />
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
