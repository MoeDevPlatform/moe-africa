import { useState } from "react";
import { Link } from "react-router-dom";
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
    slug: "leatherworks",
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
    slug: "hair-beauty",
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
    slug: "crafts",
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
    slug: "home-decor",
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
  { name: "All Products", slug: "all-products", icon: <Package className="h-4 w-4" />, path: "/marketplace?view=products" },
  { name: "All Artisans", slug: "all-artisans", icon: <Users className="h-4 w-4" />, path: "/marketplace?view=artisans" },
  { name: "Featured Picks", slug: "featured-picks", icon: <Sparkles className="h-4 w-4" />, path: "/marketplace?featured=true", badge: "New" },
  { name: "New Arrivals", slug: "new-arrivals", icon: <Clock className="h-4 w-4" />, path: "/marketplace?sort=newest" },
  { name: "Seasonal Picks", slug: "seasonal-picks", icon: <Star className="h-4 w-4" />, path: "/marketplace?featured=seasonal" },
  { name: "Best Sellers", slug: "best-sellers", icon: <TrendingUp className="h-4 w-4" />, path: "/marketplace?featured=best-sellers" },
  { name: "Trending Now", slug: "trending-now", icon: <Flame className="h-4 w-4" />, path: "/marketplace?featured=trending" },
];

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const MegaMenu = ({ isOpen, onClose, onMouseEnter, onMouseLeave }: MegaMenuProps) => {
  const [activeCategory, setActiveCategory] = useState<CategoryData | null>(categories[0]);

  if (!isOpen) return null;

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
                  onClick={() => {
                    onClose();
                    window.location.href = `/marketplace?category=${category.slug}`;
                  }}
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
              <Link
                to={`/category/${activeCategory.slug}/artisans`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 mb-4 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors group"
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">View All {activeCategory.name} Artisans</span>
                <ChevronRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="grid grid-cols-2 gap-8">
                {/* Featured Subsections */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                    Featured in {activeCategory.name}
                  </h3>
                  <nav className="space-y-1">
                    {activeCategory.featured.map((item) => (
                      <Link
                        key={item.slug}
                        to={`/marketplace?category=${activeCategory.slug}&featured=${item.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Product Types / Subcategories */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                    Shop by Type
                  </h3>
                  <nav className="grid grid-cols-2 gap-1">
                    {activeCategory.subcategories.map((sub) => (
                      <Link
                        key={sub.slug}
                        to={`/marketplace?category=${activeCategory.slug}&subcategory=${sub.slug}`}
                        onClick={onClose}
                        className="px-3 py-2 rounded-lg text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Browse All Link */}
              <div className="mt-6 pt-4 border-t border-border">
                <Link
                  to={`/marketplace?category=${activeCategory.slug}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Browse all {activeCategory.name}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;
