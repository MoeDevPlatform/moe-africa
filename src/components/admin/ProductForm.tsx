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
import { Upload } from "lucide-react";

interface ProductFormProps {
  product?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ProductForm = ({ product, onSubmit, onCancel }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    currency: product?.currency || "NGN",
    estimatedDeliveryDays: product?.estimatedDeliveryDays || 7,
    enabled: product?.enabled ?? true,
    serviceProviderId: product?.serviceProviderId || "",
    productCategoryIds: product?.productCategoryIds || [],
  });

  const providers = [
    { id: 1, name: "Adanna Fabrics" },
    { id: 2, name: "Kola Leatherworks" },
    { id: 3, name: "Amara Crafts" },
    { id: 8, name: "Canvas & Co. Lagos" },
    { id: 9, name: "ArtPrint Naija" },
  ];

  const categories = [
    { id: 1, name: "Clothing" },
    { id: 2, name: "Accessories" },
    { id: 3, name: "Home Decor" },
    { id: 4, name: "Furniture" },
    { id: 5, name: "Canvas & Painting" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          placeholder="Describe the product in detail..."
          rows={4}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <div className="flex gap-2">
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              placeholder="25000"
              className="flex-1"
            />
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value })}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NGN">NGN</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivery">Estimated Delivery (Days) *</Label>
          <Input
            id="delivery"
            type="number"
            value={formData.estimatedDeliveryDays}
            onChange={(e) => setFormData({ ...formData, estimatedDeliveryDays: parseInt(e.target.value) })}
            required
            placeholder="7"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="provider">Service Provider *</Label>
        <Select
          value={formData.serviceProviderId.toString()}
          onValueChange={(value) =>
            setFormData({ ...formData, serviceProviderId: parseInt(value) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id.toString()}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Product Category *</Label>
        <Select
          value={formData.productCategoryIds[0]?.toString()}
          onValueChange={(value) =>
            setFormData({ ...formData, productCategoryIds: [parseInt(value)] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="enabled">Enable Product</Label>
          <p className="text-xs text-muted-foreground">
            Make this product visible to customers
          </p>
        </div>
        <Switch
          id="enabled"
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
      </div>

      <div className="space-y-2">
        <Label>Product Images</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, WEBP up to 5MB
          </p>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-primary text-primary-foreground">
          {product ? "Update Product" : "Create Product"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground font-mono">
        {product ? `PATCH /products/${product.id}` : "POST /products"}
      </p>
    </form>
  );
};

export default ProductForm;
