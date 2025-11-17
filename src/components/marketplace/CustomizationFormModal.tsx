import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import VariantSelectionStep from "./customization/VariantSelectionStep";
import SizeSelectionStep from "./customization/SizeSelectionStep";
import BodyTypeSelectionStep from "./customization/BodyTypeSelectionStep";
import MeasurementStep from "./customization/MeasurementStep";
import PricingSidebar from "./customization/PricingSidebar";
import ReviewStep from "./customization/ReviewStep";

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
}

// Mock variants - API: GET /products/{id}/variants
const mockVariants = [
  { id: "v1", name: "Blue & Gold", type: "color" as const, value: "#1e40af", priceModifier: 0, imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200" },
  { id: "v2", name: "Red & Green", type: "color" as const, value: "#dc2626", priceModifier: 2000, imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea3c8501?w=200" },
  { id: "v3", name: "Premium Cotton", type: "material" as const, value: "cotton", priceModifier: 3000 },
  { id: "v4", name: "Silk Blend", type: "material" as const, value: "silk", priceModifier: 8000 },
  { id: "v5", name: "Modern Cut", type: "design" as const, value: "modern", priceModifier: 0 },
  { id: "v6", name: "Traditional Style", type: "design" as const, value: "traditional", priceModifier: 1500 },
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
}: CustomizationFormModalProps) => {
  const [step, setStep] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedBodyType, setSelectedBodyType] = useState("");
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const totalSteps = 5;
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
    // API: POST /orders/customizations or POST /cart
    toast({
      title: "Added to cart! 🎉",
      description: `Your custom ${productName} has been added to your cart.`,
    });
    onOpenChange(false);
    setStep(1);
  };

  const canProceed = () => {
    if (step === 1) return Object.keys(selectedVariants).length > 0;
    if (step === 2) return selectedSize !== "";
    if (step === 3) return selectedBodyType !== "";
    return true;
  };

  const stepTitles = [
    "Customize Product",
    "Select Size",
    "Body Type",
    "Measurements & Details",
    "Review & Add to Cart"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 gap-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
          {/* Main Content */}
          <div className="lg:col-span-2 overflow-y-auto">
            <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
              <div className="space-y-4">
                <DialogTitle className="text-2xl font-display">
                  {stepTitles[step - 1]}
                </DialogTitle>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Step {step} of {totalSteps}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            </DialogHeader>

            <div className="p-6">
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
            </div>

            {/* Navigation Footer */}
            <div className="flex justify-between gap-4 border-t p-6 bg-muted/30 sticky bottom-0">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="gap-2"
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
                  >
                    Next Step
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed()}
                    className="bg-primary gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Sidebar */}
          <div className="hidden lg:block border-l bg-muted/30 p-6">
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
