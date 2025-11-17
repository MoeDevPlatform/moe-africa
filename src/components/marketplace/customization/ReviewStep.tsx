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
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-display font-semibold mb-2">Review Your Customization</h3>
        <p className="text-muted-foreground">Please review all selections before adding to cart</p>
      </div>

      <div className="border rounded-xl p-6 space-y-6 bg-muted/30">
        {/* Variants */}
        {selectedVariantDetails.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Selected Variants</h4>
            <div className="space-y-2">
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
          <h4 className="font-semibold mb-3">Size Selection</h4>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-base px-4 py-2">{selectedSize}</Badge>
          </div>
        </div>

        <Separator />

        {/* Body Type */}
        {selectedBodyType && (
          <>
            <div>
              <h4 className="font-semibold mb-3">Body Type</h4>
              <Badge className="capitalize">{selectedBodyType}</Badge>
            </div>
            <Separator />
          </>
        )}

        {/* Measurements */}
        {Object.keys(measurements).length > 0 && (
          <>
            <div>
              <h4 className="font-semibold mb-3">Custom Measurements</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(measurements).map(([field, value]) => (
                  value && (
                    <div key={field} className="bg-card rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground capitalize">{field}</p>
                      <p className="font-medium">{value} cm</p>
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
              <h4 className="font-semibold mb-3">Additional Notes</h4>
              <p className="text-sm text-muted-foreground bg-card rounded-lg p-4 border">{notes}</p>
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
