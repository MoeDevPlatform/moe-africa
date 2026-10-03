import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { countries } from "@/data/countryStateData";
import { filterMetaService, type ProductFilterMeta } from "@/lib/apiServices";

export interface FilterState {
  priceRange: [number, number];
  materials: string[];
  styleTags: string[];
  deliveryEstimate: string | null;
  country?: string | null;
  state?: string | null;
  minRating?: number | null;
  availableOnly?: boolean;
}

/** Client-side location match against an artisan's country/state/city. */
export const providerMatchesLocation = (
  p: { city?: string; state?: string; country?: string },
  f: Pick<FilterState, "country" | "state">,
) => {
  const norm = (v?: string | null) => (v || "").toLowerCase().trim();
  if (f.country) {
    const pc = norm((p as { country?: string }).country);
    if (pc) {
      if (pc !== norm(f.country)) return false;
    } else {
      // No country on record: infer from the state belonging to the chosen country.
      const c = countries.find((x) => x.name === f.country);
      const ps = norm(p.state);
      if (!c || !c.states.some((s) => norm(s) === ps || ps.includes(norm(s)))) return false;
    }
  }
  if (f.state) {
    const st = norm(f.state);
    if (!norm(p.state).includes(st) && !norm(p.city).includes(st)) return false;
  }
  return true;
};

export const DEFAULT_ARTISAN_FILTERS: FilterState = {
  priceRange: [0, 500000],
  materials: [],
  styleTags: [],
  deliveryEstimate: null,
  country: null,
  state: null,
  minRating: null,
  availableOnly: false,
};

/** Applies location / rating / availability filters to an artisan list. */
export const applyArtisanFilters = <
  T extends { city?: string; state?: string; country?: string; rating?: number | string; reviewCount?: number },
>(list: T[], f: FilterState): T[] => {
  let out = list;
  if (f.country || f.state) out = out.filter((p) => providerMatchesLocation(p, f));
  if (f.minRating) {
    const min = f.minRating;
    out = out.filter((p) => (p.reviewCount ?? 0) > 0 && Number(p.rating ?? 0) >= min);
  }
  if (f.availableOnly) {
    out = out.filter((p) => {
      const c = (p as T & { productCount?: number }).productCount;
      return typeof c === "number" ? c > 0 : true;
    });
  }
  return out;
};

interface FilterDrawerProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  children?: React.ReactNode;
  /** Only show artisan-relevant filters (location, rating, availability). */
  artisansOnly?: boolean;
}

const FALLBACK_MATERIALS = [
  { id: "cotton", label: "Cotton" },
  { id: "linen", label: "Linen" },
  { id: "aso-oke", label: "Aso-Oke" },
  { id: "leather", label: "Leather" },
  { id: "suede", label: "Suede" },
  { id: "denim", label: "Denim" },
  { id: "silk", label: "Silk" },
  { id: "wool", label: "Wool" },
];

const FALLBACK_STYLE_TAGS = [
  { id: "urban", label: "Urban" },
  { id: "traditional", label: "Traditional" },
  { id: "minimalist", label: "Minimalist" },
  { id: "luxury", label: "Luxury" },
  { id: "streetwear", label: "Streetwear" },
  { id: "afro-fusion", label: "Afro-Fusion" },
  { id: "casual", label: "Casual" },
  { id: "formal", label: "Formal" },
];

const DELIVERY_OPTIONS = [
  { id: "fastest", label: "Fastest delivery", days: 3 },
  { id: "3-5", label: "Ready in 3–5 days", days: 5 },
  { id: "1-week", label: "Ready in 1 week", days: 7 },
  { id: "2-weeks", label: "Under 2 weeks", days: 14 },
];

const FilterDrawer = ({ filters, onFiltersChange, children, artisansOnly = false }: FilterDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [meta, setMeta] = useState<ProductFilterMeta | null>(null);

  // Item 3 — hydrate chips & price range from the backend on first open.
  useEffect(() => {
    if (meta || !open) return;
    filterMetaService.products().then(setMeta).catch(() => setMeta(null));
  }, [open, meta]);

  // Drive chip list & price slider max from live meta when available; fall back to constants.
  const styleTagOptions = meta?.styleTags?.length
    ? meta.styleTags.map((t) => ({ id: t, label: t }))
    : FALLBACK_STYLE_TAGS;
  const materialOptions = FALLBACK_MATERIALS; // backend doesn't expose materials in filter-meta
  const priceMax = meta?.priceRange?.max ?? 500000;

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleMaterialToggle = (material: string) => {
    const newMaterials = localFilters.materials.includes(material)
      ? localFilters.materials.filter(m => m !== material)
      : [...localFilters.materials, material];
    setLocalFilters({ ...localFilters, materials: newMaterials });
  };

  const handleStyleToggle = (style: string) => {
    const newStyles = localFilters.styleTags.includes(style)
      ? localFilters.styleTags.filter(s => s !== style)
      : [...localFilters.styleTags, style];
    setLocalFilters({ ...localFilters, styleTags: newStyles });
  };

  const effectiveMax = artisansOnly ? DEFAULT_ARTISAN_FILTERS.priceRange[1] : priceMax;
  const priceInvalid =
    localFilters.priceRange[1] < effectiveMax && Number(localFilters.priceRange[0]) > Number(localFilters.priceRange[1]);

  const handleApply = () => {
    if (priceInvalid) return;
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    const clearedFilters: FilterState = {
      priceRange: [0, artisansOnly ? DEFAULT_ARTISAN_FILTERS.priceRange[1] : priceMax],
      materials: [],
      styleTags: [],
      deliveryEstimate: null,
      country: null,
      state: null,
      minRating: null,
      availableOnly: false,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFilterCount = 
    (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < priceMax ? 1 : 0) +
    localFilters.materials.length +
    localFilters.styleTags.length +
    (localFilters.deliveryEstimate ? 1 : 0) +
    (localFilters.country ? 1 : 0) +
    (localFilters.state ? 1 : 0) +
    (localFilters.minRating ? 1 : 0) +
    (localFilters.availableOnly ? 1 : 0);

  const selectedCountry = countries.find((c) => c.name === localFilters.country);

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) setLocalFilters(filters); setOpen(o); }}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] sm:w-[400px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Filter Results
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 text-xs">
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <div className="overflow-y-auto py-4 pb-6 space-y-6">
          {/* Location */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Location</Label>
            <div className="space-y-2">
              <Select
                value={localFilters.country ?? "any"}
                onValueChange={(v) =>
                  setLocalFilters({ ...localFilters, country: v === "any" ? null : v, state: null })
                }
              >
                <SelectTrigger aria-label="Filter by country"><SelectValue placeholder="Any country" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any country</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCountry ? (
                <Select
                  value={localFilters.state ?? "any"}
                  onValueChange={(v) => setLocalFilters({ ...localFilters, state: v === "any" ? null : v })}
                >
                  <SelectTrigger aria-label="Filter by state"><SelectValue placeholder="Any state" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any state</SelectItem>
                    {selectedCountry.states.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select disabled>
                  <SelectTrigger aria-label="Filter by state">
                    <SelectValue placeholder="Select a country first" />
                  </SelectTrigger>
                </Select>
              )}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Price Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  aria-label="Minimum price"
                  placeholder="Min"
                  className="pl-7"
                  value={localFilters.priceRange[0] > 0 ? localFilters.priceRange[0] : ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? 0 : Math.max(0, Number(e.target.value) || 0);
                    setLocalFilters({ ...localFilters, priceRange: [v, localFilters.priceRange[1]] });
                  }}
                />
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  aria-label="Maximum price"
                  placeholder="Max"
                  className="pl-7"
                  value={localFilters.priceRange[1] < priceMax ? localFilters.priceRange[1] : ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? priceMax : Math.max(0, Number(e.target.value) || 0);
                    setLocalFilters({ ...localFilters, priceRange: [localFilters.priceRange[0], v] });
                  }}
                />
              </div>
            </div>
          </div>

          {priceInvalid && (
            <p className="-mt-4 text-sm text-destructive" role="alert">Min price can't be higher than max price.</p>
          )}

          {/* Rating */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Artisan Rating</Label>
            <div className="flex flex-wrap gap-2">
              {[null, 3, 4].map((r) => {
                const selected = (localFilters.minRating ?? null) === r;
                return (
                  <Badge
                    key={String(r)}
                    variant={selected ? "default" : "outline"}
                    className={
                      selected
                        ? "cursor-pointer px-3 py-1"
                        : "cursor-pointer px-3 py-1 border border-border bg-transparent text-foreground"
                    }
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setLocalFilters({ ...localFilters, minRating: r })}
                  >
                    {r ? `${r}★ & above` : "Any"}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="available-only" className="text-sm font-semibold">Only artisans with products</Label>
            <Switch
              id="available-only"
              className="shrink-0"
              checked={!!localFilters.availableOnly}
              onCheckedChange={(v) => setLocalFilters({ ...localFilters, availableOnly: v })}
            />
          </div>

          {!artisansOnly && <>
          {/* Materials */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Materials</Label>
            <div className="grid grid-cols-2 gap-2">
              {materialOptions.map((material) => (
                <label
                  key={material.id}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <Checkbox
                    checked={localFilters.materials.includes(material.id)}
                    onCheckedChange={() => handleMaterialToggle(material.id)}
                  />
                  <span className="text-sm">{material.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Style Tags */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Style Tags</Label>
            <div className="flex flex-wrap gap-2">
              {styleTagOptions.map((style) => (
                <Badge
                  key={style.id}
                  variant={localFilters.styleTags.includes(style.id) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleStyleToggle(style.id)}
                >
                  {style.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Delivery Estimates */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Delivery Estimates</Label>
            <div className="space-y-2">
              {DELIVERY_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <Checkbox
                    checked={localFilters.deliveryEstimate === option.id}
                    onCheckedChange={(checked) => 
                      setLocalFilters({ 
                        ...localFilters, 
                        deliveryEstimate: checked ? option.id : null 
                      })
                    }
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          </>}

          <div className="flex gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => { setLocalFilters(filters); setOpen(false); }} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={priceInvalid} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterDrawer;
