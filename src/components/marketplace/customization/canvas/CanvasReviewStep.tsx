import { Badge } from "@/components/ui/badge";
import { ImageIcon, CheckCircle } from "lucide-react";
import { canvasSizes } from "./CanvasSizeStep";
import { frameOptions, finishOptions, paintingStyleOptions } from "./CanvasStyleStep";
import type { CanvasStyleOptions } from "./CanvasStyleStep";

interface CanvasReviewStepProps {
  canvasType: string;
  uploadedImage: string | null;
  selectedSize: string;
  customWidth: string;
  customHeight: string;
  styleOptions: CanvasStyleOptions;
  notes: string;
  basePrice: number;
}

const CanvasReviewStep = ({
  canvasType,
  uploadedImage,
  selectedSize,
  customWidth,
  customHeight,
  styleOptions,
  notes,
  basePrice,
}: CanvasReviewStepProps) => {
  const sizeData = canvasSizes.find((s) => s.id === selectedSize);
  const frameData = frameOptions.find((f) => f.id === styleOptions.frame);
  const finishData = finishOptions.find((f) => f.id === styleOptions.finish);
  const paintStyleData = paintingStyleOptions.find((p) => p.id === styleOptions.paintingStyle);

  const sizeModifier = sizeData?.priceModifier ?? 0;
  const frameModifier = frameData?.priceModifier ?? 0;
  const finishModifier = finishData?.priceModifier ?? 0;
  const paintModifier = paintStyleData?.priceModifier ?? 0;
  const colorModifier = styleOptions.colorEnhancement ? 2000 : 0;

  const totalPrice = basePrice + sizeModifier + frameModifier + finishModifier + paintModifier + colorModifier;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Review Your Order</h3>
        <p className="text-sm text-muted-foreground">Check your selections before adding to cart.</p>
      </div>

      {/* Image Preview */}
      {uploadedImage && (
        <div className="border border-border rounded-xl overflow-hidden">
          <img
            src={uploadedImage}
            alt="Your design"
            className="w-full max-h-40 object-contain bg-muted"
          />
          <p className="text-xs text-muted-foreground px-3 py-2 flex items-center gap-1">
            <ImageIcon className="h-3 w-3" /> Design image uploaded
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
        {[
          { label: "Canvas Type", value: canvasType === "painting" ? "Hand Painting" : "Printed Canvas" },
          {
            label: "Size",
            value: selectedSize === "custom"
              ? `Custom ${customWidth}×${customHeight} in`
              : `${sizeData?.label} (${sizeData?.dimensions})`,
          },
          { label: "Frame", value: frameData?.label ?? "—" },
          { label: "Finish", value: finishData?.label ?? "—" },
          ...(canvasType === "painting" ? [{ label: "Style", value: paintStyleData?.label ?? "—" }] : []),
          { label: "Color Enhancement", value: styleOptions.colorEnhancement ? "Yes (+₦2,000)" : "No" },
          ...(notes ? [{ label: "Notes", value: notes }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-start px-4 py-3 text-sm">
            <span className="text-muted-foreground font-medium w-1/3">{label}</span>
            <span className="text-foreground text-right w-2/3">{value}</span>
          </div>
        ))}
      </div>

      {/* Price Breakdown */}
      <div className="bg-muted/40 rounded-xl p-4 space-y-2">
        <p className="text-sm font-semibold mb-3">Price Breakdown</p>
        {[
          { label: "Base Price", amount: basePrice },
          ...(sizeModifier ? [{ label: `Size (${sizeData?.label})`, amount: sizeModifier }] : []),
          ...(frameModifier ? [{ label: `Frame (${frameData?.label})`, amount: frameModifier }] : []),
          ...(finishModifier ? [{ label: `Finish (${finishData?.label})`, amount: finishModifier }] : []),
          ...(paintModifier ? [{ label: `Style (${paintStyleData?.label})`, amount: paintModifier }] : []),
          ...(colorModifier ? [{ label: "Color Enhancement", amount: colorModifier }] : []),
        ].map(({ label, amount }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span>₦{amount.toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-primary text-lg">₦{totalPrice.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle className="h-4 w-4 text-primary" />
        Your order will be confirmed after artisan review.
      </div>
    </div>
  );
};

export default CanvasReviewStep;
