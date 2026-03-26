import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProductCard from "@/components/marketplace/ProductCard";
import { products as mockProducts, getProviderById } from "@/data/mockData";
import { productsService } from "@/lib/apiServices";
import type { Product } from "@/data/mockData";

const AllProducts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [title, setTitle] = useState("All Products");
  const [description, setDescription] = useState("Explore our complete collection of handcrafted African products");
  
  const featured = searchParams.get("featured");
  const sort = searchParams.get("sort");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const filters: Record<string, unknown> = {};
        let newTitle = "All Products";
        let newDescription = "Explore our complete collection of handcrafted African products";

        if (featured === "true") {
          filters.featured = true;
          newTitle = "Featured Products";
          newDescription = "Hand-picked selections from our best artisans";
        } else if (featured === "seasonal") {
          filters.styleTags = "Traditional,Wedding,Aso-Ebi,Elegant";
          newTitle = "Seasonal Picks";
          newDescription = "Perfect items for the current season and celebrations";
        } else if (featured === "best-sellers") {
          filters.isBestSeller = true;
          newTitle = "Best Sellers";
          newDescription = "Our most popular items loved by customers";
        } else if (featured === "trending") {
          filters.isTrending = true;
          newTitle = "Trending Now";
          newDescription = "The hottest styles making waves right now";
        }

        if (sort === "newest") {
          filters.sort = "newest";
          newTitle = "New Arrivals";
          newDescription = "Fresh additions to our marketplace";
        }

        const res = await productsService.list(filters);
        setDisplayProducts(res.data);
        setTitle(newTitle);
        setDescription(newDescription);
      } catch {
        // Fallback to mock
        let fallback = [...mockProducts];
        if (featured === "true") {
          fallback = mockProducts.filter(p => {
            const provider = getProviderById(p.providerId);
            return provider?.featured;
          });
        } else if (featured === "seasonal") {
          fallback = mockProducts.filter(p => 
            p.tags.some(t => ["Traditional", "Wedding", "Aso-Ebi", "Elegant"].includes(t))
          );
        } else if (featured === "best-sellers") {
          fallback = mockProducts.filter(p => {
            const provider = getProviderById(p.providerId);
            return provider && provider.rating >= 4.7;
          });
        } else if (featured === "trending") {
          fallback = mockProducts.filter(p => 
            p.tags.some(t => ["Modern", "Afrocentric", "Custom"].includes(t))
          );
        }
        setDisplayProducts(fallback);
      }
    };

    loadProducts();
  }, [featured, sort]);

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
          <p className="text-sm text-muted-foreground mt-2">{displayProducts.length} products found</p>
        </div>

        {/* Products Grid */}
        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
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
