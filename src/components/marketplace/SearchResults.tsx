import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  X, 
  Package, 
  User, 
  Tag, 
  Scissors, 
  Footprints, 
  Gem, 
  Palette, 
  Briefcase, 
  Watch,
  Sparkle,
  Home,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { providers as allProviders } from "@/data/mockData";

interface SearchResultsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
}

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  tailoring: <Scissors className="h-4 w-4" />,
  shoemaking: <Footprints className="h-4 w-4" />,
  accessories: <Gem className="h-4 w-4" />,
  leatherwork: <Briefcase className="h-4 w-4" />,
  beauty: <Sparkle className="h-4 w-4" />,
  art: <Palette className="h-4 w-4" />,
  jewelry: <Watch className="h-4 w-4" />,
  furniture: <Home className="h-4 w-4" />,
};

// All searchable categories
const searchableCategories = [
  { id: "tailoring", name: "Tailoring", slug: "tailoring", description: "Custom tailored clothing" },
  { id: "shoemaking", name: "Shoemaking", slug: "shoemaking", description: "Handcrafted footwear" },
  { id: "accessories", name: "Accessories", slug: "accessories", description: "Hats, scarves & more" },
  { id: "leatherwork", name: "Leatherworks", slug: "leatherwork", description: "Bags, wallets & belts" },
  { id: "beauty", name: "Hair & Beauty", slug: "beauty", description: "Hair & beauty services" },
  { id: "art", name: "Arts & Crafts", slug: "art", description: "Pottery, woodwork & more" },
  { id: "jewelry", name: "Jewelry", slug: "jewelry", description: "Necklaces, rings & earrings" },
  { id: "furniture", name: "Home & Decor", slug: "furniture", description: "Furniture & home items" },
];

// Mock products with more variety
const searchableProducts = [
  {
    id: 101,
    name: "Custom Ankara Jacket",
    provider: "Ade Tailors",
    providerId: 1,
    category: "tailoring",
    price: 25000,
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200",
    tags: ["Afrocentric", "Modern"],
  },
  {
    id: 102,
    name: "Leather Brogues",
    provider: "Royal Shoes",
    providerId: 2,
    category: "shoemaking",
    price: 32000,
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=200",
    tags: ["Classic", "Formal"],
  },
  {
    id: 103,
    name: "Traditional Agbada",
    provider: "Ade Tailors",
    providerId: 1,
    category: "tailoring",
    price: 45000,
    image: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=200",
    tags: ["Traditional", "Luxury"],
  },
  {
    id: 104,
    name: "Handmade Leather Bag",
    provider: "Craft Masters",
    providerId: 3,
    category: "leatherwork",
    price: 28000,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200",
    tags: ["Handmade", "Premium"],
  },
  {
    id: 105,
    name: "Beaded Necklace",
    provider: "Jewelry Artisan",
    providerId: 4,
    category: "jewelry",
    price: 15000,
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200",
    tags: ["Afrocentric", "Statement"],
  },
  {
    id: 106,
    name: "Kaftan Set",
    provider: "Ade Tailors",
    providerId: 1,
    category: "tailoring",
    price: 35000,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200",
    tags: ["Modern", "Elegant"],
  },
];

const SearchResults = ({ searchQuery, onSearchChange, onClose }: SearchResultsProps) => {
  const navigate = useNavigate();
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle ESC key and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Filter results based on search query
  const query = debouncedQuery.toLowerCase().trim();
  
  const filteredCategories = query
    ? searchableCategories.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
      )
    : [];

  const filteredProviders = query
    ? allProviders.filter(
        (p) =>
          p.brandName.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.styleTags.some((tag) => tag.toLowerCase().includes(query)) ||
          p.city.toLowerCase().includes(query)
      )
    : [];

  const filteredProducts = query
    ? searchableProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.provider.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    : [];

  const hasResults =
    filteredCategories.length > 0 ||
    filteredProviders.length > 0 ||
    filteredProducts.length > 0;

  const handleProductClick = (id: number) => {
    navigate(`/marketplace/product/${id}`);
    onClose();
  };

  const handleProviderClick = (id: number) => {
    navigate(`/marketplace/provider/${id}`);
    onClose();
  };

  const handleCategoryClick = (slug: string) => {
    navigate(`/marketplace/category/${slug}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div ref={containerRef} className="container mx-auto px-4 py-6 max-w-4xl bg-background">
        {/* Search Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search for artisans, products, or services..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10 border-border focus:ring-primary"
              autoFocus
              aria-label="Search input"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
          {!debouncedQuery ? (
            <Card className="p-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Start typing to search...</p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Search for artisans, products, categories, or styles
              </p>
            </Card>
          ) : !hasResults ? (
            <Card className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-display font-semibold text-lg mb-2">No results found</h3>
              <p className="text-muted-foreground">Try adjusting your search terms</p>
            </Card>
          ) : (
            <>
              {/* Categories */}
              {filteredCategories.length > 0 && (
                <div>
                  <h3 className="font-display font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    Categories
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredCategories.map((cat) => (
                      <Card
                        key={cat.id}
                        className="p-4 hover:border-primary cursor-pointer transition-colors group"
                        onClick={() => handleCategoryClick(cat.slug)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            {categoryIcons[cat.slug] || <Tag className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{cat.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {cat.description}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Providers */}
              {filteredProviders.length > 0 && (
                <div>
                  <h3 className="font-display font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                    <User className="h-4 w-4" />
                    Artisans ({filteredProviders.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredProviders.slice(0, 5).map((provider) => (
                      <Card
                        key={provider.id}
                        className="hover:border-primary cursor-pointer transition-colors group"
                        onClick={() => handleProviderClick(provider.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {provider.heroImage ? (
                                <img
                                  src={provider.heroImage}
                                  alt={provider.brandName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{provider.brandName}</h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {provider.category} • {provider.city}, {provider.state}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">⭐ {provider.rating}</Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredProviders.length > 5 && (
                      <button
                        onClick={() => {
                          navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}&view=artisans`);
                          onClose();
                        }}
                        className="w-full text-center py-2 text-sm text-primary hover:underline"
                      >
                        View all {filteredProviders.length} artisans
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Products */}
              {filteredProducts.length > 0 && (
                <div>
                  <h3 className="font-display font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Products ({filteredProducts.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredProducts.slice(0, 6).map((product) => (
                      <Card
                        key={product.id}
                        className="hover:border-primary cursor-pointer transition-colors overflow-hidden group"
                        onClick={() => handleProductClick(product.id)}
                      >
                        <div className="flex gap-4 p-4">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 truncate">
                              {product.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mb-2">
                              {product.provider}
                            </p>
                            <p className="font-bold text-primary text-sm">
                              ₦{product.price.toLocaleString()}
                            </p>
                            <div className="flex gap-1 mt-2">
                              {product.tags.slice(0, 2).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-[10px] h-4"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground self-center group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </Card>
                    ))}
                  </div>
                  {filteredProducts.length > 6 && (
                    <button
                      onClick={() => {
                        navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}&view=products`);
                        onClose();
                      }}
                      className="w-full text-center py-3 text-sm text-primary hover:underline"
                    >
                      View all {filteredProducts.length} products
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;