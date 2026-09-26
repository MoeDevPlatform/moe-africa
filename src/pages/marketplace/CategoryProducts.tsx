import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProductCard from "@/components/marketplace/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shirt, Footprints, Gem, Sofa, Palette, Package, Watch, Briefcase, Sparkle, Home } from "lucide-react";
import { products as mockProducts } from "@/data/mockData";
import { productsService } from "@/lib/apiServices";
import type { Product } from "@/data/mockData";
import { toCategoryLabel, toCategoryValue } from "@/lib/categories";

const CategoryProducts = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const categorySlug = toCategoryValue(category || "");
  
  const subcategory = searchParams.get('subcategory');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await productsService.list({ category: categorySlug || undefined });
        setCategoryProducts(res.data);
      } catch {
        setCategoryProducts(mockProducts.filter((p) => p.category === categorySlug || p.category === category));
      }
    };
    loadProducts();
  }, [category, categorySlug]);

  const categoryIcons: Record<string, any> = {
    tailoring: Shirt,
    shoemaking: Footprints,
    beauty: Sparkle,
    leatherwork: Briefcase,
    arts_and_crafts: Palette,
    jewellery: Gem,
    home_and_decor: Home,
    paintings_and_canvas: Palette,
    // legacy
    crafts: Palette,
    accessories: Watch,
    furniture: Home,
    art: Palette,
    jewelry: Gem,
    canvas: Palette,
  };

  const Icon = categoryIcons[categorySlug] || Package;
  const categoryName = toCategoryLabel(categorySlug) || "Products";

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          className="mb-6 gap-2"
          onClick={() => navigate("/marketplace")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Icon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-display font-bold">
              {subcategory ? `${subcategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}` : `All ${categoryName} Products`}
            </h1>
            <p className="text-muted-foreground mt-1">
              {categoryProducts.length} {categoryProducts.length === 1 ? "product" : "products"} available
              {subcategory && ` in ${subcategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`}
            </p>
          </div>
        </div>

        {categoryProducts.length === 0 ? (
          <div className="text-center py-12">
            <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display font-semibold mb-2">No products found</h2>
            <p className="text-muted-foreground mb-6">
              We're currently adding more {categoryName.toLowerCase()} products to our platform.
            </p>
            <Button onClick={() => navigate("/marketplace")}>
              Browse Other Categories
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default CategoryProducts;
