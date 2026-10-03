import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import EmptySection from "@/components/marketplace/EmptySection";
import { sectionsService } from "@/lib/apiServices";
import type { Provider } from "@/data/mockData";

interface FeaturedArtisansProps {
  /** Legacy prop — ignored when section API succeeds; kept for call-site compatibility. */
  providers?: Provider[];
  title?: string;
}

type SectionArtisan = {
  id: number;
  brandName: string;
  about: string;
  city: string;
  state: string;
  heroImage: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  styleTags: string[];
  category: string;
};

const FeaturedArtisans = ({ title = "Featured Artisans" }: FeaturedArtisansProps) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<SectionArtisan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    sectionsService
      .get("featured_artisans")
      .then((res) => {
        if (cancelled) return;
        const mapped = (res.items ?? []).map((raw: Record<string, any>) => ({
          id: Number(raw.id),
          brandName: raw.brandName || raw.name || "Artisan",
          about: raw.about || raw.description || "",
          city: raw.city || "",
          state: raw.state || "",
          heroImage: raw.heroImage || raw.images?.[0] || FALLBACK_IMAGE,
          rating: Number(raw.rating) || 0,
          reviewCount: Number(raw.reviewCount) || 0,
          verified: Boolean(raw.verified),
          styleTags: Array.isArray(raw.styleTags) ? raw.styleTags : [],
          category: raw.category || "",
        })).filter((a) => Number.isFinite(a.id) && a.id > 0);
        setItems(mapped);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="mb-12 md:mb-16">
        <div className="flex items-center gap-2 mb-6">
          <Award className="h-5 w-5 md:h-6 md:w-6 text-accent" />
          <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">{title}</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mb-12 md:mb-16">
        <EmptySection
          title="No featured artisans yet"
          description="Featured artisans will appear here as they are added to the platform."
        />
      </section>
    );
  }

  return (
    <section className="mb-12 md:mb-16">
      <div className="flex items-center gap-2 mb-6">
        <Award className="h-5 w-5 md:h-6 md:w-6 text-accent" />
        <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">{title}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {items.map((provider) => (
          <Card
            key={provider.id}
            className="overflow-hidden border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/marketplace/provider/${provider.id}`)}
          >
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
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
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
                  <p className="text-sm text-muted-foreground">
                    {[provider.city, provider.state].filter(Boolean).join(", ")}
                  </p>
                </div>
                {provider.reviewCount > 0 ? (
                  <div className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded-full">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="font-semibold text-sm">{Number(provider.rating).toFixed(1)}</span>
                  </div>
                ) : (
                  <div className="bg-muted px-2 py-1 rounded-full">
                    <span className="font-medium text-xs text-muted-foreground italic">No Reviews Yet</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{provider.about}</p>

              {provider.styleTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {provider.styleTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/marketplace/provider/${provider.id}`);
                }}
              >
                View Store
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default FeaturedArtisans;
