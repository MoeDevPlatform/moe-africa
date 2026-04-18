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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ImagePlus, X, Loader2, AlertCircle, Lock } from "lucide-react";
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
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;

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

    // NOTE: `images` is intentionally STRIPPED from the payload until the
    // backend accepts an `images` array. Keeping it would cause "property
    // images should not exist" rejections. See backend_MoeV1.md.
    try {
      await artisanService.createProduct({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        price: Number(form.price),
        currency: "NGN",
        materials: form.materials.trim() || undefined,
        estimatedDeliveryDays: form.estimatedDeliveryDays ? Number(form.estimatedDeliveryDays) : undefined,
        // Tags as comma-separated string for current backend.
        // Backend gap: should accept string[]. See backend_MoeV1.md.
        tags: form.tags.length > 0 ? form.tags.join(",") : undefined,
      });
      toast.success("Product added successfully!");
      onProductAdded();
      onOpenChange(false);
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
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="product-name">Product Name *</Label>
            <Input
              id="product-name"
              placeholder="e.g. Custom Ankara Jacket"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
            />
          </div>

          {/* Description */}
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

          {/* Category */}
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

          {/* Price (single field) */}
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

          {/* Materials (optional) */}
          <div className="space-y-2">
            <Label htmlFor="materials">Materials</Label>
            <Input
              id="materials"
              placeholder="e.g. 100% Cotton Ankara Fabric"
              value={form.materials}
              onChange={(e) => updateForm("materials", e.target.value)}
            />
          </div>

          {/* Delivery Estimate (optional) */}
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

          {/* Style Tags */}
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

          {/* Images — DISABLED until backend accepts an `images` array.
              Showing a clearly disabled control with a tooltip prevents users
              from selecting files that would be silently dropped at submit.
              See backend_MoeV1.md. */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Product Images
              <Badge variant="secondary" className="text-xs gap-1">
                <Lock className="h-3 w-3" /> Coming soon
              </Badge>
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    aria-disabled="true"
                    className="border-2 border-dashed rounded-lg p-4 text-center opacity-60 cursor-not-allowed select-none"
                  >
                    <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Image uploads will be available soon.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Save your product now and add images once support is enabled.
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Image upload is temporarily disabled while the backend is finalised.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
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
