import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import VariantSelectionStep from "./customization/VariantSelectionStep";
import SizeSelectionStep from "./customization/SizeSelectionStep";
import BodyTypeSelectionStep from "./customization/BodyTypeSelectionStep";
import MeasurementStep from "./customization/MeasurementStep";
import PricingSidebar from "./customization/PricingSidebar";
import ReviewStep from "./customization/ReviewStep";
import ShoeSizeSelectionStep from "./customization/shoemaking/ShoeSizeSelectionStep";
import FootTypeSelectionStep from "./customization/shoemaking/FootTypeSelectionStep";
import ShoeStyleVariantStep from "./customization/shoemaking/ShoeStyleVariantStep";
import ShoeAdvancedMeasurementStep from "./customization/shoemaking/ShoeAdvancedMeasurementStep";
import { apiGet } from "@/lib/moeApi";

interface CustomizationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: number;
  productId: number;
  productName: string;
  providerName: string;
  basePrice: number;
  estimatedDeliveryDays: number;
  category: string;
  existingCustomization?: any;
  editingCartItemId?: string;
}

const CustomizationFormModal = ({
  open,
  onOpenChange,
  providerId,
  productId,
  productName,
  providerName,
  basePrice,
  estimatedDeliveryDays,
  category,
  existingCustomization,
  editingCartItemId,
}: CustomizationFormModalProps) => {
  const [step, setStep] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedBodyType, setSelectedBodyType] = useState("");
  const [selectedFootType, setSelectedFootType] = useState("");
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const { addItem, updateItem } = useCart();

  const [variants, setVariants] = useState<Array<{
    id: string;
    name: string;
    type: string;
    value?: string;
    imageUrl?: string;
    priceModifier: number;
  }>>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  const isShoemaking = category.toLowerCase().includes("shoe");
  const totalSteps = 5;

  // Load variants from API
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!open) return;
      setIsLoadingVariants(true);
      try {
        const json = await apiGet<any>(`/products/${productId}/variants`);
        const arr = (json?.data ?? json) as any[];
        if (!cancelled) {
          setVariants(
            (arr ?? []).map((v) => ({
              id: String(v.id),
              name: String(v.name ?? ""),
              type: String(v.type ?? ""),
              value: v.value != null ? String(v.value) : undefined,
              imageUrl: (typeof v.imageUrl === "string" ? v.imageUrl : v.imageUrl?.url) ?? undefined,
              priceModifier: typeof v.priceModifier === "number" ? v.priceModifier : 0,
            }))
          );
        }
      } catch (e) {
        if (!cancelled) setVariants([]);
      } finally {
        if (!cancelled) setIsLoadingVariants(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [open, productId]);

  // Load existing customization data when editing
  useEffect(() => {
    if (existingCustomization && open) {
      setSelectedSize(existingCustomization.size || "");
      setSelectedBodyType(existingCustomization.bodyType || "");
      // Parse variants from string if needed
      // This is a simplified version - adjust based on your data structure
    }
  }, [existingCustomization, open]);
  const progress = (step / totalSteps) * 100;

  // Calculate dynamic pricing
  const variantModifiers = Object.values(selectedVariants).reduce((sum, variantId) => {
    const variant = variants.find((v) => v.id === variantId);
    return sum + (variant?.priceModifier || 0);
  }, 0);
  const customizationFee = (selectedBodyType || Object.keys(measurements).length > 0) ? 2500 : 0;

  const handleVariantSelect = (type: string, variantId: string) => {
    setSelectedVariants(prev => ({ ...prev, [type]: variantId }));
  };

  const handleMeasurementChange = (field: string, value: string) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const cartItem = {
      id: editingCartItemId || Date.now().toString(),
      productId,
      productName,
      providerId,
      providerName,
      basePrice,
      finalPrice: basePrice + variantModifiers + customizationFee,
      category: category as "tailoring" | "shoemaking",
      selectedSize,
      selectedBodyType: isShoemaking ? selectedFootType : selectedBodyType,
      selectedVariants,
      measurements,
      notes,
      quantity: 1,
    };

    if (editingCartItemId) {
      updateItem(editingCartItemId, cartItem);
      toast({
        title: "Cart updated! 🎉",
        description: "Your customization has been updated.",
      });
    } else {
      addItem(cartItem);
      toast({
        title: "Added to cart! 🎉",
        description: `Your custom ${productName} has been added to your cart.`,
      });
    }
    
    onOpenChange(false);
    setStep(1);
  };

  const canProceed = () => {
    if (isShoemaking) {
      if (step === 1) return selectedSize !== "";
      if (step === 2) return selectedFootType !== "";
      if (step === 3) return Object.keys(selectedVariants).length > 0;
      return true;
    } else {
      if (step === 1) return Object.keys(selectedVariants).length > 0;
      if (step === 2) return selectedSize !== "";
      if (step === 3) return selectedBodyType !== "";
      return true;
    }
  };

  const stepTitles = isShoemaking 
    ? [
        "Select Shoe Size",
        "Foot Type",
        "Style & Variants",
        "Advanced Measurements",
        "Review & Add to Cart"
      ]
    : [
        "Customize Product",
        "Select Size",
        "Body Type",
        "Measurements & Details",
        "Review & Add to Cart"
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[85vh] p-0 gap-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full overflow-hidden">
          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden">
            <DialogHeader className="p-4 pb-3 border-b bg-background flex-shrink-0">
              <div className="space-y-3">
                <DialogTitle className="text-xl font-display">
                  {stepTitles[step - 1]}
                </DialogTitle>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Step {step} of {totalSteps}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 pb-20">
              {isShoemaking ? (
                <>
                  {step === 1 && (
                    <ShoeSizeSelectionStep
                      selectedSize={selectedSize}
                      onSizeSelect={setSelectedSize}
                      onNeedHelp={() => setStep(2)}
                    />
                  )}

                  {step === 2 && (
                    <FootTypeSelectionStep
                      selectedFootType={selectedFootType}
                      onFootTypeSelect={setSelectedFootType}
                    />
                  )}

                  {step === 3 && (
                    <ShoeStyleVariantStep
                      variants={variants}
                      selectedVariants={selectedVariants}
                      onVariantSelect={handleVariantSelect}
                    />
                  )}

                  {step === 4 && (
                    <ShoeAdvancedMeasurementStep
                      measurements={measurements}
                      onMeasurementChange={handleMeasurementChange}
                      notes={notes}
                      onNotesChange={setNotes}
                    />
                  )}

                  {step === 5 && (
                    <ReviewStep
                      selectedVariants={selectedVariants}
                      selectedSize={selectedSize}
                      selectedBodyType={selectedFootType}
                      measurements={measurements}
                      notes={notes}
                      variants={variants}
                      basePrice={basePrice}
                    />
                  )}
                </>
              ) : (
                <>
                  {step === 1 && (
                    <VariantSelectionStep
                      variants={variants}
                      selectedVariants={selectedVariants}
                      onVariantSelect={handleVariantSelect}
                    />
                  )}

                  {step === 2 && (
                    <SizeSelectionStep
                      selectedSize={selectedSize}
                      onSizeSelect={setSelectedSize}
                      onNeedHelp={() => setStep(3)}
                    />
                  )}

                  {step === 3 && (
                    <BodyTypeSelectionStep
                      selectedBodyType={selectedBodyType}
                      onBodyTypeSelect={setSelectedBodyType}
                    />
                  )}

                  {step === 4 && (
                    <MeasurementStep
                      measurements={measurements}
                      onMeasurementChange={handleMeasurementChange}
                      notes={notes}
                      onNotesChange={setNotes}
                    />
                  )}

                  {step === 5 && (
                    <ReviewStep
                      selectedVariants={selectedVariants}
                      selectedSize={selectedSize}
                      selectedBodyType={selectedBodyType}
                      measurements={measurements}
                      notes={notes}
                      variants={variants}
                      basePrice={basePrice}
                    />
                  )}
                </>
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
                {step < totalSteps ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceed() || (step === 1 && isLoadingVariants)}
                    className="gap-2"
                    size="sm"
                  >
                    Next Step
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed() || isLoadingVariants}
                    className="bg-primary gap-2"
                    size="sm"
                  >
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
              customizationFee={customizationFee}
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

export default CustomizationFormModal;
