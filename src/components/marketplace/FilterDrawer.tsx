import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, X } from "lucide-react";

export interface FilterState {
  priceRange: [number, number];
  materials: string[];
  styleTags: string[];
  deliveryEstimate: string | null;
}

interface FilterDrawerProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  children?: React.ReactNode;
}

const MATERIALS = [
  { id: "cotton", label: "Cotton" },
  { id: "linen", label: "Linen" },
  { id: "aso-oke", label: "Aso-Oke" },
  { id: "leather", label: "Leather" },
  { id: "suede", label: "Suede" },
  { id: "denim", label: "Denim" },
  { id: "silk", label: "Silk" },
  { id: "wool", label: "Wool" },
];

const STYLE_TAGS = [
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

const FilterDrawer = ({ filters, onFiltersChange, children }: FilterDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

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

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    const clearedFilters: FilterState = {
      priceRange: [0, 500000],
      materials: [],
      styleTags: [],
      deliveryEstimate: null,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFilterCount = 
    (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < 500000 ? 1 : 0) +
    localFilters.materials.length +
    localFilters.styleTags.length +
    (localFilters.deliveryEstimate ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
        
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Price Range */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Price Range</Label>
            <div className="space-y-3 px-1">
              <Slider
                value={localFilters.priceRange}
                onValueChange={(value) => setLocalFilters({ ...localFilters, priceRange: value as [number, number] })}
                max={500000}
                step={5000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₦{localFilters.priceRange[0].toLocaleString()}</span>
                <span>₦{localFilters.priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Materials */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Materials</Label>
            <div className="grid grid-cols-2 gap-2">
              {MATERIALS.map((material) => (
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
              {STYLE_TAGS.map((style) => (
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
        </div>

        <SheetFooter className="border-t pt-4 gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default FilterDrawer;
