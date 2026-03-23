import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import PricingSidebar from "./customization/PricingSidebar";
import CanvasTypeStep from "./customization/canvas/CanvasTypeStep";
import CanvasImageUploadStep from "./customization/canvas/CanvasImageUploadStep";
import CanvasSizeStep, { canvasSizes } from "./customization/canvas/CanvasSizeStep";
import CanvasStyleStep, { frameOptions, finishOptions, paintingStyleOptions } from "./customization/canvas/CanvasStyleStep";
import type { CanvasStyleOptions } from "./customization/canvas/CanvasStyleStep";
import CanvasNotesStep from "./customization/canvas/CanvasNotesStep";
import CanvasReviewStep from "./customization/canvas/CanvasReviewStep";

interface CanvasCustomizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: number;
  productId: number;
  productName: string;
  providerName: string;
  basePrice: number;
  estimatedDeliveryDays: number;
  editingCartItemId?: string;
}

const TOTAL_STEPS = 6;

const stepTitles = [
  "Select Canvas Type",
  "Upload Your Design",
  "Canvas Size",
  "Style & Finishing",
  "Additional Notes",
  "Review & Add to Cart",
];

const CanvasCustomizationModal = ({
  open,
  onOpenChange,
  providerId,
  productId,
  productName,
  providerName,
  basePrice,
  estimatedDeliveryDays,
  editingCartItemId,
}: CanvasCustomizationModalProps) => {
  const [step, setStep] = useState(1);
  const [canvasType, setCanvasType] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [styleOptions, setStyleOptions] = useState<CanvasStyleOptions>({
    frame: "unframed",
    finish: "matte",
    paintingStyle: "realistic",
    colorEnhancement: false,
  });
  const [notes, setNotes] = useState("");

  const { toast } = useToast();
  const { addItem, updateItem } = useCart();

  const progress = (step / TOTAL_STEPS) * 100;

  const sizeData = canvasSizes.find((s) => s.id === selectedSize);
  const frameData = frameOptions.find((f) => f.id === styleOptions.frame);
  const finishData = finishOptions.find((f) => f.id === styleOptions.finish);
  const paintStyleData = paintingStyleOptions.find((p) => p.id === styleOptions.paintingStyle);

  const sizeModifier = sizeData?.priceModifier ?? 0;
  const frameModifier = frameData?.priceModifier ?? 0;
  const finishModifier = finishData?.priceModifier ?? 0;
  const paintModifier = canvasType === "painting" ? (paintStyleData?.priceModifier ?? 0) : 0;
  const colorModifier = styleOptions.colorEnhancement ? 2000 : 0;
  const variantModifiers = sizeModifier + frameModifier + finishModifier + paintModifier + colorModifier;

  const handleStyleChange = (field: keyof CanvasStyleOptions, value: string | boolean) => {
    setStyleOptions((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 1) return canvasType !== "";
    if (step === 2) return uploadedImage !== null;
    if (step === 3) {
      if (selectedSize === "custom") return customWidth !== "" && customHeight !== "";
      return selectedSize !== "";
    }
    return true;
  };

  const handleReset = () => {
    setStep(1);
    setCanvasType("");
    setUploadedImage(null);
    setSelectedSize("");
    setCustomWidth("");
    setCustomHeight("");
    setStyleOptions({ frame: "unframed", finish: "matte", paintingStyle: "realistic", colorEnhancement: false });
    setNotes("");
  };

  const handleSubmit = () => {
    const sizeLabel =
      selectedSize === "custom"
        ? `Custom ${customWidth}×${customHeight} in`
        : `${sizeData?.label} (${sizeData?.dimensions})`;

    const cartItem = {
      id: editingCartItemId || Date.now().toString(),
      productId,
      productName,
      providerId,
      providerName,
      basePrice,
      finalPrice: basePrice + variantModifiers,
      category: "canvas" as const,
      selectedSize: sizeLabel,
      selectedBodyType: canvasType,
      selectedVariants: {
        frame: styleOptions.frame,
        finish: styleOptions.finish,
        ...(canvasType === "painting" ? { style: styleOptions.paintingStyle } : {}),
      },
      measurements: {
        ...(uploadedImage ? { imageUploaded: "yes" } : {}),
        ...(styleOptions.colorEnhancement ? { colorEnhancement: "yes" } : {}),
      },
      notes,
      quantity: 1,
    };

    if (editingCartItemId) {
      updateItem(editingCartItemId, cartItem);
      toast({ title: "Cart updated! 🎨", description: "Your canvas order has been updated." });
    } else {
      addItem(cartItem);
      toast({ title: "Added to cart! 🎨", description: `Your custom ${productName} has been added to your cart.` });
    }

    onOpenChange(false);
    handleReset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) handleReset(); }}>
      <DialogContent className="max-w-7xl h-[85vh] p-0 gap-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full overflow-hidden">
          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden">
            <DialogHeader className="p-4 pb-3 border-b bg-background flex-shrink-0">
              <div className="space-y-3">
                <DialogTitle className="text-xl font-display">{stepTitles[step - 1]}</DialogTitle>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Step {step} of {TOTAL_STEPS}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 pb-20">
              {step === 1 && <CanvasTypeStep selectedType={canvasType} onTypeSelect={setCanvasType} />}
              {step === 2 && (
                <CanvasImageUploadStep
                  uploadedImage={uploadedImage}
                  onImageUpload={setUploadedImage}
                  onImageRemove={() => setUploadedImage(null)}
                />
              )}
              {step === 3 && (
                <CanvasSizeStep
                  selectedSize={selectedSize}
                  onSizeSelect={setSelectedSize}
                  customWidth={customWidth}
                  customHeight={customHeight}
                  onCustomDimensionChange={(field, value) =>
                    field === "width" ? setCustomWidth(value) : setCustomHeight(value)
                  }
                />
              )}
              {step === 4 && (
                <CanvasStyleStep
                  options={styleOptions}
                  onChange={handleStyleChange}
                  canvasType={canvasType}
                />
              )}
              {step === 5 && <CanvasNotesStep notes={notes} onNotesChange={setNotes} />}
              {step === 6 && (
                <CanvasReviewStep
                  canvasType={canvasType}
                  uploadedImage={uploadedImage}
                  selectedSize={selectedSize}
                  customWidth={customWidth}
                  customHeight={customHeight}
                  styleOptions={styleOptions}
                  notes={notes}
                  basePrice={basePrice}
                />
              )}
            </div>

            {/* Navigation Footer */}
            <div className="flex justify-between gap-3 border-t p-4 bg-background/95 backdrop-blur-sm absolute bottom-0 left-0 right-0 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="gap-2"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex gap-2">
                {step < TOTAL_STEPS ? (
                  <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-2" size="sm">
                    Next Step
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} className="bg-primary gap-2" size="sm">
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Sidebar */}
          <div className="hidden lg:block border-l bg-muted/30 p-4 overflow-y-auto">
            <PricingSidebar
              basePrice={basePrice}
              variantModifiers={variantModifiers}
              customizationFee={0}
              estimatedDeliveryDays={estimatedDeliveryDays}
              productName={productName}
              providerName={providerName}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CanvasCustomizationModal;
