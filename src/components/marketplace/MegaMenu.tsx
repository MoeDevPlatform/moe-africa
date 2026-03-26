import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  TrendingUp, 
  Star, 
  Package, 
  Users, 
  Layers,
  Clock,
  Flame,
  ChevronRight,
  Scissors,
  Footprints,
  Briefcase,
  Sparkle,
  Watch,
  Palette,
  Gem,
  Home
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Category thumbnail images for the third column
const categoryThumbnails: Record<string, string> = {
  // Tailoring
  "kaftans": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=100&h=100&fit=crop",
  "ankara-jackets": "https://images.unsplash.com/photo-1558769132-cb1aea3c8501?w=100&h=100&fit=crop",
  "agbada": "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=100&h=100&fit=crop",
  "ankara-pants": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=100&h=100&fit=crop",
  "kaftan-sets": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=100&h=100&fit=crop",
  "traditional-wear": "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=100&h=100&fit=crop",
  "customized-outfits": "https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=100&h=100&fit=crop",
  "ready-to-wear": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=100&h=100&fit=crop",
  // Shoemaking
  "leather-sandals": "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=100&h=100&fit=crop",
  "loafers": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=100&h=100&fit=crop",
  "sneakers": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop",
  "custom-boots": "https://images.unsplash.com/photo-1542840843-3349799cded6?w=100&h=100&fit=crop",
  "handmade-slides": "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=100&h=100&fit=crop",
  "luxury-shoes": "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=100&h=100&fit=crop",
  "occasion-footwear": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=100&h=100&fit=crop",
  // Leatherwork
  "bags": "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=100&h=100&fit=crop",
  "wallets": "https://images.unsplash.com/photo-1627123424574-724758594e93?w=100&h=100&fit=crop",
  "belts": "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=100&h=100&fit=crop",
  "laptop-sleeves": "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=100&h=100&fit=crop",
  "travel-cases": "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=100&h=100&fit=crop",
  // Beauty
  "hair-extensions": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
  "wigs": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
  "braiding": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
  "natural-hair-care": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
  "beauty-products": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
  // Accessories
  "hats-caps": "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=100&h=100&fit=crop",
  "scarves": "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=100&h=100&fit=crop",
  "ties-bowties": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=100&h=100&fit=crop",
  "cufflinks": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=100&h=100&fit=crop",
  "sunglasses": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=100&h=100&fit=crop",
  // Canvas & Painting
  "canvas-paintings": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=100&h=100&fit=crop",
  "printed-canvas": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=100&h=100&fit=crop",
  "portrait-paintings": "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=100&h=100&fit=crop",
  "abstract-art": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=100&h=100&fit=crop",
  "pop-art": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=100&h=100&fit=crop",
  // Crafts
  "pottery": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=100&h=100&fit=crop",
  "woodwork": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop",
  "textiles": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop",
  "beadwork": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=100&h=100&fit=crop",
  "sculptures": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop",
  // Jewelry
  "necklaces": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=100&h=100&fit=crop",
  "earrings": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=100&h=100&fit=crop",
  "bracelets": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=100&h=100&fit=crop",
  "rings": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=100&h=100&fit=crop",
  "anklets": "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=100&h=100&fit=crop",
  // Home & Decor
  "wall-art": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop",
  "furniture": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&h=100&fit=crop",
  "lighting": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=100&h=100&fit=crop",
  "rugs-carpets": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop",
  "cushions-throws": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop",
  // Featured
  "featured-styles": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=100&h=100&fit=crop",
  "best-sellers": "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=100&h=100&fit=crop",
  "seasonal-picks": "https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=100&h=100&fit=crop",
  "trending-pieces": "https://images.unsplash.com/photo-1558769132-cb1aea3c8501?w=100&h=100&fit=crop",
};

const defaultThumbnail = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop";

interface SubCategory {
  name: string;
  slug: string;
}

interface CategoryData {
  name: string;
  slug: string;
  icon: React.ReactNode;
  featured: { name: string; slug: string }[];
  subcategories: SubCategory[];
}

const categories: CategoryData[] = [
  {
    name: "Tailoring",
    slug: "tailoring",
    icon: <Scissors className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles" },
      { name: "Best Sellers", slug: "best-sellers" },
      { name: "Seasonal Picks", slug: "seasonal-picks" },
      { name: "Trending Pieces", slug: "trending-pieces" },
    ],
    subcategories: [
      { name: "Kaftans", slug: "kaftans" },
      { name: "Ankara Jackets", slug: "ankara-jackets" },
      { name: "Agbada", slug: "agbada" },
      { name: "Ankara Pants", slug: "ankara-pants" },
      { name: "Kaftan Sets", slug: "kaftan-sets" },
      { name: "Traditional Wear", slug: "traditional-wear" },
      { name: "Customized Outfits", slug: "customized-outfits" },
      { name: "Ready-to-wear", slug: "ready-to-wear" },
    ],
  },
  {
    name: "Shoemaking",
    slug: "shoemaking",
    icon: <Footprints className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles" },
      { name: "Best Sellers", slug: "best-sellers" },
      { name: "Seasonal Picks", slug: "seasonal-picks" },
      { name: "Trending Pieces", slug: "trending-pieces" },
    ],
    subcategories: [
      { name: "Leather Sandals", slug: "leather-sandals" },
      { name: "Loafers", slug: "loafers" },
      { name: "Sneakers", slug: "sneakers" },
      { name: "Custom Boots", slug: "custom-boots" },
      { name: "Handmade Slides", slug: "handmade-slides" },
      { name: "Luxury Shoes", slug: "luxury-shoes" },
      { name: "Occasion Footwear", slug: "occasion-footwear" },
    ],
  },
  {
    name: "Leatherworks",
    slug: "leatherwork",
    icon: <Briefcase className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles" },
      { name: "Best Sellers", slug: "best-sellers" },
      { name: "Seasonal Picks", slug: "seasonal-picks" },
      { name: "Trending Pieces", slug: "trending-pieces" },
    ],
    subcategories: [
      { name: "Bags", slug: "bags" },
      { name: "Wallets", slug: "wallets" },
      { name: "Belts", slug: "belts" },
      { name: "Laptop Sleeves", slug: "laptop-sleeves" },
      { name: "Travel Cases", slug: "travel-cases" },
    ],
  },
  {
    name: "Hair & Beauty",
    slug: "beauty",
    icon: <Sparkle className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles" },
      { name: "Best Sellers", slug: "best-sellers" },
      { name: "Seasonal Picks", slug: "seasonal-picks" },
      { name: "Trending Pieces", slug: "trending-pieces" },
    ],
    subcategories: [
      { name: "Hair Extensions", slug: "hair-extensions" },
      { name: "Wigs", slug: "wigs" },
      { name: "Braiding", slug: "braiding" },
      { name: "Natural Hair Care", slug: "natural-hair-care" },
      { name: "Beauty Products", slug: "beauty-products" },
    ],
  },
  {
    name: "Accessories",
    slug: "accessories",
    icon: <Watch className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles" },
      { name: "Best Sellers", slug: "best-sellers" },
      { name: "Seasonal Picks", slug: "seasonal-picks" },
      { name: "Trending Pieces", slug: "trending-pieces" },
    ],
    subcategories: [
      { name: "Hats & Caps", slug: "hats-caps" },
      { name: "Scarves", slug: "scarves" },
      { name: "Ties & Bowties", slug: "ties-bowties" },
      { name: "Cufflinks", slug: "cufflinks" },
      { name: "Sunglasses", slug: "sunglasses" },
    ],
  },
  {
    name: "Crafts",
    slug: "art",
    icon: <Palette className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles" },
      { name: "Best Sellers", slug: "best-sellers" },
      { name: "Seasonal Picks", slug: "seasonal-picks" },
      { name: "Trending Pieces", slug: "trending-pieces" },
    ],
    subcategories: [
      { name: "Pottery", slug: "pottery" },
      { name: "Woodwork", slug: "woodwork" },
      { name: "Textiles", slug: "textiles" },
      { name: "Beadwork", slug: "beadwork" },
      { name: "Sculptures", slug: "sculptures" },
    ],
  },
  {
    name: "Canvas & Painting",
    slug: "canvas",
    icon: <Palette className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles" },
      { name: "Best Sellers", slug: "best-sellers" },
      { name: "Seasonal Picks", slug: "seasonal-picks" },
      { name: "Trending Pieces", slug: "trending-pieces" },
    ],
    subcategories: [
      { name: "Canvas Paintings", slug: "canvas-paintings" },
      { name: "Printed Canvas", slug: "printed-canvas" },
      { name: "Portrait Paintings", slug: "portrait-paintings" },
      { name: "Abstract Art", slug: "abstract-art" },
      { name: "Pop Art", slug: "pop-art" },
    ],
  },
  {
    name: "Jewelry",
    slug: "jewelry",
    icon: <Gem className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles" },
      { name: "Best Sellers", slug: "best-sellers" },
      { name: "Seasonal Picks", slug: "seasonal-picks" },
      { name: "Trending Pieces", slug: "trending-pieces" },
    ],
    subcategories: [
      { name: "Necklaces", slug: "necklaces" },
      { name: "Earrings", slug: "earrings" },
      { name: "Bracelets", slug: "bracelets" },
      { name: "Rings", slug: "rings" },
      { name: "Anklets", slug: "anklets" },
    ],
  },
  {
    name: "Home & Decor",
    slug: "furniture",
    icon: <Home className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles" },
      { name: "Best Sellers", slug: "best-sellers" },
      { name: "Seasonal Picks", slug: "seasonal-picks" },
      { name: "Trending Pieces", slug: "trending-pieces" },
    ],
    subcategories: [
      { name: "Wall Art", slug: "wall-art" },
      { name: "Furniture", slug: "furniture" },
      { name: "Lighting", slug: "lighting" },
      { name: "Rugs & Carpets", slug: "rugs-carpets" },
      { name: "Cushions & Throws", slug: "cushions-throws" },
    ],
  },
];

const quickLinks = [
  { name: "All Categories", slug: "all-categories", icon: <Layers className="h-4 w-4" />, path: "/marketplace" },
  { name: "All Products", slug: "all-products", icon: <Package className="h-4 w-4" />, path: "/marketplace/products" },
  { name: "All Artisans", slug: "all-artisans", icon: <Users className="h-4 w-4" />, path: "/marketplace/artisans" },
  { name: "Featured Picks", slug: "featured-picks", icon: <Sparkles className="h-4 w-4" />, path: "/marketplace/products?featured=true", badge: "New" },
  { name: "New Arrivals", slug: "new-arrivals", icon: <Clock className="h-4 w-4" />, path: "/marketplace/products?sort=newest" },
  { name: "Seasonal Picks", slug: "seasonal-picks", icon: <Star className="h-4 w-4" />, path: "/marketplace/products?featured=seasonal" },
  { name: "Best Sellers", slug: "best-sellers", icon: <TrendingUp className="h-4 w-4" />, path: "/marketplace/products?featured=best-sellers" },
  { name: "Trending Now", slug: "trending-now", icon: <Flame className="h-4 w-4" />, path: "/marketplace/products?featured=trending" },
];

// Mini image card component for subcategories
const MiniImageCard = ({ slug, name, onClick }: { slug: string; name: string; onClick: () => void }) => {
  const thumbnail = categoryThumbnails[slug] || defaultThumbnail;
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left group w-full"
    >
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-border group-hover:border-primary/50 transition-colors">
        <img 
          src={thumbnail} 
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
        />
      </div>
      <span className="truncate">{name}</span>
    </button>
  );
};

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const MegaMenu = ({ isOpen, onClose, onMouseEnter, onMouseLeave }: MegaMenuProps) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<CategoryData | null>(categories[0]);

  if (!isOpen) return null;

  const handleCategoryClick = (categorySlug: string) => {
    onClose();
    navigate(`/marketplace/category/${categorySlug}`);
  };

  const handleBrowseAllProductsClick = (categorySlug: string) => {
    onClose();
    navigate(`/marketplace/category/${categorySlug}/products`);
  };

  const handleArtisansClick = (categorySlug: string) => {
    onClose();
    navigate(`/marketplace/category/${categorySlug}`);
  };

  const handleSubcategoryClick = (categorySlug: string, subcategorySlug: string) => {
    onClose();
    navigate(`/marketplace/category/${categorySlug}/products?subcategory=${subcategorySlug}`);
  };

  const handleFeaturedClick = (categorySlug: string, featuredSlug: string) => {
    onClose();
    navigate(`/marketplace/category/${categorySlug}/products?featured=${featuredSlug}`);
  };

  return (
    <div 
      className="absolute top-full left-0 w-full bg-card border-b border-border shadow-lg z-50"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Column A - Quick Links */}
          <div className="col-span-3 border-r border-border pr-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
              Quick Links
            </h3>
            <nav className="space-y-1">
              {quickLinks.map((link) => (
                <Link
                  key={link.slug}
                  to={link.path}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors group"
                >
                  <span className="text-muted-foreground group-hover:text-accent-foreground transition-colors">
                    {link.icon}
                  </span>
                  <span className="flex-1">{link.name}</span>
                  {link.badge && (
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                      {link.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column B - Service Categories */}
          <div className="col-span-3 border-r border-border pr-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
              Categories
            </h3>
            <nav className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.slug}
                  onMouseEnter={() => setActiveCategory(category)}
                  onClick={() => handleCategoryClick(category.slug)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group text-left",
                    activeCategory?.slug === category.slug
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent/50"
                  )}
                >
                  <span className={cn(
                    "transition-colors",
                    activeCategory?.slug === category.slug
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {category.icon}
                  </span>
                  <span className="flex-1">{category.name}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </nav>
          </div>

          {/* Column C - Category Details */}
          {activeCategory && (
            <div className="col-span-6">
              {/* All Artisans Link - Prominent Position */}
              <button
                onClick={() => handleArtisansClick(activeCategory.slug)}
                className="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors group text-left"
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">View All {activeCategory.name} Artisans</span>
                <ChevronRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="grid grid-cols-2 gap-8">
                {/* Featured Subsections */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                    Featured in {activeCategory.name}
                  </h3>
                  <nav className="space-y-1">
                    {activeCategory.featured.map((item) => (
                      <MiniImageCard
                        key={item.slug}
                        slug={item.slug}
                        name={item.name}
                        onClick={() => handleFeaturedClick(activeCategory.slug, item.slug)}
                      />
                    ))}
                  </nav>
                </div>

                {/* Product Types / Subcategories */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                    Shop by Type
                  </h3>
                  <nav className="grid grid-cols-1 gap-0.5">
                    {activeCategory.subcategories.map((sub) => (
                      <MiniImageCard
                        key={sub.slug}
                        slug={sub.slug}
                        name={sub.name}
                        onClick={() => handleSubcategoryClick(activeCategory.slug, sub.slug)}
                      />
                    ))}
                  </nav>
                </div>
              </div>

              {/* Browse All Products Link */}
              <div className="mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => handleBrowseAllProductsClick(activeCategory.slug)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Package className="h-4 w-4" />
                  Browse all {activeCategory.name} Products
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;