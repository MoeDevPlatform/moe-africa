import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package, Eye, Edit, Trash2 } from "lucide-react";
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

  const products = [
    {
      id: 1,
      name: "Custom Ankara Dress",
      provider: "Adanna Fabrics",
      category: "Clothing",
      price: "₦45,000",
      stock: "Made to Order",
      status: "active",
    },
    {
      id: 2,
      name: "Handcrafted Leather Bag",
      provider: "Kola Leatherworks",
      category: "Accessories",
      price: "₦32,000",
      stock: "Made to Order",
      status: "active",
    },
    {
      id: 3,
      name: "Traditional Wall Art",
      provider: "Amara Crafts",
      category: "Home Decor",
      price: "₦18,000",
      stock: "Made to Order",
      status: "pending",
    },
    {
      id: 4,
      name: "Custom Mahogany Table",
      provider: "Eze Furniture",
      category: "Furniture",
      price: "₦125,000",
      stock: "Made to Order",
      status: "active",
    },
    {
      id: 5,
      name: "Beaded Jewelry Set",
      provider: "Amara Crafts",
      category: "Accessories",
      price: "₦15,000",
      stock: "Made to Order",
      status: "active",
    },
    {
      id: 6,
      name: "Bespoke Leather Shoes",
      provider: "Kola Leatherworks",
      category: "Footwear",
      price: "₦55,000",
      stock: "Made to Order",
      status: "active",
    },
    {
      id: 7,
      name: "Custom Portrait Painting",
      provider: "Canvas & Co. Lagos",
      category: "Canvas & Painting",
      price: "₦35,000 – ₦75,000",
      stock: "Made to Order",
      status: "active",
    },
    {
      id: 8,
      name: "Printed Canvas Art",
      provider: "ArtPrint Naija",
      category: "Canvas & Painting",
      price: "₦12,000 – ₦35,000",
      stock: "Made to Order",
      status: "active",
    },
  ];

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

  const handleSubmit = (data: any) => {
    toast.success(selectedProduct ? "Product updated successfully" : "Product created successfully");
    setIsFormOpen(false);
    setSelectedProduct(null);
  };

  const confirmDelete = () => {
    toast.success("Product deleted successfully");
    setIsDeleteOpen(false);
    setSelectedProduct(null);
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

        {/* Products Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {product.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{product.provider}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-primary text-primary">
                    {product.category}
                  </Badge>
                </TableCell>
                <TableCell className="font-display font-bold">{product.price}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{product.stock}</TableCell>
                <TableCell>
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
            ))}
          </TableBody>
        </Table>
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
