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

// Mock variants for tailoring - API: GET /products/{id}/variants
const mockTailoringVariants = [
  { id: "v1", name: "Blue & Gold", type: "color" as const, value: "#1e40af", priceModifier: 0, imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200" },
  { id: "v2", name: "Red & Green", type: "color" as const, value: "#dc2626", priceModifier: 2000, imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea3c8501?w=200" },
  { id: "v3", name: "Premium Cotton", type: "material" as const, value: "cotton", priceModifier: 3000 },
  { id: "v4", name: "Silk Blend", type: "material" as const, value: "silk", priceModifier: 8000 },
  { id: "v5", name: "Modern Cut", type: "design" as const, value: "modern", priceModifier: 0 },
  { id: "v6", name: "Traditional Style", type: "design" as const, value: "traditional", priceModifier: 1500 },
];

// Mock variants for shoemaking
const mockShoemakingVariants = [
  { id: "s1", name: "Genuine Leather", type: "material" as const, value: "leather", priceModifier: 5000 },
  { id: "s2", name: "Suede", type: "material" as const, value: "suede", priceModifier: 4000 },
  { id: "s3", name: "Canvas", type: "material" as const, value: "canvas", priceModifier: 0 },
  { id: "s4", name: "Black", type: "color" as const, value: "#000000", priceModifier: 0 },
  { id: "s5", name: "Brown", type: "color" as const, value: "#8B4513", priceModifier: 0 },
  { id: "s6", name: "Tan", type: "color" as const, value: "#D2B48C", priceModifier: 1000 },
  { id: "s7", name: "Rubber Sole", type: "sole" as const, value: "rubber", priceModifier: 0 },
  { id: "s8", name: "Leather Sole", type: "sole" as const, value: "leather-sole", priceModifier: 3000 },
  { id: "s9", name: "Flat (0cm)", type: "heel" as const, value: "flat", priceModifier: 0 },
  { id: "s10", name: "Low (2-3cm)", type: "heel" as const, value: "low", priceModifier: 1500 },
  { id: "s11", name: "Medium (5-7cm)", type: "heel" as const, value: "medium", priceModifier: 2500 },
];

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

  const isShoemaking = category.toLowerCase().includes("shoe");
  const mockVariants = isShoemaking ? mockShoemakingVariants : mockTailoringVariants;
  const totalSteps = 5;

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
    const variant = mockVariants.find(v => v.id === variantId);
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
    if (step === 1) return Object.keys(selectedVariants).length > 0;
    if (step === 2) return selectedSize !== "";
    if (step === 3) return isShoemaking ? selectedFootType !== "" : selectedBodyType !== "";
    return true;
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
                      variants={mockVariants}
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
                      variants={mockVariants}
                      basePrice={basePrice}
                    />
                  )}
                </>
              ) : (
                <>
                  {step === 1 && (
                    <VariantSelectionStep
                      variants={mockVariants}
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
                      variants={mockVariants}
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
                    disabled={!canProceed()}
                    className="gap-2"
                    size="sm"
                  >
                    Next Step
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed()}
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
