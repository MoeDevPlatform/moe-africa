import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PRODUCT_AUDIENCES, type ProductAudience } from "@/lib/productAudience";

export default function DesignedForField({
  value,
  onChange,
  required = false,
  disabled = false,
  error,
}: {
  value: ProductAudience[];
  onChange: (value: ProductAudience[]) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <fieldset className="space-y-2" data-testid="designed-for-field">
      <legend className="text-sm font-medium">
        Designed For {required ? <span className="text-destructive">*</span> : null}
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRODUCT_AUDIENCES.map((item) => {
          const checked = value.includes(item.value);
          return (
            <Label
              key={item.value}
              className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 font-normal"
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                aria-label={item.label}
                onCheckedChange={(next) =>
                  onChange(
                    next
                      ? [...value, item.value]
                      : value.filter((valueItem) => valueItem !== item.value),
                  )
                }
              />
              {item.label}
            </Label>
          );
        })}
      </div>
      <p className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
        {error || "Select every audience this product was designed for."}
      </p>
    </fieldset>
  );
}
