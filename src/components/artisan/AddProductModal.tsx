import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, X, Loader2, AlertCircle } from "lucide-react";
import { artisanService } from "@/lib/apiServices";
import { toast } from "sonner";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: () => void;
}

const CATEGORIES = [
  { value: "tailoring", label: "Tailoring" },
  { value: "shoemaking", label: "Shoemaking" },
  { value: "canvas", label: "Canvas & Painting" },
  { value: "leatherwork", label: "Leatherwork" },
  { value: "beauty", label: "Beauty" },
  { value: "crafts", label: "Art & Crafts" },
];

const STYLE_SUGGESTIONS = [
  "Modern", "Traditional", "Afrocentric", "Luxury", "Premium", "Casual",
  "Formal", "Elegant", "Handmade", "Custom Fit", "Wedding", "Corporate",
];

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;

interface UploadedImage {
  url: string;
  name: string;
  previewUrl: string;
}

const AddProductModal = ({ open, onOpenChange, onProductAdded }: AddProductModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    materials: "",
    estimatedDeliveryDays: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [imageError, setImageError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const updateForm = (field: string, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !form.tags.includes(t)) {
      updateForm("tags", [...form.tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    updateForm("tags", form.tags.filter((t) => t !== tag));

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError("");
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-pick of same file

    if (!files.length) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setImageError(`You can upload up to ${MAX_IMAGES} images.`);
      return;
    }
    const toProcess = files.slice(0, remaining);

    setIsUploading(true);
    for (const file of toProcess) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setImageError(`"${file.name}" is not a supported format (JPEG, PNG, WebP).`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        setImageError(`"${file.name}" exceeds the 5MB limit.`);
        continue;
      }
      try {
        const { url } = await artisanService.uploadProductImage(file);
        setImages((prev) => [
          ...prev,
          { url, name: file.name, previewUrl: URL.createObjectURL(file) },
        ]);
      } catch (err) {
        // Graceful 404/backend-not-ready fallback — surface inline, do not silently fail.
        const msg = err instanceof Error && err.message
          ? `Image upload is temporarily unavailable — the server is not ready yet. (${file.name})`
          : "Image upload is temporarily unavailable — the server is not ready yet.";
        setImageError(msg);
        break;
      }
    }
    setIsUploading(false);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(idx, 1);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return copy;
    });
  };

  const validate = (): string => {
    if (!form.name.trim()) return "Product name is required.";
    if (!form.description.trim()) return "Description is required.";
    if (!form.category) return "Please select a category.";
    if (!form.price || Number(form.price) <= 0) return "Price must be greater than zero.";
    return "";
  };

  const isValid = !validate();

  const handleSubmit = async () => {
    setSubmitError("");
    const v = validate();
    if (v) {
      setValidationError(v);
      return;
    }
    setValidationError("");
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        price: Number(form.price),
        currency: "NGN",
        materials: form.materials.trim() || undefined,
        estimatedDeliveryDays: form.estimatedDeliveryDays ? Number(form.estimatedDeliveryDays) : undefined,
        tags: form.tags.length > 0 ? form.tags.join(",") : undefined,
      };
      // Only include `images` when we have uploaded URLs — omit entirely
      // when empty so a stricter DTO (required array) won't reject a
      // text-only submission while the upload endpoint is unavailable.
      if (images.length > 0) {
        payload.images = images.map((i) => i.url);
      }

      await artisanService.createProduct(payload);
      toast.success("Product added successfully!");
      onProductAdded();
      onOpenChange(false);
      images.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl));
      setImages([]);
      setForm({
        name: "", description: "", category: "", price: "",
        materials: "", estimatedDeliveryDays: "", tags: [],
      });
      setSubmitError("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add product. Please try again.";
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the product details below. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="product-name">Product Name *</Label>
            <Input
              id="product-name"
              placeholder="e.g. Custom Ankara Jacket"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-desc">Description *</Label>
            <Textarea
              id="product-desc"
              placeholder="Describe your product in detail — materials, what makes it special, who it's for..."
              rows={4}
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={(v) => updateForm("category", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (₦) *</Label>
            <Input
              id="price"
              type="number"
              min={1}
              placeholder="e.g. 25000"
              value={form.price}
              onChange={(e) => updateForm("price", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="materials">Materials</Label>
            <Input
              id="materials"
              placeholder="e.g. 100% Cotton Ankara Fabric"
              value={form.materials}
              onChange={(e) => updateForm("materials", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery">Estimated Delivery (days)</Label>
            <Input
              id="delivery"
              type="number"
              placeholder="e.g. 7"
              value={form.estimatedDeliveryDays}
              onChange={(e) => updateForm("estimatedDeliveryDays", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Style Tags</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {STYLE_SUGGESTIONS.filter((s) => !form.tags.includes(s)).slice(0, 6).map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                  onClick={() => addTag(s)}
                >
                  + {s}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add custom tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => addTag(tagInput)}>
                Add
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Images — re-enabled. Graceful inline error if upload endpoint is down. */}
          <div className="space-y-2">
            <Label>Product Images</Label>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG or WebP · max 5MB each · up to {MAX_IMAGES} images. You can submit without images if upload fails.
            </p>
            <label
              htmlFor="product-images"
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors block"
            >
              <input
                id="product-images"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFilesSelected}
                disabled={isUploading || images.length >= MAX_IMAGES}
              />
              {isUploading ? (
                <Loader2 className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
              ) : (
                <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              )}
              <p className="text-sm text-muted-foreground">
                {images.length >= MAX_IMAGES
                  ? `Maximum of ${MAX_IMAGES} images reached`
                  : isUploading
                  ? "Uploading…"
                  : "Click to select images"}
              </p>
            </label>

            {imageError && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{imageError}</span>
              </div>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-md overflow-hidden border">
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-background/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove ${img.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 text-sm text-destructive px-1">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {validationError}
          </div>
        )}

        {submitError && (
          <div className="flex items-center gap-2 text-sm text-destructive px-1">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting || isUploading}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Adding...</>
            ) : (
              "Add Product"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
