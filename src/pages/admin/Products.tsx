import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package, Eye, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import ProductForm from "@/components/admin/ProductForm";
import { toast } from "sonner";

const Products = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch products with provider and category info
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          service_provider:service_providers(id, brand_name),
          category:product_categories(id, name)
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success("Product deleted successfully");
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      toast.error("Failed to delete product");
      console.error(error);
    },
  });

  const handleCreate = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleView = (product: any) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleDelete = (product: any) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedProduct) {
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', selectedProduct.id);
        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        const { error } = await supabase.from('products').insert(data);
        if (error) throw error;
        toast.success("Product created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsFormOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      toast.error("Operation failed");
      console.error(error);
    }
  };

  const confirmDelete = () => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct.id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Products
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage marketplace product listings
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
              GET /products
            </p>
          </div>
          <Button 
            onClick={handleCreate}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products by name, provider, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-input bg-card"
          />
        </div>

        {/* Products Table - Responsive */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Provider</TableHead>
                <TableHead className="hidden lg:table-cell">Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {product.service_provider?.brand_name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {product.service_provider?.brand_name || 'N/A'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="border-primary text-primary">
                        {product.category?.name || 'Uncategorized'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-display font-bold whitespace-nowrap">
                      {product.currency === "NGN" ? "₦" : "$"}{product.price?.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={product.status === "active" ? "default" : "secondary"}
                        className={
                          product.status === "active"
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-accent-foreground"
                        }
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(product)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedProduct ? "Edit Product" : "Create New Product"}
            </SheetTitle>
            <SheetDescription>
              {selectedProduct
                ? "Update product information and settings"
                : "Add a new product to the marketplace"}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ProductForm
              product={selectedProduct}
              onSubmit={handleSubmit}
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
            <SheetDescription>
              View complete product information
            </SheetDescription>
          </SheetHeader>
          {selectedProduct && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProduct.provider}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Price</p>
                  <p className="text-2xl font-display font-bold mt-1">{selectedProduct.price}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Category</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedProduct.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Stock</p>
                  <p className="text-sm font-medium mt-1">{selectedProduct.stock}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                  <Badge
                    variant={selectedProduct.status === "active" ? "default" : "secondary"}
                    className="mt-1"
                  >
                    {selectedProduct.status}
                  </Badge>
                </div>
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
              Are you sure you want to delete {selectedProduct?.name}? This action cannot be undone.
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
