import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProviderCard from "@/components/marketplace/ProviderCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Package } from "lucide-react";
import { useProviders } from "@/hooks/useProviders";
import { useCategories } from "@/hooks/useCategories";

const CategoryProviders = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();

  const { data: allProviders = [], isLoading } = useProviders({ activeOnly: true });
  const { data: categories = [] } = useCategories(true);

  // Match by slug
  const categoryMeta = categories.find((c) => c.slug === category || c.name.toLowerCase() === category);
  const categoryName = categoryMeta?.name || (category ? category.charAt(0).toUpperCase() + category.slice(1) : "Services");

  const providers = allProviders.filter((p) => {
    const catSlug = (p.service_categories as any)?.slug;
    const catName = (p.service_categories as any)?.name?.toLowerCase();
    return catSlug === category || catName === category?.toLowerCase();
  });

  const featuredProviders = providers.filter((p) => p.featured);
  const otherProviders = providers.filter((p) => !p.featured);

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate("/marketplace")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Button>

        <div className="flex items-center gap-3 mb-8">
          {categoryMeta?.icon ? (
            <span className="text-4xl">{categoryMeta.icon}</span>
          ) : (
            <Package className="h-8 w-8 text-primary" />
          )}
          <div>
            <h1 className="text-4xl font-display font-bold">{categoryName}</h1>
            {isLoading ? (
              <p className="text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading...</p>
            ) : (
              <p className="text-muted-foreground mt-1">
                {providers.length} {providers.length === 1 ? "artisan" : "artisans"} available
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display font-semibold mb-2">No artisans found</h2>
            <p className="text-muted-foreground mb-6">
              We're currently adding more {categoryName.toLowerCase()} artisans to our platform.
            </p>
            <Button onClick={() => navigate("/marketplace")}>Browse Other Categories</Button>
          </div>
        ) : (
          <>
            {featuredProviders.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-display font-bold mb-4">Featured {categoryName} Artisans</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredProviders.map((p) => (
                    <ProviderCard key={p.id} provider={p as any} />
                  ))}
                </div>
              </section>
            )}
            {otherProviders.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherProviders.map((p) => (
                  <ProviderCard key={p.id} provider={p as any} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <MarketplaceFooter />
    </div>
  );
};

export default CategoryProviders;
