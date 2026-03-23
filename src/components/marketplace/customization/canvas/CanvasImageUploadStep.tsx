import { useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CanvasImageUploadStepProps {
  uploadedImage: string | null;
  onImageUpload: (dataUrl: string) => void;
  onImageRemove: () => void;
}

const CanvasImageUploadStep = ({ uploadedImage, onImageUpload, onImageRemove }: CanvasImageUploadStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => onImageUpload(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => onImageUpload(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-semibold mb-1">Upload Your Image / Design</h3>
        <p className="text-sm text-muted-foreground">Upload a reference image or design. Supported: JPG, PNG, WEBP.</p>
      </div>

      {!uploadedImage ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
            "border-border hover:border-primary hover:bg-primary/5"
          )}
        >
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium mb-1">Click to upload or drag & drop</p>
          <p className="text-sm text-muted-foreground">JPG, PNG, WEBP • Max 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img
            src={uploadedImage}
            alt="Uploaded design"
            className="w-full max-h-72 object-contain bg-muted"
          />
          <Button
            size="sm"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
            onClick={onImageRemove}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded-md flex items-center gap-1">
            <ImageIcon className="h-3 w-3" />
            Image uploaded
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Your image will be shared with the artisan for fulfilment. Higher resolution images give better results.
      </p>
    </div>
  );
};

export default CanvasImageUploadStep;
