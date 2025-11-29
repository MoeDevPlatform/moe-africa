import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface ShoeStyleVariantStepProps {
  selectedVariants: Record<string, string>;
  onVariantSelect: (type: string, variantId: string) => void;
  variants: Array<{
    id: string;
    name: string;
    type: string;
    priceModifier: number;
    imageUrl?: string;
  }>;
}

const ShoeStyleVariantStep = ({
  selectedVariants,
  onVariantSelect,
  variants,
}: ShoeStyleVariantStepProps) => {
  const variantsByType = variants.reduce((acc, variant) => {
    if (!acc[variant.type]) acc[variant.type] = [];
    acc[variant.type].push(variant);
    return acc;
  }, {} as Record<string, typeof variants>);

  const typeLabels = {
    material: "Material",
    color: "Color",
    sole: "Sole Type",
    heel: "Heel Height",
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-display font-semibold mb-1">Select Style & Variants</h3>
        <p className="text-sm text-muted-foreground">
          Choose materials, colors, and design elements
        </p>
      </div>

      {Object.entries(variantsByType).map(([type, items]) => (
        <div key={type}>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            {typeLabels[type as keyof typeof typeLabels]}
            <Badge variant="outline" className="text-xs">
              {items.length} options
            </Badge>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((variant) => {
              const isSelected = selectedVariants[type] === variant.id;
              return (
                <Card
                  key={variant.id}
                  className={`p-3 cursor-pointer transition-all hover:border-primary relative ${
                    isSelected ? "border-primary bg-primary/5 shadow-sm" : ""
                  }`}
                  onClick={() => onVariantSelect(type, variant.id)}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    </div>
                  )}

                  {variant.imageUrl && (
                    <div className="aspect-square rounded-md overflow-hidden mb-2 bg-muted">
                      <img
                        src={variant.imageUrl}
                        alt={variant.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="text-center">
                    <p className="font-medium text-xs mb-1">{variant.name}</p>
                    {variant.priceModifier !== 0 && (
                      <Badge
                        variant={variant.priceModifier > 0 ? "secondary" : "outline"}
                        className="text-[10px] h-4"
                      >
                        {variant.priceModifier > 0 ? "+" : ""}₦
                        {Math.abs(variant.priceModifier).toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShoeStyleVariantStep;
