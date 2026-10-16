import Skeleton from "@/components/common/Skeleton";
import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/marketplace/Navbar";
import Footer from "@/components/marketplace/Footer";
import AddProductModal from "@/components/artisan/AddProductModal";
import { useAuth } from "@/contexts/AuthContext";
import { artisanService, ArtisanProfile, metaService, ServiceCategoryOption } from "@/lib/apiServices";
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
  Star, CheckCircle, ImagePlus, Loader2, AlertCircle, Upload, X, MessageSquare, ClipboardList,
  Sparkles, ShoppingBag, Eye, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/data/mockData";
import CustomerInquiries from "@/components/artisan/CustomerInquiries";
import VerificationSection from "@/components/artisan/VerificationSection";
import ArtisanOrdersPanel from "@/components/artisan/ArtisanOrdersPanel";
import ArtisanCustomOrdersPanel from "@/components/artisan/ArtisanCustomOrdersPanel";
import { countries, getStatesByCountry } from "@/data/countryStateData";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Match backend upload limit (backend_MoeV1.md / products controller): 5MB.
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const IMAGE_PLACEHOLDER = "/placeholder.svg";

const normCat = (s: string) => s.trim().toLowerCase();

/** Normalize profile categories from API (array, comma-separated, or legacy single category). */
function resolveServiceCategories(p: Pick<ArtisanProfile, "category" | "serviceCategories">): string[] {
  let raw: string[] = [];
  if (Array.isArray(p.serviceCategories) && p.serviceCategories.length > 0) {
    raw = p.serviceCategories.map((s) => String(s).trim()).filter(Boolean);
  } else if (typeof p.serviceCategories === "string" && p.serviceCategories.trim()) {
    raw = p.serviceCategories.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (p.category?.trim()) {
    raw = p.category.includes(",")
      ? p.category.split(",").map((s) => s.trim()).filter(Boolean)
      : [p.category.trim()];
  }
  // Dedupe case-insensitively, keep first occurrence's casing for now
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of raw) {
    const key = normCat(s);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

/** Map saved values onto canonical meta category names (case-insensitive). */
function canonicalizeCategories(
  saved: string[],
  available: ServiceCategoryOption[],
): string[] {
  if (available.length === 0) return saved;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of saved) {
    const match = available.find((c) => normCat(c.name) === normCat(s));
    const name = match?.name ?? s.trim();
    const key = normCat(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

function categoriesEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].map(normCat).sort();
  const sortedB = [...b].map(normCat).sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

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
  const [availableServiceCategories, setAvailableServiceCategories] = useState<ServiceCategoryOption[]>([]);
  const [businessForm, setBusinessForm] = useState({
    businessName: "",
    description: "",
    serviceCategories: [] as string[],
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
    metaService.getServiceCategories().then(setAvailableServiceCategories);
  }, []);

  // Remap saved categories onto canonical pill names once meta list is available
  // (fixes case mismatch e.g. "tailoring" → "Tailoring").
  useEffect(() => {
    if (editingProfile) return;
    if (!artisanProfile || availableServiceCategories.length === 0) return;
    const canonical = canonicalizeCategories(
      resolveServiceCategories(artisanProfile),
      availableServiceCategories,
    );
    setBusinessForm((prev) => {
      if (categoriesEqual(prev.serviceCategories, canonical)) return prev;
      return { ...prev, serviceCategories: canonical };
    });
  }, [artisanProfile, availableServiceCategories, editingProfile]);

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
          serviceCategories: canonicalizeCategories(
            resolveServiceCategories(p),
            availableServiceCategories,
          ),
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
            description: "", serviceCategories: [], country: "", state: "", city: "", address: "",
          });
        }
      })
      .finally(() => setIsLoadingProfile(false));

    loadProducts();
  }, [user]);

  const isCategorySelected = (name: string) =>
    businessForm.serviceCategories.some((c) => normCat(c) === normCat(name));

  const toggleServiceCategory = (name: string) => {
    setBusinessForm((p) => {
      const exists = p.serviceCategories.some((c) => normCat(c) === normCat(name));
      if (exists) {
        return {
          ...p,
          serviceCategories: p.serviceCategories.filter((c) => normCat(c) !== normCat(name)),
        };
      }
      // Always store the canonical pill label from the meta list
      return { ...p, serviceCategories: [...p.serviceCategories, name] };
    });
  };

  const handleStoreImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreImageError("");
    const file = e.target.files?.[0];
    // Allow re-selecting the same file
    e.target.value = "";
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
    // Allow re-selecting the same file
    e.target.value = "";
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
    if (businessForm.serviceCategories.length === 0) {
      setProfileError("Please select at least one category.");
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
          setStoreImagePreview(result.url);
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
          setCoverImagePreview(result.url);
          localStorage.setItem("moe_artisan_cover_url", coverImageUrl);
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
      const prevCategories = resolveServiceCategories(artisanProfile ?? { category: "", serviceCategories: [] });
      const delta: Record<string, unknown> = {};
      if (businessForm.businessName !== (artisanProfile?.businessName ?? "")) delta.businessName = businessForm.businessName;
      if (businessForm.description !== (artisanProfile?.description ?? "")) delta.description = businessForm.description;
      if (!categoriesEqual(businessForm.serviceCategories, prevCategories)) {
        // PATCH /artisans/me accepts string[] (PostgreSQL TEXT[]); load still tolerates legacy CSV.
        delta.serviceCategories = [...businessForm.serviceCategories];
        // Keep legacy single `category` in sync for endpoints that still read it
        delta.category = businessForm.serviceCategories[0] ?? "";
      }
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
        serviceCategories:
          updated?.serviceCategories
          ?? (delta.serviceCategories as string | string[] | undefined)
          ?? artisanProfile?.serviceCategories,
        country: updated?.country ?? (delta.country as string | undefined) ?? artisanProfile?.country,
        state: updated?.state ?? (delta.state as string | undefined) ?? artisanProfile?.state,
        city: updated?.city ?? (delta.city as string | undefined) ?? artisanProfile?.city,
        address: updated?.address ?? (delta.address as string | undefined) ?? artisanProfile?.address,
        // If the user explicitly removed the image, force-clear it locally
        // regardless of what the backend echoes back. The localStorage stash
        // was already cleared in artisanService.updateProfile, so the next
        // refetch won't rehydrate it either.
        storeImageUrl: removeStoreImage
          ? ""
          : (updated?.storeImageUrl ?? storeImageUrl ?? artisanProfile?.storeImageUrl),
        coverImageUrl: removeCoverImage
          ? ""
          : (updated?.coverImageUrl ?? coverImageUrl ?? artisanProfile?.coverImageUrl),
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
    <div className="artisan-dashboard min-h-screen flex flex-col">
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
          {artisanProfile?.status && (
            <Badge
              className={`gap-1 capitalize ${
                artisanProfile.status === "approved"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : artisanProfile.status === "rejected"
                  ? "bg-red-100 text-red-800 border-red-200"
                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
              }`}
            >
              {artisanProfile.status}
            </Badge>
          )}
        </div>

        {/* Item 10 — admin approval workflow notice */}
        {artisanProfile?.status !== "approved" && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              New artisan accounts and product listings require admin approval before appearing publicly on the marketplace.
            </span>
          </div>
        )}

        {/* Quick Stats */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          data-testid="dashboard-stats"
        >
          {[
            { label: "Total Products", value: products.length, icon: Package },
            { label: "Average Rating", value: artisanProfile?.rating?.toFixed(1) || "—", icon: Star },
            { label: "Total Orders", value: artisanProfile?.totalOrders ?? "—", icon: ShoppingBag },
            { label: "Profile Views", value: artisanProfile?.profileViews ?? "—", icon: Eye },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-0 rounded-xl shadow-sm">
              <CardContent className="flex flex-col items-start gap-3 p-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  {isLoadingProfile || isLoadingProducts ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-3xl font-semibold mt-1">{value}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="products" className="w-full">
          <div className="flex flex-wrap gap-3 mb-6">
            <Button onClick={() => setShowAddProduct(true)}><Plus className="h-4 w-4 mr-2" />Add Product</Button>
            <Button variant="outline" disabled={!artisanProfile} onClick={() => { document.querySelector<HTMLButtonElement>('[role="tab"][data-state][id$="trigger-profile"]')?.click(); requestAnimationFrame(() => { if (!editingProfile) document.getElementById("business-profile-edit")?.click(); }); }}><Pencil className="h-4 w-4 mr-2" />Edit Business Profile</Button>
            <Button variant="outline" disabled={!artisanProfile?.id} onClick={() => { if (artisanProfile?.id) navigate(`/marketplace/provider/${artisanProfile.id}`); }}><ExternalLink className="h-4 w-4 mr-2" />View Public Profile</Button>
          </div>
          <TabsList className="dashboard-tabs w-full justify-start overflow-x-auto h-auto gap-4 mb-6 bg-transparent p-0 rounded-none border-b">
            <TabsTrigger value="products" className="flex items-center gap-2 flex-1">
              <Package className="h-4 w-4" /> My Products
            </TabsTrigger>
            <TabsTrigger value="inquiries" className="flex items-center gap-2 flex-1">
              <MessageSquare className="h-4 w-4" /> Customer Inquiries
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2 flex-1">
              <ClipboardList className="h-4 w-4" /> Orders
            </TabsTrigger>
            {(artisanProfile?.isCustomOrderEligible ||
              artisanProfile?.customOrdersEnabled) && (
              <TabsTrigger value="custom-orders" className="flex items-center gap-2 flex-1">
                <Sparkles className="h-4 w-4" /> Custom Orders
              </TabsTrigger>
            )}
            <TabsTrigger value="verification" className="flex items-center gap-2 flex-1">
              <CheckCircle className="h-4 w-4" /> Verification
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
                  <Button
                    size="sm"
                    className="gap-1"
                    data-testid="add-product-btn"
                    onClick={() => setShowAddProduct(true)}
                  >
                    <Plus className="h-4 w-4" /> Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingProducts ? (
                  <div role="status" aria-label="Loading" className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} variant="table-row" />)}</div>
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
                  <div
                    role="table"
                    aria-label="My products"
                    className="dashboard-products"
                    data-testid="dashboard-products-table"
                  >
                    <div role="row" className="hidden md:grid dashboard-product-row px-3 py-3 text-xs font-medium text-muted-foreground border-b">
                      {["Image", "Product Name", "Category", "Price Range", "Status", "Actions"].map((label) => <span role="columnheader" key={label}>{label}</span>)}
                    </div>
                    {products.map((product) => (
                      <div role="row" key={product.id} className="dashboard-product-row grid gap-3 p-4 border-b last:border-0 hover:bg-primary/5 transition-colors">
                        <div role="cell"><img loading="lazy" decoding="async" src={product.images?.[0] || FALLBACK_IMAGE} alt={product.name} className="h-16 w-16 object-cover rounded-lg" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} /></div>
                        <div role="cell" className="font-medium break-words">{product.name}</div>
                        <div role="cell" className="text-sm text-muted-foreground capitalize break-words">{product.category.replace(/_/g, " ")}</div>
                        <div role="cell" className="text-sm">{product.priceRange?.min != null ? <>₦{product.priceRange.min.toLocaleString()} – ₦{(product.priceRange.max ?? product.priceRange.min).toLocaleString()}</> : <span className="italic">Price on request</span>}</div>
                        <div role="cell">{product.status ? <Badge variant="outline" className={`capitalize text-xs ${product.status === "approved" ? "bg-primary/10 text-primary border-primary/20" : product.status === "rejected" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-accent/20 text-accent-foreground border-accent/40"}`}>{product.status}</Badge> : <span className="text-muted-foreground">—</span>}</div>
                        <div role="cell" className="flex gap-1">
                          <Button variant="ghost" size="icon" title="Edit" aria-label={`Edit ${product.name}`} data-testid="edit-product-btn" onClick={() => setEditingProduct(product)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" title="Delete" aria-label={`Delete ${product.name}`} className="text-destructive hover:text-destructive" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inquiries">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" /> Customer Inquiries
                </CardTitle>
                <CardDescription>
                  Read-only view of customer messages about your work. MoE Support replies on your behalf.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerInquiries />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" /> Orders
                </CardTitle>
                <CardDescription>Update order status and view fulfillment history.</CardDescription>
              </CardHeader>
              <CardContent>
                <ArtisanOrdersPanel />
              </CardContent>
            </Card>
          </TabsContent>

          {(artisanProfile?.isCustomOrderEligible ||
            artisanProfile?.customOrdersEnabled) && (
            <TabsContent value="custom-orders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Custom Orders
                  </CardTitle>
                  <CardDescription>
                    Bespoke commission requests from customers. Separate from product variations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ArtisanCustomOrdersPanel />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="verification">
            <VerificationSection />
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
                    id="business-profile-edit"
                    variant={editingProfile ? "ghost" : "outline"} size="sm"
                    onClick={() => {
                      if (artisanProfile) {
                        // Entering edit or cancelling: reset from saved profile with
                        // case-insensitive canonical category names.
                        setBusinessForm({
                          businessName: artisanProfile.businessName ?? "",
                          description: artisanProfile.description ?? "",
                          serviceCategories: canonicalizeCategories(
                            resolveServiceCategories(artisanProfile),
                            availableServiceCategories,
                          ),
                          country: artisanProfile.country ?? "",
                          state: artisanProfile.state ?? "",
                          city: artisanProfile.city ?? "",
                          address: artisanProfile.address ?? "",
                        });
                        setStoreImageFile(null);
                        setStoreImagePreview("");
                        setCoverImageFile(null);
                        setCoverImagePreview("");
                        setRemoveStoreImage(false);
                        setRemoveCoverImage(false);
                        setProfileError("");
                      }
                      setEditingProfile(!editingProfile);
                    }}
                  >
                    {editingProfile ? "Cancel" : <><Pencil className="h-4 w-4 mr-1" /> Edit</>}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingProfile ? (
                  <div role="status" aria-label="Loading" className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} variant="table-row" />)}</div>
                ) : editingProfile ? (
                  <>
                    <div className="profile-form-section profile-form-section--first">
                      <h4 className="profile-form-section__title">Business details</h4>
                      <p className="profile-form-section__hint">Your store name, story and the crafts you offer.</p>
                    </div>
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

                    {/* Category — multi-select pills (same as artisan signup) */}
                    <div className="space-y-2">
                      <Label>Service categories *</Label>
                      <p className="text-xs text-muted-foreground">
                        Pick the crafts you offer. You can refine these later.
                      </p>
                      {availableServiceCategories.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Loading categories…</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {availableServiceCategories.map((cat) => {
                            const active = isCategorySelected(cat.name);
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => toggleServiceCategory(cat.name)}
                                className="p-0 border-0 bg-transparent"
                                aria-pressed={active}
                              >
                                <Badge
                                  variant={active ? "default" : "outline"}
                                  className="cursor-pointer"
                                >
                                  {cat.name}
                                </Badge>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="profile-form-section">
                      <h4 className="profile-form-section__title">Location</h4>
                      <p className="profile-form-section__hint">Where your workshop is based.</p>
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

                    <div className="profile-form-section">
                      <h4 className="profile-form-section__title">Storefront images</h4>
                      <p className="profile-form-section__hint">How your store looks to customers on your public page.</p>
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
                        {(() => {
                          const src = removeStoreImage
                            ? ""
                            : (storeImagePreview || artisanProfile?.storeImageUrl || artisanProfile?.images?.[0] || "");
                          if (!src) return null;
                          return (
                            <div className="relative">
                              <img loading="lazy" decoding="async"
                                src={src}
                                alt="Store preview"
                                className="h-20 w-20 object-cover rounded-lg border"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMAGE_PLACEHOLDER; }}
                              />
                              <button
                                type="button"
                                aria-label="Remove store image"
                                onClick={() => {
                                  setStoreImageFile(null);
                                  setStoreImagePreview("");
                                  setRemoveStoreImage(true);
                                }}
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow hover:opacity-90"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })()}
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
                        {(() => {
                          const src = removeCoverImage
                            ? ""
                            : (coverImagePreview || artisanProfile?.coverImageUrl || "");
                          if (!src) return null;
                          return (
                            <div className="relative">
                              <img loading="lazy" decoding="async"
                                src={src}
                                alt="Cover preview"
                                className="h-20 w-40 object-cover rounded-lg border"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMAGE_PLACEHOLDER; }}
                              />
                              <button
                                type="button"
                                aria-label="Remove cover image"
                                onClick={() => {
                                  setCoverImageFile(null);
                                  setCoverImagePreview("");
                                  setRemoveCoverImage(true);
                                }}
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow hover:opacity-90"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })()}
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

                    <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">Fields marked * are required.</p>
                      <Button onClick={handleSaveProfile} disabled={isSavingProfile} size="lg" className="w-full sm:w-auto">
                        {isSavingProfile ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    {/* Storefront preview: cover + store image + identity */}
                    <div className="overflow-hidden rounded-xl border bg-muted/40">
                      <div className="relative aspect-[16/5] min-h-[120px] w-full bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/15">
                        {artisanProfile?.coverImageUrl && (
                          <img loading="lazy" decoding="async"
                            src={artisanProfile.coverImageUrl}
                            alt="Cover"
                            className="absolute inset-0 h-full w-full object-cover"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                          />
                        )}
                      </div>
                      <div className="flex flex-col gap-3 px-4 pb-3 sm:flex-row sm:items-start sm:gap-4 sm:px-6">
                        <div className="-mt-10 h-20 w-20 shrink-0 overflow-hidden rounded-xl border-4 border-card bg-card shadow-md sm:-mt-12 sm:h-24 sm:w-24">
                          {(artisanProfile?.storeImageUrl || (artisanProfile?.images && artisanProfile.images.length > 0)) ? (
                            <img loading="lazy" decoding="async"
                              src={artisanProfile.storeImageUrl || artisanProfile.images[0]}
                              alt="Store"
                              className="h-full w-full object-cover"
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-primary/10" aria-hidden="true">
                              <Store className="h-8 w-8 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="-mt-8 min-w-0 sm:mt-0">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Business Name</p>
                          <h3 className="truncate font-display text-xl font-bold sm:text-2xl">{artisanProfile?.businessName || "Not set"}</h3>
                        </div>
                      </div>
                    </div>

                    <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-lg border bg-card p-4">
                        <dt className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</dt>
                        <dd className="flex flex-wrap gap-1.5">
                          {resolveServiceCategories(artisanProfile ?? { category: "" }).length > 0
                            ? resolveServiceCategories(artisanProfile ?? { category: "" }).map((c) => (
                                <Badge key={c} variant="outline" className="font-medium">{c}</Badge>
                              ))
                            : <span className="font-medium">—</span>}
                        </dd>
                      </div>
                      <div className="rounded-lg border bg-card p-4">
                        <dt className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Location</dt>
                        <dd className="font-medium">
                          {[artisanProfile?.address, artisanProfile?.city, artisanProfile?.state, artisanProfile?.country]
                            .filter(Boolean).join(", ") || artisanProfile?.location || "—"}
                        </dd>
                      </div>
                      <div className="rounded-lg border bg-card p-4 md:col-span-2">
                        <dt className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</dt>
                        <dd className="max-w-prose leading-relaxed text-foreground/90">{artisanProfile?.description || "No description"}</dd>
                      </div>
                    </dl>
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
