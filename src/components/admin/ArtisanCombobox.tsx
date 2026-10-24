import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { searchArtisanDirectory } from "@/lib/adminArtisanDirectory";
import type { AdminArtisanRow } from "@/lib/apiServices";

function artisanLabel(row: AdminArtisanRow) {
  return row.brandName || row.businessName || row.name || `Artisan #${row.id}`;
}

interface ArtisanComboboxProps {
  artisans: AdminArtisanRow[];
  value: string;
  onChange: (artisanId: string) => void;
  disabled?: boolean;
}

/** Searchable artisan picker that persists the selected artisan user id. */
const ArtisanCombobox = ({ artisans, value, onChange, disabled }: ArtisanComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = artisans.find((row) => String(row.id) === value);
  const matches = useMemo(
    () => searchArtisanDirectory(artisans, query),
    [artisans, query],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          data-testid="admin-product-artisan"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selected ? artisanLabel(selected) : "Search and select artisan"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search name, email or brand…"
            value={query}
            onValueChange={setQuery}
            data-testid="admin-product-artisan-search"
          />
          <CommandList
            className="max-h-60 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin]"
            onWheel={(event) => {
              // The product dialog cancels wheel events that bubble out of it.
              event.stopPropagation();
            }}
          >
            <CommandEmpty>No artisan found.</CommandEmpty>
            <CommandGroup>
              {matches.map((row) => (
                <CommandItem
                  key={row.id}
                  value={String(row.id)}
                  data-testid={`admin-product-artisan-option-${row.id}`}
                  onSelect={() => {
                    onChange(String(row.id));
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === String(row.id) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{artisanLabel(row)}</span>
                    <span className="truncate text-xs text-muted-foreground">{row.email}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ArtisanCombobox;
