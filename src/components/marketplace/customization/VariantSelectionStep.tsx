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
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-display font-semibold mb-2">Customize Your Product</h3>
        <p className="text-muted-foreground">Select your preferred variants. Prices update automatically.</p>
      </div>

      {Object.entries(groupedVariants).map(([type, items]) => (
        <div key={type} className="space-y-4">
          <Label className="text-base capitalize">{type}</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((variant) => {
              const isSelected = selectedVariants[type] === variant.id;
              return (
                <button
                  key={variant.id}
                  onClick={() => onVariantSelect(type, variant.id)}
                  className={cn(
                    "relative border-2 rounded-xl p-4 text-left transition-all hover:border-primary",
                    isSelected ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  {variant.imageUrl && (
                    <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-muted">
                      <img src={variant.imageUrl} alt={variant.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  {type === "color" && !variant.imageUrl && (
                    <div 
                      className="aspect-square rounded-lg mb-3 border" 
                      style={{ backgroundColor: variant.value }}
                    />
                  )}
                  <p className="font-medium text-sm mb-1">{variant.name}</p>
                  {variant.priceModifier !== 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {variant.priceModifier > 0 ? '+' : ''}₦{variant.priceModifier.toLocaleString()}
                    </Badge>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
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
