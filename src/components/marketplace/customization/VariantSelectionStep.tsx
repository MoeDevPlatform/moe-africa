import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  name: string;
  type: "color" | "material" | "design";
  value: string;
  imageUrl?: string;
  priceModifier: number;
}

interface VariantSelectionStepProps {
  variants: Variant[];
  selectedVariants: Record<string, string>;
  onVariantSelect: (type: string, variantId: string) => void;
}

const VariantSelectionStep = ({ variants, selectedVariants, onVariantSelect }: VariantSelectionStepProps) => {
  const groupedVariants = variants.reduce((acc, variant) => {
    if (!acc[variant.type]) acc[variant.type] = [];
    acc[variant.type].push(variant);
    return acc;
  }, {} as Record<string, Variant[]>);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Customize Your Product</h3>
        <p className="text-sm text-muted-foreground">Select your preferred variants. Prices update automatically.</p>
      </div>

      {Object.entries(groupedVariants).map(([type, items]) => (
        <div key={type} className="space-y-3">
          <Label className="text-sm font-medium capitalize">{type}</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {items.map((variant) => {
              const isSelected = selectedVariants[type] === variant.id;
              return (
                <button
                  key={variant.id}
                  onClick={() => onVariantSelect(type, variant.id)}
                  className={cn(
                    "relative border-2 rounded-lg p-3 text-left transition-all hover:border-primary",
                    isSelected ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  {variant.imageUrl && (
                    <div className="aspect-square rounded-md overflow-hidden mb-2 bg-muted">
                      <img src={variant.imageUrl} alt={variant.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  {type === "color" && !variant.imageUrl && (
                    <div 
                      className="aspect-square rounded-md mb-2 border" 
                      style={{ backgroundColor: variant.value }}
                    />
                  )}
                  <p className="font-medium text-xs mb-1">{variant.name}</p>
                  {variant.priceModifier !== 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {variant.priceModifier > 0 ? '+' : ''}₦{variant.priceModifier.toLocaleString()}
                    </Badge>
                  )}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VariantSelectionStep;
