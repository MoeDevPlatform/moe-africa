import { useState, useEffect } from "react";
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
import {
  ArrowLeft, Store, Package, Plus, Pencil, Trash2, BarChart3,
  Star, CheckCircle, ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/data/mockData";

const ArtisanDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [artisanProfile, setArtisanProfile] = useState<ArtisanProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [businessForm, setBusinessForm] = useState({
    businessName: "", description: "", category: "", location: "",
  });

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
        setArtisanProfile(p);
        setBusinessForm({ businessName: p.businessName, description: p.description, category: p.category, location: p.location });
      })
      .catch(() => {
        if (user) {
          const fallback: ArtisanProfile = {
            id: 0, userId: user.id, businessName: user.name + "'s Store",
            description: "", category: "", location: "", images: [],
            rating: 0, verified: false, featured: false, createdAt: new Date().toISOString(),
          };
          setArtisanProfile(fallback);
          setBusinessForm({ businessName: fallback.businessName, description: "", category: "", location: "" });
        }
      })
      .finally(() => setIsLoadingProfile(false));

    loadProducts();
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      // Only send fields that actually changed vs original profile
      const delta: Record<string, string> = {};
      if (businessForm.businessName !== (artisanProfile?.businessName ?? "")) delta.businessName = businessForm.businessName;
      if (businessForm.description !== (artisanProfile?.description ?? "")) delta.description = businessForm.description;
      if (businessForm.category !== (artisanProfile?.category ?? "")) delta.category = businessForm.category;
      if (businessForm.location !== (artisanProfile?.location ?? "")) delta.location = businessForm.location;

      if (Object.keys(delta).length === 0) {
        setEditingProfile(false);
        return;
      }

      const updated = await artisanService.updateProfile(delta);
      setArtisanProfile(updated);
      setEditingProfile(false);
      toast.success("Business profile updated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
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
                          src={product.images?.[0] || "/placeholder.svg"}
                          alt={product.name}
                          className="h-16 w-16 object-cover rounded-lg"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
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
                          <Button variant="ghost" size="icon" title="Edit">
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
                      <Label>Business Name</Label>
                      <Input value={businessForm.businessName} onChange={(e) => setBusinessForm((p) => ({ ...p, businessName: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={businessForm.description} onChange={(e) => setBusinessForm((p) => ({ ...p, description: e.target.value }))} rows={4} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Input value={businessForm.category} onChange={(e) => setBusinessForm((p) => ({ ...p, category: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={businessForm.location} onChange={(e) => setBusinessForm((p) => ({ ...p, location: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Store Images</Label>
                      <div className="flex gap-2 flex-wrap">
                        {artisanProfile?.images?.map((img, i) => (
                          <img key={i} src={img} alt={`Store image ${i + 1}`} className="h-20 w-20 object-cover rounded-lg border" />
                        ))}
                        <button className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary transition-colors">
                          <ImagePlus className="h-6 w-6 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <Button onClick={handleSaveProfile}>Save Changes</Button>
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <p className="font-medium">{artisanProfile?.category || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{artisanProfile?.location || "—"}</p>
                      </div>
                    </div>
                    {artisanProfile?.images && artisanProfile.images.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Store Images</p>
                        <div className="flex gap-2 flex-wrap">
                          {artisanProfile.images.map((img, i) => (
                            <img key={i} src={img} alt={`Store image ${i + 1}`} className="h-20 w-20 object-cover rounded-lg border" />
                          ))}
                        </div>
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
    </div>
  );
};

export default ArtisanDashboard;
