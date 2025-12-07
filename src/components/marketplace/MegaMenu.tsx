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
  Home,
  Shirt,
  Crown,
  Glasses,
  Gift,
  Heart,
  Lamp,
  Frame,
  Sofa,
  Brush,
  PenTool,
  Ruler,
  Zap,
  Award,
  Hexagon,
  Circle,
  Square,
  Triangle,
  Flower2,
  Leaf,
  Wand2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SubCategory {
  name: string;
  slug: string;
  icon: React.ReactNode;
}

interface CategoryData {
  name: string;
  slug: string;
  icon: React.ReactNode;
  featured: { name: string; slug: string; icon: React.ReactNode }[];
  subcategories: SubCategory[];
}

const categories: CategoryData[] = [
  {
    name: "Tailoring",
    slug: "tailoring",
    icon: <Scissors className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles", icon: <Sparkles className="h-3.5 w-3.5" /> },
      { name: "Best Sellers", slug: "best-sellers", icon: <TrendingUp className="h-3.5 w-3.5" /> },
      { name: "Seasonal Picks", slug: "seasonal-picks", icon: <Leaf className="h-3.5 w-3.5" /> },
      { name: "Trending Pieces", slug: "trending-pieces", icon: <Flame className="h-3.5 w-3.5" /> },
    ],
    subcategories: [
      { name: "Kaftans", slug: "kaftans", icon: <Shirt className="h-3.5 w-3.5" /> },
      { name: "Ankara Jackets", slug: "ankara-jackets", icon: <Crown className="h-3.5 w-3.5" /> },
      { name: "Agbada", slug: "agbada", icon: <Award className="h-3.5 w-3.5" /> },
      { name: "Ankara Pants", slug: "ankara-pants", icon: <Ruler className="h-3.5 w-3.5" /> },
      { name: "Kaftan Sets", slug: "kaftan-sets", icon: <Hexagon className="h-3.5 w-3.5" /> },
      { name: "Traditional Wear", slug: "traditional-wear", icon: <Star className="h-3.5 w-3.5" /> },
      { name: "Customized Outfits", slug: "customized-outfits", icon: <PenTool className="h-3.5 w-3.5" /> },
      { name: "Ready-to-wear", slug: "ready-to-wear", icon: <Zap className="h-3.5 w-3.5" /> },
    ],
  },
  {
    name: "Shoemaking",
    slug: "shoemaking",
    icon: <Footprints className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles", icon: <Sparkles className="h-3.5 w-3.5" /> },
      { name: "Best Sellers", slug: "best-sellers", icon: <TrendingUp className="h-3.5 w-3.5" /> },
      { name: "Seasonal Picks", slug: "seasonal-picks", icon: <Leaf className="h-3.5 w-3.5" /> },
      { name: "Trending Pieces", slug: "trending-pieces", icon: <Flame className="h-3.5 w-3.5" /> },
    ],
    subcategories: [
      { name: "Leather Sandals", slug: "leather-sandals", icon: <Circle className="h-3.5 w-3.5" /> },
      { name: "Loafers", slug: "loafers", icon: <Square className="h-3.5 w-3.5" /> },
      { name: "Sneakers", slug: "sneakers", icon: <Zap className="h-3.5 w-3.5" /> },
      { name: "Custom Boots", slug: "custom-boots", icon: <Award className="h-3.5 w-3.5" /> },
      { name: "Handmade Slides", slug: "handmade-slides", icon: <Triangle className="h-3.5 w-3.5" /> },
      { name: "Luxury Shoes", slug: "luxury-shoes", icon: <Crown className="h-3.5 w-3.5" /> },
      { name: "Occasion Footwear", slug: "occasion-footwear", icon: <Star className="h-3.5 w-3.5" /> },
    ],
  },
  {
    name: "Leatherworks",
    slug: "leatherwork",
    icon: <Briefcase className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles", icon: <Sparkles className="h-3.5 w-3.5" /> },
      { name: "Best Sellers", slug: "best-sellers", icon: <TrendingUp className="h-3.5 w-3.5" /> },
      { name: "Seasonal Picks", slug: "seasonal-picks", icon: <Leaf className="h-3.5 w-3.5" /> },
      { name: "Trending Pieces", slug: "trending-pieces", icon: <Flame className="h-3.5 w-3.5" /> },
    ],
    subcategories: [
      { name: "Bags", slug: "bags", icon: <Briefcase className="h-3.5 w-3.5" /> },
      { name: "Wallets", slug: "wallets", icon: <Square className="h-3.5 w-3.5" /> },
      { name: "Belts", slug: "belts", icon: <Circle className="h-3.5 w-3.5" /> },
      { name: "Laptop Sleeves", slug: "laptop-sleeves", icon: <Frame className="h-3.5 w-3.5" /> },
      { name: "Travel Cases", slug: "travel-cases", icon: <Package className="h-3.5 w-3.5" /> },
    ],
  },
  {
    name: "Hair & Beauty",
    slug: "beauty",
    icon: <Sparkle className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles", icon: <Sparkles className="h-3.5 w-3.5" /> },
      { name: "Best Sellers", slug: "best-sellers", icon: <TrendingUp className="h-3.5 w-3.5" /> },
      { name: "Seasonal Picks", slug: "seasonal-picks", icon: <Leaf className="h-3.5 w-3.5" /> },
      { name: "Trending Pieces", slug: "trending-pieces", icon: <Flame className="h-3.5 w-3.5" /> },
    ],
    subcategories: [
      { name: "Hair Extensions", slug: "hair-extensions", icon: <Wand2 className="h-3.5 w-3.5" /> },
      { name: "Wigs", slug: "wigs", icon: <Crown className="h-3.5 w-3.5" /> },
      { name: "Braiding", slug: "braiding", icon: <Hexagon className="h-3.5 w-3.5" /> },
      { name: "Natural Hair Care", slug: "natural-hair-care", icon: <Flower2 className="h-3.5 w-3.5" /> },
      { name: "Beauty Products", slug: "beauty-products", icon: <Heart className="h-3.5 w-3.5" /> },
    ],
  },
  {
    name: "Accessories",
    slug: "accessories",
    icon: <Watch className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles", icon: <Sparkles className="h-3.5 w-3.5" /> },
      { name: "Best Sellers", slug: "best-sellers", icon: <TrendingUp className="h-3.5 w-3.5" /> },
      { name: "Seasonal Picks", slug: "seasonal-picks", icon: <Leaf className="h-3.5 w-3.5" /> },
      { name: "Trending Pieces", slug: "trending-pieces", icon: <Flame className="h-3.5 w-3.5" /> },
    ],
    subcategories: [
      { name: "Hats & Caps", slug: "hats-caps", icon: <Crown className="h-3.5 w-3.5" /> },
      { name: "Scarves", slug: "scarves", icon: <Brush className="h-3.5 w-3.5" /> },
      { name: "Ties & Bowties", slug: "ties-bowties", icon: <Award className="h-3.5 w-3.5" /> },
      { name: "Cufflinks", slug: "cufflinks", icon: <Circle className="h-3.5 w-3.5" /> },
      { name: "Sunglasses", slug: "sunglasses", icon: <Glasses className="h-3.5 w-3.5" /> },
    ],
  },
  {
    name: "Crafts",
    slug: "art",
    icon: <Palette className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles", icon: <Sparkles className="h-3.5 w-3.5" /> },
      { name: "Best Sellers", slug: "best-sellers", icon: <TrendingUp className="h-3.5 w-3.5" /> },
      { name: "Seasonal Picks", slug: "seasonal-picks", icon: <Leaf className="h-3.5 w-3.5" /> },
      { name: "Trending Pieces", slug: "trending-pieces", icon: <Flame className="h-3.5 w-3.5" /> },
    ],
    subcategories: [
      { name: "Pottery", slug: "pottery", icon: <Circle className="h-3.5 w-3.5" /> },
      { name: "Woodwork", slug: "woodwork", icon: <Square className="h-3.5 w-3.5" /> },
      { name: "Textiles", slug: "textiles", icon: <Brush className="h-3.5 w-3.5" /> },
      { name: "Beadwork", slug: "beadwork", icon: <Hexagon className="h-3.5 w-3.5" /> },
      { name: "Sculptures", slug: "sculptures", icon: <Triangle className="h-3.5 w-3.5" /> },
    ],
  },
  {
    name: "Jewelry",
    slug: "jewelry",
    icon: <Gem className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles", icon: <Sparkles className="h-3.5 w-3.5" /> },
      { name: "Best Sellers", slug: "best-sellers", icon: <TrendingUp className="h-3.5 w-3.5" /> },
      { name: "Seasonal Picks", slug: "seasonal-picks", icon: <Leaf className="h-3.5 w-3.5" /> },
      { name: "Trending Pieces", slug: "trending-pieces", icon: <Flame className="h-3.5 w-3.5" /> },
    ],
    subcategories: [
      { name: "Necklaces", slug: "necklaces", icon: <Circle className="h-3.5 w-3.5" /> },
      { name: "Earrings", slug: "earrings", icon: <Gem className="h-3.5 w-3.5" /> },
      { name: "Bracelets", slug: "bracelets", icon: <Hexagon className="h-3.5 w-3.5" /> },
      { name: "Rings", slug: "rings", icon: <Circle className="h-3.5 w-3.5" /> },
      { name: "Anklets", slug: "anklets", icon: <Square className="h-3.5 w-3.5" /> },
    ],
  },
  {
    name: "Home & Decor",
    slug: "furniture",
    icon: <Home className="h-4 w-4" />,
    featured: [
      { name: "Featured Styles", slug: "featured-styles", icon: <Sparkles className="h-3.5 w-3.5" /> },
      { name: "Best Sellers", slug: "best-sellers", icon: <TrendingUp className="h-3.5 w-3.5" /> },
      { name: "Seasonal Picks", slug: "seasonal-picks", icon: <Leaf className="h-3.5 w-3.5" /> },
      { name: "Trending Pieces", slug: "trending-pieces", icon: <Flame className="h-3.5 w-3.5" /> },
    ],
    subcategories: [
      { name: "Wall Art", slug: "wall-art", icon: <Frame className="h-3.5 w-3.5" /> },
      { name: "Furniture", slug: "furniture", icon: <Sofa className="h-3.5 w-3.5" /> },
      { name: "Lighting", slug: "lighting", icon: <Lamp className="h-3.5 w-3.5" /> },
      { name: "Rugs & Carpets", slug: "rugs-carpets", icon: <Square className="h-3.5 w-3.5" /> },
      { name: "Cushions & Throws", slug: "cushions-throws", icon: <Gift className="h-3.5 w-3.5" /> },
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
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<CategoryData | null>(categories[0]);

  if (!isOpen) return null;

  const handleCategoryClick = (categorySlug: string) => {
    onClose();
    navigate(`/marketplace/category/${categorySlug}`);
  };

  const handleArtisansClick = (categorySlug: string) => {
    onClose();
    navigate(`/marketplace/category/${categorySlug}`);
  };

  const handleSubcategoryClick = (categorySlug: string, subcategorySlug: string) => {
    onClose();
    navigate(`/marketplace/category/${categorySlug}?subcategory=${subcategorySlug}`);
  };

  const handleFeaturedClick = (categorySlug: string, featuredSlug: string) => {
    onClose();
    navigate(`/marketplace/category/${categorySlug}?featured=${featuredSlug}`);
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
                      <button
                        key={item.slug}
                        onClick={() => handleFeaturedClick(activeCategory.slug, item.slug)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                      >
                        <span className="text-primary">{item.icon}</span>
                        {item.name}
                      </button>
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
                      <button
                        key={sub.slug}
                        onClick={() => handleSubcategoryClick(activeCategory.slug, sub.slug)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                      >
                        <span className="text-muted-foreground">{sub.icon}</span>
                        {sub.name}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Browse All Link */}
              <div className="mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => handleCategoryClick(activeCategory.slug)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Browse all {activeCategory.name}
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