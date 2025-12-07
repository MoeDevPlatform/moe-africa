import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProductCard from "@/components/marketplace/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shirt, Footprints, Gem, Sofa, Palette, Package, Watch, Briefcase, Sparkle, Home } from "lucide-react";
import { products } from "@/data/mockData";

const CategoryProducts = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const subcategory = searchParams.get('subcategory');
  const featured = searchParams.get('featured');

  // Get all products for this category
  const categoryProducts = products.filter((p) => p.category === category);

  const categoryIcons: Record<string, any> = {
    tailoring: Shirt,
    shoemaking: Footprints,
    beauty: Sparkle,
    leatherwork: Briefcase,
    crafts: Palette,
    accessories: Watch,
    furniture: Home,
    art: Palette,
    jewelry: Gem,
  };

  const categoryNames: Record<string, string> = {
    tailoring: "Tailoring",
    shoemaking: "Shoemaking",
    beauty: "Hair & Beauty",
    leatherwork: "Leatherworks",
    crafts: "Crafts",
    accessories: "Accessories",
    furniture: "Home & Decor",
    art: "Crafts",
    jewelry: "Jewelry",
  };

  const Icon = categoryIcons[category || ""] || Package;
  const categoryName = categoryNames[category || ""] || "Products";

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