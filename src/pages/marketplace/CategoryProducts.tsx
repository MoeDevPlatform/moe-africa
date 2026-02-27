import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProductCard from "@/components/marketplace/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";

const CategoryProducts = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const subcategory = searchParams.get("subcategory");
  const featured = searchParams.get("featured");

  const { data: categories = [] } = useCategories(true);
  const categoryMeta = categories.find((c) => c.slug === category || c.name.toLowerCase() === category);
  const categoryName = categoryMeta?.name || (category ? category.charAt(0).toUpperCase() + category.slice(1) : "Products");

  // Build filters
  const filters: any = { activeOnly: true };
  if (featured === "featured-styles" || featured === "true") filters.featured = true;
  if (featured === "best-sellers") filters.bestSeller = true;
  if (featured === "seasonal-picks") filters.seasonalPick = true;
  if (featured === "trending-pieces") filters.trending = true;

  const { data: allProducts = [], isLoading } = useProducts(filters);

  // Filter to this category
  const categoryProducts = allProducts.filter((p) => {
    const slug = (p.service_categories as any)?.slug;
    const name = (p.service_categories as any)?.name?.toLowerCase();
    return slug === category || name === category?.toLowerCase();
  });

  const displayTitle = subcategory
    ? subcategory.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : featured
    ? featured.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : `All ${categoryName} Products`;

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-3 mb-8">
          {categoryMeta?.icon ? (
            <span className="text-4xl">{categoryMeta.icon}</span>
          ) : (
            <Package className="h-8 w-8 text-primary" />
          )}
          <div>
            <h1 className="text-4xl font-display font-bold">{displayTitle}</h1>
            {isLoading ? (
              <p className="text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading...</p>
            ) : (
              <p className="text-muted-foreground mt-1">
                {categoryProducts.length} {categoryProducts.length === 1 ? "product" : "products"} available
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : categoryProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display font-semibold mb-2">No products found</h2>
            <p className="text-muted-foreground mb-6">
              We're currently adding more {categoryName.toLowerCase()} products to our platform.
            </p>
            <Button onClick={() => navigate("/marketplace")}>Browse Other Categories</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        )}
      </main>
      <MarketplaceFooter />
    </div>
  );
};

export default CategoryProducts;
