import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useNavigate } from "react-router-dom";
import { Shirt, Footprints, Gem, Sofa, Palette, Package } from "lucide-react";

interface PreferenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PreferenceModal = ({ open, onOpenChange }: PreferenceModalProps) => {
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [budget, setBudget] = useState([50000]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const navigate = useNavigate();

  const categories = [
    { id: "clothing", name: "Clothing", icon: Shirt },
    { id: "shoes", name: "Shoes", icon: Footprints },
    { id: "accessories", name: "Accessories", icon: Gem },
    { id: "furniture", name: "Furniture", icon: Sofa },
    { id: "art", name: "Art & Crafts", icon: Palette },
    { id: "other", name: "Other", icon: Package },
  ];

  const styles = ["Modern", "Afrocentric", "Minimalist", "Traditional", "Vintage", "Contemporary"];

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const handleSave = () => {
    // TODO: POST /users/preferences
    onOpenChange(false);
    navigate("/marketplace");
  };

  const handleSkip = () => {
    onOpenChange(false);
    navigate("/marketplace");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">
            {step === 1 && "What are you here for?"}
            {step === 2 && "What's your budget range?"}
            {step === 3 && "Choose your preferred styles"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Select the services or products you're interested in"}
            {step === 2 && "This helps us show you relevant options"}
            {step === 3 && "Pick styles that match your taste"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className={`h-8 w-8 mx-auto mb-3 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium text-sm">{category.name}</p>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div>
                <div className="flex justify-between mb-4">
                  <span className="text-sm text-muted-foreground">₦0</span>
                  <span className="text-lg font-semibold text-primary">₦{budget[0].toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">₦500,000+</span>
                </div>
                <Slider
                  value={budget}
                  onValueChange={setBudget}
                  max={500000}
                  step={10000}
                  className="w-full"
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                We'll show you products within your preferred range
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-wrap gap-3">
              {styles.map((style) => {
                const isSelected = selectedStyles.includes(style);
                return (
                  <Badge
                    key={style}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer px-6 py-3 text-base transition-all duration-300"
                    onClick={() => toggleStyle(style)}
                  >
                    {style}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between gap-4">
          <Button variant="ghost" onClick={handleSkip}>
            Skip for Now
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSave} className="bg-primary">
                Save Preferences
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreferenceModal;
