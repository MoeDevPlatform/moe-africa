import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Package, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchResultsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
}

const SearchResults = ({ searchQuery, onSearchChange, onClose }: SearchResultsProps) => {
  const navigate = useNavigate();
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

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

  // Mock data - API: GET /search?q={query}
  const mockCategories = [
    { id: 1, name: "Tailoring", icon: "✂️", matches: searchQuery.toLowerCase().includes("tailor") },
    { id: 2, name: "Shoemaking", icon: "👞", matches: searchQuery.toLowerCase().includes("shoe") },
    { id: 3, name: "Accessories", icon: "👜", matches: searchQuery.toLowerCase().includes("access") },
  ];

  const mockProviders = [
    { 
      id: 1, 
      name: "Ade Tailors", 
      category: "Tailoring", 
      city: "Lagos", 
      rating: 4.8,
      matches: searchQuery.toLowerCase().includes("ade") || searchQuery.toLowerCase().includes("tailor")
    },
    { 
      id: 2, 
      name: "Royal Shoes", 
      category: "Shoemaking", 
      city: "Abuja", 
      rating: 4.6,
      matches: searchQuery.toLowerCase().includes("royal") || searchQuery.toLowerCase().includes("shoe")
    },
  ];

  const mockProducts = [
    {
      id: 101,
      name: "Custom Ankara Jacket",
      provider: "Ade Tailors",
      price: 25000,
      image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200",
      tags: ["Afrocentric", "Modern"],
      matches: searchQuery.toLowerCase().includes("jacket") || searchQuery.toLowerCase().includes("ankara")
    },
    {
      id: 102,
      name: "Leather Brogues",
      provider: "Royal Shoes",
      price: 32000,
      image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=200",
      tags: ["Classic", "Formal"],
      matches: searchQuery.toLowerCase().includes("leather") || searchQuery.toLowerCase().includes("brog")
    },
  ];

  const filteredCategories = mockCategories.filter(c => c.matches);
  const filteredProviders = mockProviders.filter(p => p.matches);
  const filteredProducts = mockProducts.filter(p => p.matches);

  const hasResults = filteredCategories.length > 0 || filteredProviders.length > 0 || filteredProducts.length > 0;

  const handleProductClick = (id: number) => {
    navigate(`/marketplace/product/${id}`);
    onClose();
  };

  const handleProviderClick = (id: number) => {
    navigate(`/marketplace/provider/${id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div ref={containerRef} className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Search Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search for artisans, products, or services..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
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
                  <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Categories
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {filteredCategories.map((cat) => (
                      <Card key={cat.id} className="p-4 hover:border-primary cursor-pointer transition-colors">
                        <div className="text-center">
                          <div className="text-3xl mb-2">{cat.icon}</div>
                          <p className="font-medium text-sm">{cat.name}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Providers */}
              {filteredProviders.length > 0 && (
                <div>
                  <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Service Providers
                  </h3>
                  <div className="space-y-2">
                    {filteredProviders.map((provider) => (
                      <Card 
                        key={provider.id} 
                        className="hover:border-primary cursor-pointer transition-colors"
                        onClick={() => handleProviderClick(provider.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{provider.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {provider.category} • {provider.city}
                              </p>
                            </div>
                            <Badge variant="secondary">⭐ {provider.rating}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {filteredProducts.length > 0 && (
                <div>
                  <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Products
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredProducts.map((product) => (
                      <Card 
                        key={product.id} 
                        className="hover:border-primary cursor-pointer transition-colors overflow-hidden"
                        onClick={() => handleProductClick(product.id)}
                      >
                        <div className="flex gap-4 p-4">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 truncate">{product.name}</h4>
                            <p className="text-xs text-muted-foreground mb-2">{product.provider}</p>
                            <p className="font-bold text-primary text-sm">₦{product.price.toLocaleString()}</p>
                            <div className="flex gap-1 mt-2">
                              {product.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-[10px] h-4">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
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
