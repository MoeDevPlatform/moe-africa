import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";
import MeasurementStep from "./customization/MeasurementStep";

interface CustomOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  providerName: string;
}

const CustomOrderModal = ({ open, onOpenChange, providerId, providerName }: CustomOrderModalProps) => {
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // In a real implementation, upload to Supabase Storage
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleMeasurementChange = (field: string, value: string) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a custom order request.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("custom_orders").insert({
      customer_id: user.id,
      service_provider_id: providerId,
      description,
      measurement_data: measurements,
      design_images: images,
      status: "pending",
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit custom order request. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request submitted! 🎉",
        description: `Your custom order request has been sent to ${providerName}. You'll receive a quote via email soon.`,
      });
      onOpenChange(false);
      setStep(1);
      setDescription("");
      setMeasurements({});
      setNotes("");
      setImages([]);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">
            Custom Order Request - {providerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 1 ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">What would you like made?</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your custom order in detail (materials, colors, style, etc.)"
                    rows={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Upload Design Images (Optional)</Label>
                  <div className="mt-2 space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload inspiration images
                        </p>
                      </label>
                    </div>

                    {images.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img}
                              alt={`Design ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!description.trim()}
                >
                  Next: Measurements
                </Button>
              </div>
            </>
          ) : (
            <>
              <MeasurementStep
                measurements={measurements}
                onMeasurementChange={handleMeasurementChange}
                notes={notes}
                onNotesChange={setNotes}
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomOrderModal;
