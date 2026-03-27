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
import { ImagePlus, X, Loader2 } from "lucide-react";
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

const AddProductModal = ({ open, onOpenChange, onProductAdded }: AddProductModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    priceMin: "",
    priceMax: "",
    materials: "",
    estimatedDeliveryDays: "",
    images: [] as string[],
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");

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

  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (url && !form.images.includes(url)) {
      updateForm("images", [...form.images, url]);
    }
    setImageUrlInput("");
  };

  const removeImage = (url: string) =>
    updateForm("images", form.images.filter((i) => i !== url));

  const isValid =
    form.name.trim() &&
    form.description.trim() &&
    form.category &&
    form.priceMin &&
    form.priceMax &&
    form.materials.trim() &&
    form.estimatedDeliveryDays &&
    form.images.length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      await artisanService.createProduct({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        priceRange: {
          min: Number(form.priceMin),
          max: Number(form.priceMax),
        },
        currency: "NGN",
        materials: form.materials.trim(),
        estimatedDeliveryDays: Number(form.estimatedDeliveryDays),
        images: form.images,
        tags: form.tags,
      });
      toast.success("Product added successfully!");
      onProductAdded();
      onOpenChange(false);
      // Reset form
      setForm({
        name: "", description: "", category: "", priceMin: "", priceMax: "",
        materials: "", estimatedDeliveryDays: "", images: [], tags: [],
      });
    } catch {
      toast.error("Failed to add product. Please try again.");
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
            Fill in the product details below. All fields are required for a complete marketplace listing.
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

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price-min">Min Price (₦) *</Label>
              <Input
                id="price-min"
                type="number"
                placeholder="e.g. 25000"
                value={form.priceMin}
                onChange={(e) => updateForm("priceMin", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-max">Max Price (₦) *</Label>
              <Input
                id="price-max"
                type="number"
                placeholder="e.g. 45000"
                value={form.priceMax}
                onChange={(e) => updateForm("priceMax", e.target.value)}
              />
            </div>
          </div>

          {/* Materials */}
          <div className="space-y-2">
            <Label htmlFor="materials">Materials *</Label>
            <Input
              id="materials"
              placeholder="e.g. 100% Cotton Ankara Fabric"
              value={form.materials}
              onChange={(e) => updateForm("materials", e.target.value)}
            />
          </div>

          {/* Delivery Estimate */}
          <div className="space-y-2">
            <Label htmlFor="delivery">Estimated Delivery (days) *</Label>
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

          {/* Images */}
          <div className="space-y-2">
            <Label>Product Images * (at least 1)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Paste image URL..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addImageUrl(); }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addImageUrl}>
                <ImagePlus className="h-4 w-4" />
              </Button>
            </div>
            {form.images.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {form.images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      alt={`Product image ${i + 1}`}
                      className="h-20 w-20 object-cover rounded-lg border"
                      onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                    />
                    <button
                      onClick={() => removeImage(url)}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
