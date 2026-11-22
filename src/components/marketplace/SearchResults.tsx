import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Package, Search, Store, Tag } from "lucide-react";
import { apiGet } from "@/lib/moeApi";
import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import type { Product, Provider } from "@/data/mockData";

type SearchCategory = { id: string; name: string };

type SearchResponse = {
  products: Product[];
  providers: Provider[];
  categories: SearchCategory[];
};

interface SearchResultsProps {
  searchQuery: string;
  onClose: () => void;
}

export function HighlightMatch({ text, query }: { text: string; query: string }) {
  const match = query.trim();
  const start = text.toLowerCase().indexOf(match.toLowerCase());
  if (!match || start < 0) return <>{text}</>;

  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-sm bg-primary/15 px-0.5 text-foreground">
        {text.slice(start, start + match.length)}
      </mark>
      {text.slice(start + match.length)}
    </>
  );
}

const SearchResults = ({ searchQuery, onClose }: SearchResultsProps) => {
  const navigate = useNavigate();
  const [results, setResults] = useState<SearchResponse>({
    products: [],
    providers: [],
    categories: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const query = searchQuery.trim();

  useEffect(() => {
    setActiveIndex(-1);
    if (query.length < 2) {
      setResults({ products: [], providers: [], categories: [] });
      setLoading(false);
      setError(false);
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(false);
      apiGet<SearchResponse>("/search", { q: query, type: "all" })
        .then((response) => {
          if (!active) return;
          setResults({
            products: response.products ?? [],
            providers: response.providers ?? [],
            categories: response.categories ?? [],
          });
        })
        .catch((requestError) => {
          if (active) {
            setResults({ products: [], providers: [], categories: [] });
            setError(true);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      active = false;
    };
  }, [query]);

  const suggestions = useMemo(
    () => [
      ...results.products.slice(0, 4).map((product) => ({
        key: `product-${product.id}`,
        label: product.name,
        detail: product.artisanName || "Product",
        image: product.images?.[0],
        icon: Package,
        href: `/marketplace/product/${product.id}`,
        group: "Products",
      })),
      ...results.providers.slice(0, 3).map((provider) => ({
        key: `provider-${provider.id}`,
        label: provider.brandName,
        detail: provider.category || provider.city || "Artisan service",
        image: provider.heroImage,
        icon: Store,
        href: `/marketplace/provider/${provider.id}`,
        group: "Artisans & services",
      })),
      ...results.categories.slice(0, 3).map((category) => ({
        key: `category-${category.id}`,
        label: category.name,
        detail: "Category",
        image: undefined,
        icon: Tag,
        href: `/marketplace/category/${category.id}`,
        group: "Categories",
      })),
    ].slice(0, 8),
    [results],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" && suggestions.length) {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % suggestions.length);
      } else if (event.key === "ArrowUp" && suggestions.length) {
        event.preventDefault();
        setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
      } else if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        navigate(suggestions[activeIndex].href);
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [activeIndex, navigate, onClose, suggestions]);

  const open = (href: string) => {
    navigate(href);
    onClose();
  };

  const viewAll = () => open(`/marketplace/search?q=${encodeURIComponent(query)}`);
  const grouped = suggestions.reduce<Record<string, typeof suggestions>>((groups, suggestion) => {
    (groups[suggestion.group] ||= []).push(suggestion);
    return groups;
  }, {});

  return (
    <div
      id="marketplace-search-suggestions"
      role="dialog"
      aria-label="Search suggestions"
      data-testid="search-suggestions"
      className="absolute left-0 right-0 top-full z-[70] mt-2 max-h-[min(32rem,70vh)] overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
    >
      {query.length < 2 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">Type at least 2 characters to search.</p>
      ) : loading ? (
        <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Finding matches…
        </div>
      ) : error ? (
        <p className="px-4 py-3 text-sm text-destructive">Search is temporarily unavailable.</p>
      ) : suggestions.length === 0 ? (
        <div className="px-4 py-4">
          <p className="text-sm font-medium">No suggestions for “{query}”</p>
          <button type="button" onClick={viewAll} className="mt-1 text-sm text-primary hover:underline">
            Search the full marketplace
          </button>
        </div>
      ) : (
        <>
          <div className="py-2" role="listbox" aria-label="Marketplace suggestions">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </p>
                {items.map((suggestion) => {
                  const index = suggestions.findIndex((item) => item.key === suggestion.key);
                  const Icon = suggestion.icon;
                  return (
                    <button
                      key={suggestion.key}
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => open(suggestion.href)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                        index === activeIndex ? "bg-accent" : "hover:bg-accent/70"
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/10 text-primary">
                        {suggestion.image ? (
                          <img
                            src={suggestion.image}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = FALLBACK_IMAGE;
                            }}
                          />
                        ) : (
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          <HighlightMatch text={suggestion.label} query={query} />
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">{suggestion.detail}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={viewAll}
            className="sticky bottom-0 flex w-full items-center justify-center gap-2 border-t bg-popover px-4 py-3 text-sm font-semibold text-primary hover:bg-accent"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            View all results for “{query}”
          </button>
        </>
      )}
    </div>
  );
};

export default SearchResults;
