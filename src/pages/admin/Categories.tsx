import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, MoreVertical, FolderTree } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Categories = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: 1, name: "Tailoring", products: 45, icon: "👔", color: "bg-primary/10" },
    { id: 2, name: "Leather Goods", products: 32, icon: "👜", color: "bg-secondary/10" },
    { id: 3, name: "Home Decor", products: 58, icon: "🏺", color: "bg-accent/10" },
    { id: 4, name: "Furniture", products: 27, icon: "🪑", color: "bg-primary/10" },
    { id: 5, name: "Accessories", products: 64, icon: "💍", color: "bg-secondary/10" },
    { id: 6, name: "Footwear", products: 38, icon: "👞", color: "bg-accent/10" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Categories
            </h1>
            <p className="mt-1 text-muted-foreground">
              Organize products into categories
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary-dark shadow-md hover:shadow-lg transition-all duration-300">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-input bg-card"
          />
        </div>

        {/* Categories Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="overflow-hidden border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer group"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${category.color} text-3xl transition-transform duration-300 group-hover:scale-110`}>
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {category.products} products
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
                      <DropdownMenuItem>View Products</DropdownMenuItem>
                      <DropdownMenuItem>Edit Category</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Categories;
