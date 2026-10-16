import { useEffect, useState } from "react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProviderCard from "@/components/marketplace/ProviderCard";
import { SkeletonGrid } from "@/components/common/Skeleton";
import SEOMeta from "@/components/common/SEOMeta";
import { providersService } from "@/lib/apiServices";
import type { Provider } from "@/data/mockData";

export default function CustomOrders() {
  const [artisans, setArtisans] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    providersService.listCustomOrderRanked().then((rows) => { if (!cancelled) setArtisans(rows); }).catch(() => { if (!cancelled) setError("We couldn't load custom-order artisans right now."); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  return <div className="min-h-screen bg-gradient-subtle"><SEOMeta title="Custom Orders | MOE Africa" description="Work directly with skilled African artisans to create something uniquely yours." /><MarketplaceNavbar /><main className="container mx-auto px-4 py-12"><header className="max-w-3xl mb-10"><h1 className="text-3xl md:text-5xl font-display font-bold mb-3">Custom Orders — Handcrafted Just for You</h1><p className="text-lg text-muted-foreground">Work directly with a skilled artisan to create something uniquely yours</p></header>{loading ? <SkeletonGrid count={4} /> : error ? <p role="alert" className="text-destructive">{error}</p> : artisans.length ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{artisans.map((artisan) => <ProviderCard key={artisan.id} provider={artisan} />)}</div> : <p className="text-muted-foreground">No artisans are accepting custom orders yet.</p>}</main><MarketplaceFooter /></div>;
}