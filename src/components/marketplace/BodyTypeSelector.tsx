import { cn } from "@/lib/utils";
import { BODY_TYPE_OPTIONS } from "@/lib/productVariations";

interface BodyTypeSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
}

/**
 * Full-body figure silhouettes (head, arms, torso, legs) in the style used by
 * fit-finder tools on fashion apps. Proportions are parametric per build.
 */
function Silhouette({ variant }: { variant: string }) {
  // Half-widths in a 40x80 viewBox: shoulder, chest, waist, hip, ankle, arm thickness.
  const p =
    variant === "slim"
      ? { s: 6.5, c: 5.5, w: 4.5, h: 5.5, k: 2.6, a: 2.2 }
      : variant === "athletic"
        ? { s: 9.5, c: 8, w: 6, h: 6.5, k: 3, a: 3.2 }
        : variant === "average"
          ? { s: 8, c: 7, w: 6.2, h: 7.5, k: 3, a: 2.8 }
          : variant === "curvy"
            ? { s: 7.5, c: 7.5, w: 5, h: 9.5, k: 3, a: 2.7 }
            : { s: 10, c: 10.5, w: 10, h: 11.5, k: 3.6, a: 3.6 }; // plus
  const { s, c, w, h, k, a } = p;
  const side = (m: 1 | -1) => (x: number) => 20 + m * x;
  const R = side(1);
  const L = side(-1);

  const body = [
    `M20 16`,
    `C${R(s * 0.6)} 16 ${R(s)} 16.5 ${R(s)} 19.5`,
    `C${R(s)} 23 ${R(c)} 23.5 ${R(c)} 27`,
    `C${R(c)} 30.5 ${R(w)} 31 ${R(w)} 34.5`,
    `C${R(w)} 38.5 ${R(h)} 39.5 ${R(h)} 44`,
    `C${R(h)} 54 ${R(k + 1.5)} 64 ${R(k)} 75`,
    `Q${R(k)} 77 ${R(0.9)} 77`,
    `L${R(0.9)} 52`,
    `Q20 49.5 ${L(0.9)} 52`,
    `L${L(0.9)} 77`,
    `Q${L(k)} 77 ${L(k)} 75`,
    `C${L(k + 1.5)} 64 ${L(h)} 54 ${L(h)} 44`,
    `C${L(h)} 39.5 ${L(w)} 38.5 ${L(w)} 34.5`,
    `C${L(w)} 31 ${L(c)} 30.5 ${L(c)} 27`,
    `C${L(c)} 23.5 ${L(s)} 23 ${L(s)} 19.5`,
    `C${L(s)} 16.5 ${L(s * 0.6)} 16 20 16`,
    "Z",
  ].join(" ");

  // Arms hang just outside the widest point of the torso.
  const armX = Math.max(c, h * 0.85) + a / 2 + 0.9;
  const arm = (m: 1 | -1) =>
    `M${20 + m * (s - a / 2 + 0.6)} 19.5 Q${20 + m * (armX + 0.6)} 27 ${20 + m * armX} 46`;

  return (
    <svg viewBox="0 0 40 80" className="h-16 w-9 mx-auto" aria-hidden="true">
      <g fill="currentColor" stroke="currentColor" opacity="0.85">
        <circle cx="20" cy="8.5" r="5" stroke="none" />
        <rect x="18.4" y="12.5" width="3.2" height="4.5" rx="1" stroke="none" />
        <path d={body} stroke="none" />
        <path d={arm(1)} fill="none" strokeWidth={a} strokeLinecap="round" />
        <path d={arm(-1)} fill="none" strokeWidth={a} strokeLinecap="round" />
      </g>
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
