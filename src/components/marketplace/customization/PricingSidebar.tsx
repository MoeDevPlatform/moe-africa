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
    <Card className="sticky top-6 shadow-lg">
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="font-display font-semibold text-lg mb-1">{productName}</h3>
          <p className="text-sm text-muted-foreground">by {providerName}</p>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Base Price</span>
            <span className="font-medium">₦{basePrice.toLocaleString()}</span>
          </div>
          
          {variantModifiers !== 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Variant Selections</span>
              <span className={variantModifiers > 0 ? "text-primary font-medium" : "text-green-600 font-medium"}>
                {variantModifiers > 0 ? '+' : ''}₦{variantModifiers.toLocaleString()}
              </span>
            </div>
          )}

          {customizationFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Custom Tailoring</span>
              <span className="text-primary font-medium">+₦{customizationFee.toLocaleString()}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg">Total</span>
          <span className="font-display font-bold text-2xl text-primary">
            ₦{total.toLocaleString()}
          </span>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-3 text-sm">
            <Truck className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">
              Estimated delivery: <strong className="text-foreground">~{estimatedDeliveryDays} days</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Quality guaranteed</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Made to order</span>
          </div>
        </div>

        <Badge variant="secondary" className="w-full justify-center py-2">
          💡 Price updates as you customize
        </Badge>
      </CardContent>
    </Card>
  );
};

export default PricingSidebar;
