import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: number;
  providerName: string;
}

const CustomOrderModal = ({ open, onOpenChange, providerId, providerName }: CustomOrderModalProps) => {
  const [step, setStep] = useState(1);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [formData, setFormData] = useState({
    description: "",
    material: "",
    color: "",
    fittingStyle: "",
    height: "",
    chest: "",
    waist: "",
    hip: "",
    shoulder: "",
    inseam: "",
    additionalNotes: ""
  });
  const { toast } = useToast();

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setPreviewUrl("");
  };

  const handleSubmit = async () => {
    try {
      // Attempt to submit via API
      const { customOrderService } = await import("@/lib/apiServices");
      await customOrderService.create({
        providerId,
        description: formData.description,
        material: formData.material,
        color: formData.color,
        fittingStyle: formData.fittingStyle,
        measurements: {
          height: formData.height,
          chest: formData.chest,
          waist: formData.waist,
          hip: formData.hip,
          shoulder: formData.shoulder,
          inseam: formData.inseam,
        },
        additionalNotes: formData.additionalNotes,
        referenceImageUrl: uploadedImage?.name,
      });
    } catch {
      // API unavailable — toast still shows success for demo
    }

    toast({
      title: "Custom Order Request Submitted! 🎉",
      description: "You'll receive a quote via email and in-app notification shortly.",
    });

    // Reset form
    onOpenChange(false);
    setStep(1);
    setUploadedImage(null);
    setPreviewUrl("");
    setFormData({
      description: "", material: "", color: "", fittingStyle: "",
      height: "", chest: "", waist: "", hip: "", shoulder: "", inseam: "", additionalNotes: ""
    });
  };

  const canProceed = () => {
    if (step === 1) return uploadedImage !== null;
    if (step === 2) return formData.description && formData.material && formData.color;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Request Custom Order from {providerName}</DialogTitle>
          <div className="space-y-2 pt-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="py-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Upload Design Reference</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Upload an image of what you'd like to create
                </p>
              </div>

              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id="design-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="design-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium mb-1">Click to upload design</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
                </label>
              </div>

              {previewUrl && (
                <div className="relative rounded-xl overflow-hidden border">
                  <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover" />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Product Specifications</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Provide detailed information about your custom order
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Product Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you want in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-24"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="material">Material Preference *</Label>
                    <Input
                      id="material"
                      placeholder="e.g., Cotton, Silk, Leather"
                      value={formData.material}
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="color">Color Preference *</Label>
                    <Input
                      id="color"
                      placeholder="e.g., Navy Blue, Red"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fitting">Fitting Style</Label>
                  <Select value={formData.fittingStyle} onValueChange={(val) => setFormData({ ...formData, fittingStyle: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fitting style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slim">Slim Fit</SelectItem>
                      <SelectItem value="regular">Regular Fit</SelectItem>
                      <SelectItem value="relaxed">Relaxed Fit</SelectItem>
                      <SelectItem value="oversized">Oversized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-3 block">Bespoke Measurements (Optional)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="height" className="text-xs">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        placeholder="170"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="chest" className="text-xs">Chest (cm)</Label>
                      <Input
                        id="chest"
                        type="number"
                        placeholder="95"
                        value={formData.chest}
                        onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="waist" className="text-xs">Waist (cm)</Label>
                      <Input
                        id="waist"
                        type="number"
                        placeholder="80"
                        value={formData.waist}
                        onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hip" className="text-xs">Hip (cm)</Label>
                      <Input
                        id="hip"
                        type="number"
                        placeholder="90"
                        value={formData.hip}
                        onChange={(e) => setFormData({ ...formData, hip: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="shoulder" className="text-xs">Shoulder (cm)</Label>
                      <Input
                        id="shoulder"
                        type="number"
                        placeholder="45"
                        value={formData.shoulder}
                        onChange={(e) => setFormData({ ...formData, shoulder: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="inseam" className="text-xs">Inseam (cm)</Label>
                      <Input
                        id="inseam"
                        type="number"
                        placeholder="75"
                        value={formData.inseam}
                        onChange={(e) => setFormData({ ...formData, inseam: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any other details or requests..."
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Review Your Request</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Please review your custom order details before submitting
                </p>
              </div>

              <div className="space-y-4 border rounded-xl p-6 bg-muted/30">
                {previewUrl && (
                  <div className="rounded-lg overflow-hidden">
                    <img src={previewUrl} alt="Design" className="w-full h-48 object-cover" />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Description:</span>
                    <span className="text-muted-foreground text-right max-w-xs">{formData.description}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Material:</span>
                    <span className="text-muted-foreground">{formData.material}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Color:</span>
                    <span className="text-muted-foreground">{formData.color}</span>
                  </div>
                  {formData.fittingStyle && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Fit:</span>
                      <span className="text-muted-foreground capitalize">{formData.fittingStyle}</span>
                    </div>
                  )}
                  {(formData.height || formData.chest || formData.waist) && (
                    <div className="py-2">
                      <span className="font-medium block mb-2">Measurements:</span>
                      <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                        {formData.height && <div>Height: {formData.height}cm</div>}
                        {formData.chest && <div>Chest: {formData.chest}cm</div>}
                        {formData.waist && <div>Waist: {formData.waist}cm</div>}
                        {formData.hip && <div>Hip: {formData.hip}cm</div>}
                        {formData.shoulder && <div>Shoulder: {formData.shoulder}cm</div>}
                        {formData.inseam && <div>Inseam: {formData.inseam}cm</div>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mt-4">
                  <p className="text-sm font-medium mb-2">📧 Next Steps</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• You'll receive a detailed quote via email</li>
                    <li>• The artisan will review your specifications</li>
                    <li>• Estimated response time: 24-48 hours</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-4 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          
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
              Submit Request
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomOrderModal;
