import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PICKER_ICON_NAMES, resolveLucideIcon } from "@/lib/lucideIcons";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  label?: string;
}

const IconPicker = ({ value, onChange, label = "Icon" }: IconPickerProps) => {
  const [query, setQuery] = useState("");
  const icons = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PICKER_ICON_NAMES.filter((name) => !q || name.toLowerCase().includes(q));
  }, [query]);

  const selected = value || "Tag";
  const SelectedIcon = resolveLucideIcon(selected);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <SelectedIcon className="h-4 w-4" aria-hidden />
        <span>{selected}</span>
      </div>
      <Input
        placeholder="Search icons…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search icons"
      />
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1 border rounded-md">
        {icons.map((name) => {
          const Icon = resolveLucideIcon(name);
          const active = name === selected;
          return (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={name}
              aria-pressed={active}
              onClick={() => onChange(name)}
              className={cn(
                "flex items-center justify-center rounded-md p-2 border transition-colors",
                active ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted",
              )}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IconPicker;
