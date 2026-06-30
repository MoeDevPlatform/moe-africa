import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { useCategories } from "@/contexts/CategoriesContext";
import { type CategoryDef } from "@/lib/categories";
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

/**
 * Mega-menu category view-model built from the canonical CATEGORIES list
 * (src/lib/categories.ts). Sub-items are static realistic product types per
 * category — backend does not yet expose this data.
 */
interface CategoryData {
  name: string;
  slug: string;
  icon: React.ReactNode;
  featured: { name: string; slug: string }[];
  subcategories: { name: string; slug: string }[];
}

const toTypeSlug = (s: string) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const FEATURED_RAILS = [
  { name: "Featured Styles", slug: "featured-styles" },
  { name: "Best Sellers", slug: "best-sellers" },
  { name: "Seasonal Picks", slug: "seasonal-picks" },
  { name: "Trending Pieces", slug: "trending-pieces" },
];

const categoriesFromDefs = (defs: CategoryDef[]): CategoryData[] =>
  defs.map((c: CategoryDef) => {
    const Icon = c.icon;
    return {
      name: c.label,
      slug: c.value,
      icon: Icon ? <Icon className="h-4 w-4" /> : <Package className="h-4 w-4" />,
      featured: FEATURED_RAILS,
      subcategories: (c.types ?? []).map((t) => ({ name: t, slug: toTypeSlug(t) })),
    };
  });

// Removed module-level categories — built inside component from CategoriesContext.

// Derive Seasonal Picks season from the current month (West Africa default).
// Nov–Apr = Harmattan, May–Oct = Rainy.
const currentSeason = (): "harmattan" | "rainy" => {
  const m = new Date().getMonth();
  return m >= 10 || m <= 3 ? "harmattan" : "rainy";
};

const quickLinks = [
  { name: "All Categories", slug: "all-categories", icon: <Layers className="h-4 w-4" />, path: "/marketplace" },
  { name: "All Products", slug: "all-products", icon: <Package className="h-4 w-4" />, path: "/marketplace/products" },
  { name: "All Artisans", slug: "all-artisans", icon: <Users className="h-4 w-4" />, path: "/marketplace/artisans" },
  { name: "Featured Picks", slug: "featured-picks", icon: <Sparkles className="h-4 w-4" />, path: "/marketplace/products?featured=true", badge: "New" },
  { name: "New Arrivals", slug: "new-arrivals", icon: <Clock className="h-4 w-4" />, path: "/marketplace/products?sort=newest" },
  { name: "Seasonal Picks", slug: "seasonal-picks", icon: <Star className="h-4 w-4" />, path: `/marketplace/products?season=${currentSeason()}` },
  { name: "Best Sellers", slug: "best-sellers", icon: <TrendingUp className="h-4 w-4" />, path: "/marketplace/products?sort=bestSeller" },
  { name: "Trending Now", slug: "trending-now", icon: <Flame className="h-4 w-4" />, path: "/marketplace/products?sort=trending" },
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
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
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
  const { categories: dynamicCategories } = useCategories();
  const visibleCategories = useMemo<CategoryData[]>(
    () => categoriesFromDefs(dynamicCategories),
    [dynamicCategories],
  );

  const [activeCategory, setActiveCategory] = useState<CategoryData | null>(null);

  useEffect(() => {
    if (visibleCategories.length === 0) {
      setActiveCategory(null);
      return;
    }
    if (!activeCategory || !visibleCategories.some((c) => c.slug === activeCategory.slug)) {
      setActiveCategory(visibleCategories[0]);
    }
  }, [visibleCategories, activeCategory]);

  if (!isOpen) return null;

  const handleCategoryClick = (categorySlug: string) => {
    onClose();
    navigate(`/marketplace/products?category=${categorySlug}`);
  };

  const handleBrowseAllProductsClick = (categorySlug: string) => {
    onClose();
    navigate(`/marketplace/products?category=${categorySlug}`);
  };

  const handleArtisansClick = (categorySlug: string) => {
    onClose();
    navigate(`/marketplace/artisans?category=${categorySlug}`);
  };

  const handleSubcategoryClick = (categorySlug: string, subItemName: string) => {
    onClose();
    navigate(`/marketplace/products?category=${categorySlug}&type=${encodeURIComponent(subItemName)}`);
  };

  const handleFeaturedClick = (categorySlug: string, featuredSlug: string) => {
    onClose();
    // Map featured rails to product list query params.
    if (featuredSlug === "best-sellers") return navigate(`/marketplace/products?category=${categorySlug}&sort=bestSeller`);
    if (featuredSlug === "trending-pieces") return navigate(`/marketplace/products?category=${categorySlug}&sort=trending`);
    if (featuredSlug === "seasonal-picks") return navigate(`/marketplace/products?category=${categorySlug}&season=${currentSeason()}`);
    return navigate(`/marketplace/products?category=${categorySlug}&featured=true`);
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
              {visibleCategories.map((category) => (
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
                        onClick={() => handleSubcategoryClick(activeCategory.slug, sub.name)}
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
