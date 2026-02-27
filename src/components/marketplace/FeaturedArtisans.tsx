import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle, Award } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

interface AnyProvider {
  id: string | number;
  name?: string;
  brandName?: string;
  hero_image_url?: string | null;
  heroImage?: string;
  bio?: string | null;
  about?: string;
  city?: string | null;
  state?: string | null;
  rating?: number | null;
  featured?: boolean;
  verified?: boolean;
  style_tags?: string[];
  styleTags?: string[];
}

interface FeaturedArtisansProps {
  providers: AnyProvider[];
  title?: string;
}

const FeaturedArtisanCard = ({ provider }: { provider: AnyProvider }) => {
  const navigate = useNavigate();
  const brandName = provider.brandName || provider.name || "Artisan";
  const heroImage = provider.heroImage || provider.hero_image_url || "https://images.unsplash.com/photo-1558769132-cb1aea3c8501?w=1200";
  const about = provider.about || provider.bio || "";
  const tags = provider.styleTags || provider.style_tags || [];
  const { data: products = [] } = useProducts({ providerId: String(provider.id), activeOnly: true });
  const topProducts = products.slice(0, 3);

  return (
    <Card
      className="overflow-hidden border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/marketplace/provider/${provider.id}`)}
    >
      <div className="relative">
        <div className="absolute top-4 -left-8 z-10 bg-accent text-accent-foreground px-10 py-1 text-xs font-semibold transform -rotate-45 shadow-md">
          Featured
        </div>
        <div className="h-40 md:h-48 overflow-hidden">
          <img src={heroImage} alt={brandName} className="w-full h-full object-cover" />
        </div>
      </div>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold text-lg md:text-xl">{brandName}</h3>
              {provider.verified && <CheckCircle className="h-5 w-5 text-primary fill-primary/20" />}
            </div>
            <p className="text-sm text-muted-foreground">{[provider.city, provider.state].filter(Boolean).join(", ")}</p>
          </div>
          {provider.rating && provider.rating > 0 && (
            <div className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded-full">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-semibold text-sm">{provider.rating}</span>
            </div>
          )}
        </div>

        {about && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{about}</p>}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        {topProducts.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Top Products</p>
            <div className="flex gap-2">
              {topProducts.map((product) => (
                <div
                  key={product.id}
                  className="relative group cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/marketplace/product/${product.id}`);
                  }}
                >
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                    <img
                      src={product.media_urls?.[0] ?? "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          className="w-full"
          variant="default"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/marketplace/provider/${provider.id}`);
          }}
        >
          View Profile
        </Button>
      </CardContent>
    </Card>
  );
};

const FeaturedArtisans = ({ providers, title = "Featured Artisans" }: FeaturedArtisansProps) => {
  const featuredProviders = providers.filter((p) => p.featured);
  if (featuredProviders.length === 0) return null;

  return (
    <section className="mb-12 md:mb-16">
      <div className="flex items-center gap-2 mb-6">
        <Award className="h-5 w-5 md:h-6 md:w-6 text-accent" />
        <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">{title}</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {featuredProviders.map((provider) => (
          <FeaturedArtisanCard key={provider.id} provider={provider} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedArtisans;
