import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ReviewStepProps {
  selectedVariants: Record<string, string>;
  selectedSize: string;
  selectedBodyType: string;
  measurements: Record<string, string>;
  notes: string;
  variants: Array<{ id: string; name: string; type: string; priceModifier: number }>;
  basePrice: number;
}

const ReviewStep = ({
  selectedVariants,
  selectedSize,
  selectedBodyType,
  measurements,
  notes,
  variants,
  basePrice
}: ReviewStepProps) => {
  const selectedVariantDetails = Object.entries(selectedVariants).map(([type, variantId]) => {
    const variant = variants.find(v => v.id === variantId);
    return { type, variant };
  });

  const variantTotal = selectedVariantDetails.reduce((sum, { variant }) => 
    sum + (variant?.priceModifier || 0), 0
  );
  
  const customizationFee = (selectedBodyType || Object.keys(measurements).length > 0) ? 2500 : 0;
  const totalPrice = basePrice + variantTotal + customizationFee;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Review Your Customization</h3>
        <p className="text-sm text-muted-foreground">Please review all selections before adding to cart</p>
      </div>

      <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
        {/* Variants */}
        {selectedVariantDetails.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Selected Variants</h4>
            <div className="space-y-1.5">
              {selectedVariantDetails.map(({ type, variant }) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm capitalize text-muted-foreground">{type}:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{variant?.name}</span>
                    {variant && variant.priceModifier !== 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {variant.priceModifier > 0 ? '+' : ''}₦{variant.priceModifier.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Size */}
        <div>
          <h4 className="font-semibold text-sm mb-2">Size Selection</h4>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm px-3 py-1">{selectedSize}</Badge>
          </div>
        </div>

        <Separator />

        {/* Body Type */}
        {selectedBodyType && (
          <>
            <div>
              <h4 className="font-semibold text-sm mb-2">Body Type</h4>
              <Badge className="capitalize text-xs">{selectedBodyType}</Badge>
            </div>
            <Separator />
          </>
        )}

        {/* Measurements */}
        {Object.keys(measurements).length > 0 && (
          <>
            <div>
              <h4 className="font-semibold text-sm mb-2">Custom Measurements</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(measurements).map(([field, value]) => (
                  value && (
                    <div key={field} className="bg-card rounded-md p-2 border">
                      <p className="text-[10px] text-muted-foreground capitalize">{field}</p>
                      <p className="font-medium text-sm">{value} cm</p>
                    </div>
                  )
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Notes */}
        {notes && (
          <>
            <div>
              <h4 className="font-semibold text-sm mb-2">Additional Notes</h4>
              <p className="text-xs text-muted-foreground bg-card rounded-md p-3 border">{notes}</p>
            </div>
            <Separator />
          </>
        )}

        {/* Price Summary */}
        <div className="bg-primary/5 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Base Price:</span>
            <span>₦{basePrice.toLocaleString()}</span>
          </div>
          {variantTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Variant Fees:</span>
              <span>₦{variantTotal.toLocaleString()}</span>
            </div>
          )}
          {customizationFee > 0 && (
            <div className="flex justify-between text-sm">
              <span>Customization Fee:</span>
              <span>₦{customizationFee.toLocaleString()}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total Price:</span>
            <span className="text-primary">₦{totalPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
