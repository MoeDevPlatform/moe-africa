import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/marketplace/Navbar";
import Footer from "@/components/marketplace/Footer";
import AddProductModal from "@/components/artisan/AddProductModal";
import { useAuth } from "@/contexts/AuthContext";
import { artisanService, ArtisanProfile } from "@/lib/apiServices";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Store, Package, Plus, Pencil, Trash2, BarChart3,
  Star, CheckCircle, ImagePlus, Loader2, AlertCircle, Upload, X,
} from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/data/mockData";
import { countries, getStatesByCountry } from "@/data/countryStateData";

const CATEGORIES = [
  { value: "tailoring", label: "Tailoring" },
  { value: "shoemaking", label: "Shoemaking" },
  { value: "canvas", label: "Canvas & Painting" },
  { value: "leatherwork", label: "Leatherwork" },
  { value: "beauty", label: "Beauty" },
  { value: "crafts", label: "Art & Crafts" },
];

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const ArtisanDashboard = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [artisanProfile, setArtisanProfile] = useState<ArtisanProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [businessForm, setBusinessForm] = useState({
    businessName: "",
    description: "",
    category: "",
    country: "",
    state: "",
    city: "",
    address: "",
  });

  // Store image upload (small thumbnail)
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null);
  const [storeImagePreview, setStoreImagePreview] = useState<string>("");
  const [storeImageError, setStoreImageError] = useState("");
  const [storeImageUploading, setStoreImageUploading] = useState(false);
  const storeImageInputRef = useRef<HTMLInputElement>(null);
  const [removeStoreImage, setRemoveStoreImage] = useState(false);

  // Cover/banner image upload (provider page hero)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [coverImageError, setCoverImageError] = useState("");
  const [coverImageUploading, setCoverImageUploading] = useState(false);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const [removeCoverImage, setRemoveCoverImage] = useState(false);

  const availableStates = useMemo(() => {
    if (!businessForm.country) return [];
    const c = countries.find((x) => x.name === businessForm.country);
    return c ? getStatesByCountry(c.code) : [];
  }, [businessForm.country]);

  const loadProducts = () => {
    setIsLoadingProducts(true);
    artisanService
      .getMyProducts()
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setIsLoadingProducts(false));
  };

  useEffect(() => {
    artisanService
      .getMyProfile()
      .then((p) => {
        // DEV-only diagnostic — must stay gated. Do NOT remove the `import.meta.env.DEV` guard.
        // Logs raw profile data including personal fields; must never ship to production.
        if (import.meta.env.DEV) {
          console.log("[MOE][dev-only] /artisans/me response:", p);
        }
        setArtisanProfile(p);
        setBusinessForm({
          businessName: p.businessName ?? "",
          description: p.description ?? "",
          category: p.category ?? "",
          country: p.country ?? "",
          state: p.state ?? "",
          city: p.city ?? "",
          address: p.address ?? "",
        });
      })
      .catch(() => {
        if (user) {
          const fallback: ArtisanProfile = {
            id: 0, userId: user.id, businessName: user.name + "'s Store",
            description: "", category: "", images: [],
            rating: 0, verified: false, featured: false, createdAt: new Date().toISOString(),
          };
          setArtisanProfile(fallback);
          setBusinessForm({
            businessName: fallback.businessName,
            description: "", category: "", country: "", state: "", city: "", address: "",
          });
        }
      })
      .finally(() => setIsLoadingProfile(false));

    loadProducts();
  }, [user]);

  const handleStoreImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreImageError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setStoreImageError("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setStoreImageError("Image must be 5MB or smaller.");
      return;
    }
    setStoreImageFile(file);
    setStoreImagePreview(URL.createObjectURL(file));
    setRemoveStoreImage(false);
  };

  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCoverImageError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setCoverImageError("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setCoverImageError("Image must be 5MB or smaller.");
      return;
    }
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
    setRemoveCoverImage(false);
  };

  const handleSaveProfile = async () => {
    setProfileError("");

    // Client-side validation BEFORE any API call
    if (!businessForm.businessName.trim()) {
      setProfileError("Business name is required.");
      return;
    }
    if (!businessForm.category) {
      setProfileError("Please select a category.");
      return;
    }

    setIsSavingProfile(true);
    try {
      // Upload store image first if a new one was selected
      let storeImageUrl: string | undefined;
      if (storeImageFile) {
        setStoreImageUploading(true);
        try {
          const result = await artisanService.uploadStoreImage(storeImageFile);
          storeImageUrl = result.url;
          // Stash so the artisan's own provider card/page can hydrate even
          // if the public endpoint doesn't echo storeImageUrl yet.
          localStorage.setItem("moe_artisan_store_url", storeImageUrl);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Store image upload failed";
          setStoreImageError(msg);
          setProfileError(msg);
          return;
        } finally {
          setStoreImageUploading(false);
        }
      }

      // Upload cover image if a new one was selected
      let coverImageUrl: string | undefined;
      if (coverImageFile) {
        setCoverImageUploading(true);
        try {
          const result = await artisanService.uploadCoverImage(coverImageFile);
          coverImageUrl = result.url;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Cover image upload failed";
          setCoverImageError(msg);
          setProfileError(msg);
          return;
        } finally {
          setCoverImageUploading(false);
        }
      }

      // Send STRUCTURED location fields separately — never concatenated.
      // Backend gap: see backend_MoeV1.md for required DTO update.
      const delta: Record<string, unknown> = {};
      if (businessForm.businessName !== (artisanProfile?.businessName ?? "")) delta.businessName = businessForm.businessName;
      if (businessForm.description !== (artisanProfile?.description ?? "")) delta.description = businessForm.description;
      if (businessForm.category !== (artisanProfile?.category ?? "")) delta.category = businessForm.category;
      if (businessForm.country !== (artisanProfile?.country ?? "")) delta.country = businessForm.country;
      if (businessForm.state !== (artisanProfile?.state ?? "")) delta.state = businessForm.state;
      if (businessForm.city !== (artisanProfile?.city ?? "")) delta.city = businessForm.city;
      if (businessForm.address !== (artisanProfile?.address ?? "")) delta.address = businessForm.address;
      if (storeImageUrl) delta.storeImageUrl = storeImageUrl;
      if (coverImageUrl) delta.coverImageUrl = coverImageUrl;

      // Explicit clear signals — bypass any truthy filter so the backend
      // receives an unambiguous null. See backend gap #13 in backend_MoeV1.md.
      if (removeStoreImage && !storeImageUrl) {
        (delta as Record<string, unknown>).storeImageUrl = null;
      }
      if (removeCoverImage && !coverImageUrl) {
        (delta as Record<string, unknown>).coverImageUrl = null;
      }

      if (Object.keys(delta).length === 0) {
        setEditingProfile(false);
        return;
      }

      const updated = await artisanService.updateProfile(delta);
      // NOTE: Until backend gap #13 (backend_MoeV1.md) is resolved, the API may
      // echo back the previous storeImageUrl/coverImageUrl after a clear request.
      // The X button will appear to work, save fires, then the old image
      // reappears on the next refresh. This is expected and resolves
      // automatically once #13 ships. Do NOT add response filtering here —
      // it would mask legitimate null updates.
      // Merge instead of replace — backend PATCH may only echo changed fields,
      // which would otherwise wipe storeImageUrl, images, description, etc.
      const merged: ArtisanProfile = {
        ...(artisanProfile as ArtisanProfile),
        ...updated,
        // Ensure local optimistic values survive if backend omits them
        businessName: updated?.businessName ?? delta.businessName as string ?? artisanProfile?.businessName ?? "",
        description: updated?.description ?? (delta.description as string | undefined) ?? artisanProfile?.description,
        category: updated?.category ?? (delta.category as string | undefined) ?? artisanProfile?.category,
        country: updated?.country ?? (delta.country as string | undefined) ?? artisanProfile?.country,
        state: updated?.state ?? (delta.state as string | undefined) ?? artisanProfile?.state,
        city: updated?.city ?? (delta.city as string | undefined) ?? artisanProfile?.city,
        address: updated?.address ?? (delta.address as string | undefined) ?? artisanProfile?.address,
        storeImageUrl: updated?.storeImageUrl ?? storeImageUrl ?? artisanProfile?.storeImageUrl,
        coverImageUrl: updated?.coverImageUrl ?? coverImageUrl ?? artisanProfile?.coverImageUrl,
      };
      setArtisanProfile(merged);
      // Refetch to guarantee canonical state — non-blocking
      artisanService.getMyProfile().then(setArtisanProfile).catch(() => {});
      // Sync AuthContext so businessName changes reflect across the app
      // (navbar, marketplace listings) without a hard refresh.
      refreshProfile().catch(() => {});
      setStoreImageFile(null);
      setStoreImagePreview("");
      setCoverImageFile(null);
      setCoverImagePreview("");
      setRemoveStoreImage(false);
      setRemoveCoverImage(false);
      setEditingProfile(false);
      toast.success("Business profile updated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setProfileError(msg);
      toast.error(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await artisanService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-display font-bold">Artisan Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {user?.name} — manage your store and products</p>
          </div>
          {artisanProfile?.verified && (
            <Badge className="gap-1 bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3" /> Verified
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Products", value: products.length, icon: Package },
            { label: "Rating", value: artisanProfile?.rating?.toFixed(1) || "—", icon: Star },
            { label: "Category", value: artisanProfile?.category || "—", icon: Store },
            { label: "Status", value: artisanProfile?.featured ? "Featured" : "Active", icon: BarChart3 },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-lg font-semibold">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 mb-6 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="products" className="flex items-center gap-2 flex-1">
              <Package className="h-4 w-4" /> My Products
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2 flex-1">
              <Store className="h-4 w-4" /> Business Profile
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" /> My Products
                    </CardTitle>
                    <CardDescription>Manage your product listings</CardDescription>
                  </div>
                  <Button size="sm" className="gap-1" onClick={() => setShowAddProduct(true)}>
                    <Plus className="h-4 w-4" /> Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingProducts ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-1">No products yet</h3>
                    <p className="text-muted-foreground mb-4">Start adding your artisan products</p>
                    <Button className="gap-1" onClick={() => setShowAddProduct(true)}>
                      <Plus className="h-4 w-4" /> Add Your First Product
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                        <img
                          src={product.images?.[0] || FALLBACK_IMAGE}
                          alt={product.name}
                          className="h-16 w-16 object-cover rounded-lg"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.priceRange?.min != null ? (
                              <>₦{product.priceRange.min.toLocaleString()} – ₦{(product.priceRange.max ?? product.priceRange.min).toLocaleString()}</>
                            ) : (
                              <span className="italic">Price on request</span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost" size="icon" title="Edit"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" title="Delete"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-primary" /> Business Profile
                    </CardTitle>
                    <CardDescription>Manage your artisan store details</CardDescription>
                  </div>
                  <Button
                    variant={editingProfile ? "ghost" : "outline"} size="sm"
                    onClick={() => setEditingProfile(!editingProfile)}
                  >
                    {editingProfile ? "Cancel" : <><Pencil className="h-4 w-4 mr-1" /> Edit</>}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingProfile ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : editingProfile ? (
                  <>
                    <div className="space-y-2">
                      <Label>Business Name *</Label>
                      <Input
                        value={businessForm.businessName}
                        onChange={(e) => setBusinessForm((p) => ({ ...p, businessName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={businessForm.description}
                        onChange={(e) => setBusinessForm((p) => ({ ...p, description: e.target.value }))}
                        rows={4}
                      />
                    </div>

                    {/* Category — dropdown */}
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select
                        value={businessForm.category}
                        onValueChange={(v) => setBusinessForm((p) => ({ ...p, category: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your craft category" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Structured location: Country → State → City → Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Select
                          value={businessForm.country}
                          onValueChange={(v) =>
                            // Cascading reset: clear State + City when Country changes
                            setBusinessForm((p) => ({ ...p, country: v, state: "", city: "" }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="bg-card">
                            {countries.map((c) => (
                              <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Select
                          value={businessForm.state}
                          onValueChange={(v) =>
                            // Cascading reset: clear City when State changes
                            setBusinessForm((p) => ({ ...p, state: v, city: "" }))
                          }
                          disabled={!businessForm.country}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={businessForm.country ? "Select state" : "Select country first"} />
                          </SelectTrigger>
                          <SelectContent className="bg-card">
                            {availableStates.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={businessForm.city}
                          onChange={(e) => setBusinessForm((p) => ({ ...p, city: e.target.value }))}
                          placeholder="e.g. Ikeja"
                          disabled={!businessForm.state}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Street Address</Label>
                        <Input
                          value={businessForm.address}
                          onChange={(e) => setBusinessForm((p) => ({ ...p, address: e.target.value }))}
                          placeholder="123 Workshop Road"
                        />
                      </div>
                    </div>

                    {/* Store Image upload */}
                    <div className="space-y-2">
                      <Label>Store Image</Label>
                      <input
                        ref={storeImageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleStoreImageSelect}
                      />
                      <div className="flex items-center gap-3 flex-wrap">
                        {(storeImagePreview || artisanProfile?.storeImageUrl || artisanProfile?.images?.[0]) && (
                          <img
                            src={storeImagePreview || artisanProfile?.storeImageUrl || artisanProfile?.images?.[0]}
                            alt="Store preview"
                            className="h-20 w-20 object-cover rounded-lg border"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                          />
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() => storeImageInputRef.current?.click()}
                          disabled={storeImageUploading}
                        >
                          {storeImageUploading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                          ) : (
                            <><Upload className="h-4 w-4" /> {storeImagePreview ? "Change image" : "Upload image"}</>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP — max 5MB</p>
                      </div>
                      {storeImageError && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          {storeImageError}
                        </div>
                      )}
                    </div>

                    {/* Cover / Banner Image upload — shows on the public provider page hero */}
                    <div className="space-y-2">
                      <Label>Cover / Banner Image</Label>
                      <p className="text-xs text-muted-foreground">
                        Wide image displayed as the background of your public storefront page. Recommended 1600×500.
                      </p>
                      <input
                        ref={coverImageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleCoverImageSelect}
                      />
                      <div className="flex items-center gap-3 flex-wrap">
                        {(coverImagePreview || artisanProfile?.coverImageUrl) && (
                          <img
                            src={coverImagePreview || artisanProfile?.coverImageUrl}
                            alt="Cover preview"
                            className="h-20 w-40 object-cover rounded-lg border"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                          />
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() => coverImageInputRef.current?.click()}
                          disabled={coverImageUploading}
                        >
                          {coverImageUploading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                          ) : (
                            <><Upload className="h-4 w-4" /> {(coverImagePreview || artisanProfile?.coverImageUrl) ? "Change cover" : "Upload cover"}</>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP — max 5MB</p>
                      </div>
                      {coverImageError && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          {coverImageError}
                        </div>
                      )}
                    </div>

                    {profileError && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {profileError}
                      </div>
                    )}

                    <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                      {isSavingProfile ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Business Name</p>
                      <p className="font-medium">{artisanProfile?.businessName || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p>{artisanProfile?.description || "No description"}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <p className="font-medium">
                          {CATEGORIES.find((c) => c.value === artisanProfile?.category)?.label
                            || artisanProfile?.category || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">
                          {[artisanProfile?.address, artisanProfile?.city, artisanProfile?.state, artisanProfile?.country]
                            .filter(Boolean).join(", ") || artisanProfile?.location || "—"}
                        </p>
                      </div>
                    </div>
                    {(artisanProfile?.storeImageUrl || (artisanProfile?.images && artisanProfile.images.length > 0)) && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Store Image</p>
                        <img
                          src={artisanProfile.storeImageUrl || artisanProfile.images[0]}
                          alt="Store"
                          className="h-24 w-24 object-cover rounded-lg border"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                        />
                      </div>
                    )}
                    {artisanProfile?.coverImageUrl && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Cover / Banner Image</p>
                        <img
                          src={artisanProfile.coverImageUrl}
                          alt="Cover"
                          className="w-full max-w-2xl aspect-[16/5] object-cover rounded-lg border"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      <AddProductModal
        open={showAddProduct}
        onOpenChange={setShowAddProduct}
        onProductAdded={loadProducts}
      />

      <AddProductModal
        open={!!editingProduct}
        onOpenChange={(o) => { if (!o) setEditingProduct(null); }}
        onProductAdded={loadProducts}
        editProduct={editingProduct}
      />
    </div>
  );
};

export default ArtisanDashboard;
