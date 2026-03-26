import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle, Award } from "lucide-react";
import { Provider, getProductsByProviderId } from "@/data/mockData";

interface FeaturedArtisansProps {
  providers: Provider[];
  title?: string;
}

const FeaturedArtisans = ({ providers, title = "Featured Artisans" }: FeaturedArtisansProps) => {
  const navigate = useNavigate();
  const featuredProviders = providers.filter(p => p.featured);
  
  if (featuredProviders.length === 0) return null;

  return (
    <section className="mb-12 md:mb-16">
      <div className="flex items-center gap-2 mb-6">
        <Award className="h-5 w-5 md:h-6 md:w-6 text-accent" />
        <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">{title}</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {featuredProviders.map((provider) => {
          const products = getProductsByProviderId(provider.id).slice(0, 3);
          return (
            <Card 
              key={provider.id} 
              className="overflow-hidden border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/marketplace/provider/${provider.id}`)}
            >
              {/* Featured Badge Ribbon */}
              <div className="relative">
                <div className="absolute top-4 -left-8 z-10 bg-accent text-accent-foreground px-10 py-1 text-xs font-semibold transform -rotate-45 shadow-md">
                  Featured
                </div>
                <div className="h-40 md:h-48 overflow-hidden">
                  <img 
                    src={provider.heroImage} 
                    alt={provider.brandName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
                  />
                </div>
              </div>
              
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-lg md:text-xl">{provider.brandName}</h3>
                      {provider.verified && (
                        <CheckCircle className="h-5 w-5 text-primary fill-primary/20" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{provider.city}, {provider.state}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded-full">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="font-semibold text-sm">{provider.rating}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{provider.about}</p>

                {/* Style Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {provider.styleTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Top Products Preview */}
                {products.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Top Products</p>
                    <div className="flex gap-2">
                      {products.map((product) => (
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
                              src={product.images[0]} 
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
        })}
      </div>
    </section>
  );
};

export default FeaturedArtisans;
