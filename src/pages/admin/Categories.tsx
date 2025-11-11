import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, FolderTree } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Categories = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch service categories
  const { data: serviceCategories = [], isLoading: loadingService } = useQuery({
    queryKey: ['service-categories', searchQuery],
    queryFn: async () => {
      let query = supabase.from('service_categories').select('*').order('name');
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch product categories
  const { data: productCategories = [], isLoading: loadingProduct } = useQuery({
    queryKey: ['product-categories', searchQuery],
    queryFn: async () => {
      let query = supabase.from('product_categories').select('*').order('name');
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingService || loadingProduct;

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
              Service and product category management
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

        {/* Service Categories Section */}
        <div>
          <h2 className="text-xl font-display font-semibold mb-4">Service Categories</h2>
          {isLoading ? (
            <p className="text-center py-8">Loading categories...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {serviceCategories.map((category: any) => (
                <Card
                  key={category.id}
                  className="overflow-hidden border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl transition-transform duration-300 group-hover:scale-110">
                          <FolderTree className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-foreground truncate">
                            {category.name}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {category.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Product Categories Section */}
        <div>
          <h2 className="text-xl font-display font-semibold mb-4">Product Categories</h2>
          {isLoading ? (
            <p className="text-center py-8">Loading categories...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productCategories.map((category: any) => (
                <Card
                  key={category.id}
                  className="overflow-hidden border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-2xl transition-transform duration-300 group-hover:scale-110">
                          <FolderTree className="h-6 w-6 text-secondary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-foreground truncate">
                            {category.name}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {category.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Categories;
