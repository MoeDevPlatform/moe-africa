import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useAllProviders } from "@/hooks/useProviders";
import { useCreateProduct, useUpdateProduct, DBProduct } from "@/hooks/useProducts";
import { toast } from "sonner";

interface AdminProductFormProps {
  product?: DBProduct | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const AdminProductForm = ({ product, onSuccess, onCancel }: AdminProductFormProps) => {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price_min: product?.price_min?.toString() || "",
    price_max: product?.price_max?.toString() || "",
    currency: product?.currency || "NGN",
    estimated_delivery_days: product?.estimated_delivery_days?.toString() || "7",
    status: product?.status || "active",
    service_provider_id: product?.service_provider_id || "",
    category_id: product?.category_id || "",
    materials: product?.materials || "",
    tags: product?.tags?.join(", ") || "",
    featured: product?.featured ?? false,
    best_seller: product?.best_seller ?? false,
    seasonal_pick: product?.seasonal_pick ?? false,
    trending: product?.trending ?? false,
  });

  const { data: categories = [] } = useCategories();
  const { data: providers = [] } = useAllProviders();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isPending = createProduct.isPending || updateProduct.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<DBProduct> = {
        name: formData.name,
        description: formData.description || null,
        price_min: formData.price_min ? Number(formData.price_min) : null,
        price_max: formData.price_max ? Number(formData.price_max) : null,
        currency: formData.currency,
        estimated_delivery_days: formData.estimated_delivery_days ? Number(formData.estimated_delivery_days) : null,
        status: formData.status,
        service_provider_id: formData.service_provider_id || null,
        category_id: formData.category_id || null,
        materials: formData.materials || null,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        featured: formData.featured,
        best_seller: formData.best_seller,
        seasonal_pick: formData.seasonal_pick,
        trending: formData.trending,
      };

      if (product) {
        await updateProduct.mutateAsync({ id: product.id, ...payload });
        toast.success("Product updated successfully");
      } else {
        await createProduct.mutateAsync(payload);
        toast.success("Product created successfully");
      }
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g., Custom Ankara Jacket"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the product in detail..."
          rows={4}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Min Price (NGN)</Label>
          <Input
            type="number"
            value={formData.price_min}
            onChange={(e) => setFormData({ ...formData, price_min: e.target.value })}
            placeholder="25000"
          />
        </div>
        <div className="space-y-2">
          <Label>Max Price (NGN)</Label>
          <Input
            type="number"
            value={formData.price_max}
            onChange={(e) => setFormData({ ...formData, price_max: e.target.value })}
            placeholder="35000"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Estimated Delivery (Days)</Label>
          <Input
            type="number"
            value={formData.estimated_delivery_days}
            onChange={(e) => setFormData({ ...formData, estimated_delivery_days: e.target.value })}
            placeholder="7"
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Service Provider</Label>
        <Select
          value={formData.service_provider_id}
          onValueChange={(v) => setFormData({ ...formData, service_provider_id: v })}
        >
          <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
          <SelectContent>
            {providers.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={formData.category_id}
          onValueChange={(v) => setFormData({ ...formData, category_id: v })}
        >
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Materials</Label>
        <Input
          value={formData.materials}
          onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
          placeholder="e.g., 100% Cotton Ankara Fabric"
        />
      </div>

      <div className="space-y-2">
        <Label>Style Tags (comma-separated)</Label>
        <Input
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="e.g., Modern, Afrocentric, Traditional"
        />
      </div>

      {/* Promotional Toggles */}
      <div className="space-y-3 border border-border rounded-lg p-4">
        <p className="text-sm font-medium">Promotional Tags</p>
        {[
          { key: "featured", label: "Featured Product" },
          { key: "best_seller", label: "Best Seller" },
          { key: "seasonal_pick", label: "Seasonal Pick" },
          { key: "trending", label: "Trending" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <Label>{label}</Label>
            <Switch
              checked={(formData as any)[key]}
              onCheckedChange={(v) => setFormData({ ...formData, [key]: v })}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!formData.name || isPending} className="bg-primary text-primary-foreground">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {product ? "Update Product" : "Create Product"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground font-mono">
        {product ? `PATCH /products/${product.id}` : "POST /products"}
      </p>
    </form>
  );
};

export default AdminProductForm;
