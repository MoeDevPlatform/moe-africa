import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreVertical, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Products = () => {
  const [searchQuery, setSearchQuery] = useState("");

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
  ];

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
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary-dark shadow-md hover:shadow-lg transition-all duration-300">
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

        {/* Products Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {product.provider}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Product</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-primary text-primary">
                      {product.category}
                    </Badge>
                    <span className="text-sm font-medium text-muted-foreground">
                      {product.stock}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-display font-bold text-foreground">
                      {product.price}
                    </p>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Products;
