import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Truck, Shield, Sparkles } from "lucide-react";

interface PricingSidebarProps {
  basePrice: number;
  variantModifiers: number;
  customizationFee: number;
  estimatedDeliveryDays: number;
  productName: string;
  providerName: string;
}

const PricingSidebar = ({
  basePrice,
  variantModifiers,
  customizationFee,
  estimatedDeliveryDays,
  productName,
  providerName,
}: PricingSidebarProps) => {
  const total = basePrice + variantModifiers + customizationFee;

  return (
    <Card className="sticky top-4 shadow-lg">
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="font-display font-semibold text-base mb-0.5">{productName}</h3>
          <p className="text-xs text-muted-foreground">by {providerName}</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Base Price</span>
            <span className="font-medium">₦{basePrice.toLocaleString()}</span>
          </div>
          
          {variantModifiers !== 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Variant Selections</span>
              <span className={variantModifiers > 0 ? "text-primary font-medium" : "text-green-600 font-medium"}>
                {variantModifiers > 0 ? '+' : ''}₦{variantModifiers.toLocaleString()}
              </span>
            </div>
          )}

          {customizationFee > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Custom Tailoring</span>
              <span className="text-primary font-medium">+₦{customizationFee.toLocaleString()}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="font-semibold text-base">Total</span>
          <span className="font-display font-bold text-xl text-primary">
            ₦{total.toLocaleString()}
          </span>
        </div>

        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center gap-2 text-xs">
            <Truck className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">
              Est. delivery: <strong className="text-foreground">~{estimatedDeliveryDays} days</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Shield className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Quality guaranteed</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Made to order</span>
          </div>
        </div>

        <Badge variant="secondary" className="w-full justify-center py-1.5 text-xs">
          💡 Price updates as you customize
        </Badge>
      </CardContent>
    </Card>
  );
};

export default PricingSidebar;
