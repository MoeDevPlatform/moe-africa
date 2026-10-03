import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProviderCard from "@/components/marketplace/ProviderCard";
import type { Provider } from "@/data/mockData";

interface Props {
  results: Provider[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
  onRetry?: () => void;
  onClear?: () => void;
  filtered: boolean;
}

/** Shared filtered-artisan grid with loading, error, empty and pagination states. */
const ArtisanResults = ({ results, loading, error, page, totalPages, setPage, onClear, filtered }: Props) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground" role="status">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading artisans…
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-16" role="alert">
        <p className="text-destructive mb-2">We couldn't load artisans.</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }
  if (!results.length) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">
          {filtered ? "No artisans found. Try adjusting your filters." : "No artisans found"}
        </p>
        {filtered && onClear && <Button variant="outline" onClick={onClear}>Clear filters</Button>}
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {results.map((p) => <ProviderCard key={p.id} provider={p} />)}
      </div>
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3 mt-8" aria-label="Artisan pages">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </nav>
      )}
    </>
  );
};

export default ArtisanResults;
