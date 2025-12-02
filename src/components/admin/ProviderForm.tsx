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
import { X, Upload } from "lucide-react";

interface ProviderFormProps {
  provider?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ProviderForm = ({ provider, onSubmit, onCancel }: ProviderFormProps) => {
  const [formData, setFormData] = useState({
    firstName: provider?.firstName || "",
    lastName: provider?.lastName || "",
    brandName: provider?.brandName || "",
    email: provider?.email || "",
    phoneNumber: provider?.phoneNumber || "",
    state: provider?.address?.state || "",
    city: provider?.address?.city || "",
    line1: provider?.address?.line1 || "",
    about: provider?.about || "",
    enabled: provider?.enabled ?? true,
    verified: provider?.verified ?? false,
    featured: provider?.featured ?? false,
    serviceCategoryIds: provider?.serviceCategoryIds || [],
  });

  const categories = [
    { id: 1, name: "Tailoring" },
    { id: 2, name: "Leather Goods" },
    { id: 3, name: "Home Decor" },
    { id: 4, name: "Furniture" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            placeholder="Enter first name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brandName">Brand Name *</Label>
        <Input
          id="brandName"
          value={formData.brandName}
          onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
          required
          placeholder="e.g., Ade Tailors"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="provider@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <Input
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            required
            placeholder="+234..."
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            required
            placeholder="Lagos"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
            placeholder="Ikeja"
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="line1">Address *</Label>
          <Input
            id="line1"
            value={formData.line1}
            onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
            required
            placeholder="Street address"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="about">About</Label>
        <Textarea
          id="about"
          value={formData.about}
          onChange={(e) => setFormData({ ...formData, about: e.target.value })}
          placeholder="Tell us about this service provider..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categories">Service Categories</Label>
        <Select
          value={formData.serviceCategoryIds[0]?.toString()}
          onValueChange={(value) =>
            setFormData({ ...formData, serviceCategoryIds: [parseInt(value)] })
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled">Enable Provider</Label>
            <p className="text-xs text-muted-foreground">
              Allow this provider to list products
            </p>
          </div>
          <Switch
            id="enabled"
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="verified">Verified Status</Label>
            <p className="text-xs text-muted-foreground">
              Mark provider as verified
            </p>
          </div>
          <Switch
            id="verified"
            checked={formData.verified}
            onCheckedChange={(checked) => setFormData({ ...formData, verified: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="featured">Feature this Artisan</Label>
            <p className="text-xs text-muted-foreground">
              Highlight in Featured Artisans section
            </p>
          </div>
          <Switch
            id="featured"
            checked={formData.featured}
            onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Brand Logo</Label>
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
          {provider ? "Update Provider" : "Create Provider"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground font-mono">
        {provider ? `PATCH /service-providers/${provider.id}` : "POST /service-providers"}
      </p>
    </form>
  );
};

export default ProviderForm;
