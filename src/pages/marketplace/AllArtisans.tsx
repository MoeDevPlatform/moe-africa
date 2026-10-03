import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ArtisanResults from "@/components/marketplace/ArtisanResults";
import { useArtisanSearch } from "@/hooks/useArtisanSearch";
import { providers as mockProviders } from "@/data/mockData";
import { providersService } from "@/lib/apiServices";
import { getCategory } from "@/lib/categories";
import { useCategories } from "@/contexts/CategoriesContext";
import type { Provider } from "@/data/mockData";
import FilterDrawer, { DEFAULT_ARTISAN_FILTERS, type FilterState } from "@/components/marketplace/FilterDrawer";

const AllArtisans = () => {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [searchParams] = useSearchParams();
  const [displayProviders, setDisplayProviders] = useState<Provider[]>([]);
  const [title, setTitle] = useState("All Artisans");
  const [description, setDescription] = useState("Discover talented artisans from across Africa");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_ARTISAN_FILTERS);
  
  
  const featured = searchParams.get("featured");
  const category = searchParams.get("category");
  const search = useArtisanSearch({ category, featured: featured === "true" }, filters);
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_ARTISAN_FILTERS);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const filters: Record<string, unknown> = {};
        let newTitle = "All Artisans";
        let newDescription = "Discover talented artisans from across Africa";

        if (featured === "true") {
          filters.featured = true;
          newTitle = "Featured Artisans";
          newDescription = "Our most acclaimed artisans with exceptional craftsmanship";
        }
        if (category) {
          filters.category = category;
          const cat = getCategory(category, categories);
          if (cat) {
            newTitle = `Artisans in ${cat.label}`;
            newDescription = `Browse artisans specialising in ${cat.label.toLowerCase()}`;
          }
        }

        const res = await providersService.list(filters);
        setDisplayProviders(res.data);
        setTitle(newTitle);
        setDescription(newDescription);
      } catch {
        let fallback = [...mockProviders];
        if (featured === "true") {
          fallback = mockProviders.filter(p => p.featured);
        }
        if (category) {
          fallback = fallback.filter(p => (p.category || "").toLowerCase() === category.toLowerCase());
        }
        setDisplayProviders(fallback);
      }
    };

    loadProviders();
  }, [featured, category, categories]);

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
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
            <p className="text-sm text-muted-foreground mt-2">{search.loading ? "Searching…" : `${search.total} artisans found`}</p>
          </div>
          <FilterDrawer artisansOnly filters={filters} onFiltersChange={setFilters} />
        </div>

        <ArtisanResults {...search} filtered={isFiltered} onClear={() => setFilters(DEFAULT_ARTISAN_FILTERS)} />
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default AllArtisans;
