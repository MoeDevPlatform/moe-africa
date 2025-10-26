import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomizationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: number;
  category: string;
}

const CustomizationFormModal = ({ open, onOpenChange, providerId, category }: CustomizationFormModalProps) => {
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const handleSubmit = () => {
    toast({
      title: "Order request sent!",
      description: "The artisan will review your requirements and get back to you soon.",
    });
    onOpenChange(false);
    setStep(1);
  };

  // Tailoring-specific form
  if (category === "tailoring") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">
              {step === 1 && "Select Body Type"}
              {step === 2 && "Choose Clothing Type"}
              {step === 3 && "Fit Preference"}
              {step === 4 && "Measurements"}
              {step === 5 && "Final Details"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-6">
            {step === 1 && (
              <RadioGroup defaultValue="standard">
                <div className="grid grid-cols-2 gap-4">
                  {["Standard", "Petite", "Tall", "Plus Size"].map((type) => (
                    <div key={type} className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
                      <RadioGroupItem value={type.toLowerCase().replace(" ", "-")} id={type} />
                      <Label htmlFor={type} className="cursor-pointer flex-1">{type}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Label>Select Clothing Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suit">Suit</SelectItem>
                    <SelectItem value="dress">Dress</SelectItem>
                    <SelectItem value="shirt">Shirt</SelectItem>
                    <SelectItem value="trousers">Trousers</SelectItem>
                    <SelectItem value="traditional">Traditional Attire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 3 && (
              <RadioGroup defaultValue="regular">
                <div className="space-y-3">
                  {[
                    { value: "slim", label: "Slim Fit", desc: "Fitted close to the body" },
                    { value: "regular", label: "Regular Fit", desc: "Comfortable standard fit" },
                    { value: "relaxed", label: "Relaxed Fit", desc: "Loose and comfortable" },
                    { value: "custom", label: "Custom Fit", desc: "Specify exact measurements" },
                  ].map((fit) => (
                    <div key={fit.value} className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
                      <RadioGroupItem value={fit.value} id={fit.value} />
                      <div className="flex-1">
                        <Label htmlFor={fit.value} className="cursor-pointer font-semibold">{fit.label}</Label>
                        <p className="text-sm text-muted-foreground">{fit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-4 block font-semibold">Quick Size Selection</Label>
                  <div className="flex gap-2 flex-wrap">
                    {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                      <Button key={size} variant="outline" className="w-16">{size}</Button>
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <Label className="mb-4 block font-semibold">Or Enter Custom Measurements (cm)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="chest">Chest</Label>
                      <Input id="chest" type="number" placeholder="e.g. 95" />
                    </div>
                    <div>
                      <Label htmlFor="waist">Waist</Label>
                      <Input id="waist" type="number" placeholder="e.g. 85" />
                    </div>
                    <div>
                      <Label htmlFor="hips">Hips</Label>
                      <Input id="hips" type="number" placeholder="e.g. 100" />
                    </div>
                    <div>
                      <Label htmlFor="shoulder">Shoulder Width</Label>
                      <Input id="shoulder" type="number" placeholder="e.g. 45" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="notes">Special Requests or Notes</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Any specific details, fabric preferences, or design elements..." 
                    className="min-h-32"
                  />
                </div>

                <div>
                  <Label>Upload Inspiration Images (Optional)</Label>
                  <div className="mt-2 border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between gap-4 border-t pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <div className="flex-1" />
            {step < 5 ? (
              <Button onClick={() => setStep(step + 1)}>
                Next Step
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="bg-primary">
                Submit Order Request
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Generic form for other categories
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Custom Order Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-6">
          <div>
            <Label htmlFor="description">Describe what you want</Label>
            <Textarea 
              id="description" 
              placeholder="Please provide detailed information about your requirements..." 
              className="min-h-32"
            />
          </div>
          <div>
            <Label>Upload reference images</Label>
            <div className="mt-2 border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload images</p>
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full">Submit Request</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomizationFormModal;
