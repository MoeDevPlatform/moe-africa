import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package, Eye, Edit, Trash2, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts, useDeleteProduct, DBProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import AdminProductForm from "@/components/admin/AdminProductForm";
import { toast } from "sonner";

const Products = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DBProduct | null>(null);

  const { data: products = [], isLoading } = useProducts({ activeOnly: false });
  const { data: categories = [] } = useCategories();
  const deleteProduct = useDeleteProduct();

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.service_providers as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => { setSelectedProduct(null); setIsFormOpen(true); };
  const handleEdit = (p: DBProduct) => { setSelectedProduct(p); setIsFormOpen(true); };
  const handleView = (p: DBProduct) => { setSelectedProduct(p); setIsDetailOpen(true); };
  const handleDelete = (p: DBProduct) => { setSelectedProduct(p); setIsDeleteOpen(true); };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    try {
      await deleteProduct.mutateAsync(selectedProduct.id);
      toast.success("Product deleted successfully");
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getCategoryName = (id: string | null) => {
    if (!id) return "—";
    return categories.find((c) => c.id === id)?.name || "—";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Products</h1>
            <p className="mt-1 text-muted-foreground">Manage marketplace product listings</p>
            <p className="text-xs text-muted-foreground/60 mt-1 font-mono">GET /products</p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products by name or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-input bg-card"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No products found. Add your first product.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {product.media_urls?.[0] ? (
                            <img src={product.media_urls[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 m-auto mt-2.5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">ID: {product.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{(product.service_providers as any)?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary text-primary">
                        {getCategoryName(product.category_id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-display font-bold">
                      {product.price_min ? `₦${product.price_min.toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {product.featured && <Badge className="bg-accent text-accent-foreground text-xs">Featured</Badge>}
                        {product.best_seller && <Badge className="bg-secondary text-secondary-foreground text-xs">Best Seller</Badge>}
                        {product.trending && <Badge className="bg-primary text-primary-foreground text-xs">Trending</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.status === "active" ? "default" : "secondary"}
                        className={product.status === "active" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(product)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(product)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedProduct ? "Edit Product" : "Create New Product"}</SheetTitle>
            <SheetDescription>
              {selectedProduct ? "Update product information and settings" : "Add a new product to the marketplace"}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <AdminProductForm
              product={selectedProduct}
              onSuccess={() => { setIsFormOpen(false); setSelectedProduct(null); }}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Product Details</SheetTitle>
            <SheetDescription>View complete product information</SheetDescription>
          </SheetHeader>
          {selectedProduct && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {selectedProduct.media_urls?.[0] ? (
                    <img src={selectedProduct.media_urls[0]} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-8 w-8 m-auto mt-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">{(selectedProduct.service_providers as any)?.name || "—"}</p>
                </div>
              </div>
              <div className="space-y-4">
                {selectedProduct.description && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
                    <p className="text-sm mt-1">{selectedProduct.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Price</p>
                  <p className="text-2xl font-display font-bold mt-1">
                    {selectedProduct.price_min ? `₦${selectedProduct.price_min.toLocaleString()}` : "—"}
                    {selectedProduct.price_max && selectedProduct.price_max !== selectedProduct.price_min
                      ? ` – ₦${selectedProduct.price_max.toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Category</p>
                  <Badge variant="outline" className="mt-1">{getCategoryName(selectedProduct.category_id)}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                  <Badge variant={selectedProduct.status === "active" ? "default" : "secondary"} className="mt-1">
                    {selectedProduct.status}
                  </Badge>
                </div>
                {selectedProduct.tags?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedProduct.tags.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono pt-4 border-t">
                GET /products/{selectedProduct.id}
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
          <p className="text-xs text-muted-foreground font-mono mt-4">
            DELETE /products/{selectedProduct?.id}
          </p>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Products;
