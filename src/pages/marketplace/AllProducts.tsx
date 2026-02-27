import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProductCard from "@/components/marketplace/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useMemo } from "react";

const AllProducts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const featured = searchParams.get("featured");
  const sort = searchParams.get("sort");

  const filters = useMemo(() => {
    if (featured === "true") return { featured: true };
    if (featured === "seasonal") return { seasonalPick: true };
    if (featured === "best-sellers") return { bestSeller: true };
    if (featured === "trending") return { trending: true };
    return {};
  }, [featured]);

  const { data: rawProducts = [], isLoading } = useProducts(filters);

  let displayProducts = rawProducts;
  let title = "All Products";
  let description = "Explore our complete collection of handcrafted African products";

  if (featured === "true") { title = "Featured Products"; description = "Hand-picked selections from our best artisans"; }
  else if (featured === "seasonal") { title = "Seasonal Picks"; description = "Perfect items for the current season and celebrations"; }
  else if (featured === "best-sellers") { title = "Best Sellers"; description = "Our most popular items loved by customers"; }
  else if (featured === "trending") { title = "Trending Now"; description = "The hottest styles making waves right now"; }
  if (sort === "newest") { title = "New Arrivals"; description = "Fresh additions to our marketplace"; }

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />
      <main className="container mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
          <p className="text-sm text-muted-foreground mt-2">{isLoading ? "Loading..." : `${displayProducts.length} products found`}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </main>
      <MarketplaceFooter />
    </div>
  );
};

export default AllProducts;
