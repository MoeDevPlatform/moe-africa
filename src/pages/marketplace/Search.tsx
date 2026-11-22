import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Package, Search as SearchIcon, Store, Tag, X } from "lucide-react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProductCard from "@/components/marketplace/ProductCard";
import { HighlightMatch } from "@/components/marketplace/SearchResults";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiGet } from "@/lib/moeApi";
import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { matchesAudience } from "@/lib/productAudience";
import type { Product, Provider } from "@/data/mockData";

type SearchResponse = {
  products: Product[];
  providers: Provider[];
  categories: Array<{ id: string; name: string }>;
};

const EMPTY_RESULTS: SearchResponse = { products: [], providers: [], categories: [] };

const MarketplaceSearch = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const [draft, setDraft] = useState(query);
  const [results, setResults] = useState<SearchResponse>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productLimit, setProductLimit] = useState(8);
  const [artisanLimit, setArtisanLimit] = useState(6);

  const category = searchParams.get("category") || "all";
  const audience = searchParams.get("audience") || "all";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sort = searchParams.get("sort") || "relevance";

  useEffect(() => setDraft(query), [query]);

  useEffect(() => {
    let active = true;
    setProductLimit(8);
    setArtisanLimit(6);
    if (query.length < 2) {
      setResults(EMPTY_RESULTS);
      setError(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
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
        if (!active) return;
        setResults(EMPTY_RESULTS);
        setError(requestError instanceof Error ? requestError.message : "Search is unavailable");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query]);

  const productCategories = useMemo(
    () =>
      [...new Set(results.products.map((product) => product.category).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [results.products],
  );

  const filteredProducts = useMemo(() => {
    const min = Number(minPrice);
    const max = Number(maxPrice);
    const rows = results.products.filter((product) => {
      const price = product.priceRange?.min ?? 0;
      if (category !== "all" && product.category !== category) return false;
      if (audience !== "all" && !matchesAudience(product.designedFor, audience)) return false;
      if (minPrice && Number.isFinite(min) && price < min) return false;
      if (maxPrice && Number.isFinite(max) && price > max) return false;
      return true;
    });

    if (sort === "price_asc") rows.sort((a, b) => (a.priceRange?.min ?? 0) - (b.priceRange?.min ?? 0));
    if (sort === "price_desc") rows.sort((a, b) => (b.priceRange?.min ?? 0) - (a.priceRange?.min ?? 0));
    if (sort === "name_asc") rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [audience, category, maxPrice, minPrice, results.products, sort]);

  const totalShown = filteredProducts.length + results.providers.length + results.categories.length;
  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all" || value === "relevance") next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextQuery = draft.trim();
    if (!nextQuery) return;
    const next = new URLSearchParams(searchParams);
    next.set("q", nextQuery);
    setSearchParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    ["category", "audience", "minPrice", "maxPrice", "sort"].forEach((key) => next.delete(key));
    setSearchParams(next);
  };

  const allProductsHref = `/marketplace/products?${searchParams.toString()}`;

  return (
    <div className="marketplace-page min-h-screen bg-background">
      <MarketplaceNavbar />
      <main className="container mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>

        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Search the marketplace</h1>
          {query && (
            <p className="mt-2 text-muted-foreground">
              Results for <span className="font-medium text-foreground">“{query}”</span>
            </p>
          )}

          <form onSubmit={submit} className="relative mt-6" role="search">
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="h-12 rounded-full border-primary/40 pl-12 pr-24"
              placeholder="Search products, artisans and services"
              aria-label="Search the marketplace"
              autoFocus={!query}
            />
            {draft && (
              <button
                type="button"
                onClick={() => {
                  setDraft("");
                  const next = new URLSearchParams(searchParams);
                  next.delete("q");
                  setSearchParams(next);
                }}
                className="absolute right-16 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            <Button type="submit" size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full">
              Search
            </Button>
          </form>

          {query && (
            <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3 lg:grid-cols-6" aria-label="Search filters">
              <label className="col-span-2 text-xs font-medium sm:col-span-1">
                Category
                <select value={category} onChange={(event) => updateFilter("category", event.target.value)} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm">
                  <option value="all">All categories</option>
                  {productCategories.map((item) => <option key={item} value={item}>{item.replace(/[-_]/g, " ")}</option>)}
                </select>
              </label>
              <label className="text-xs font-medium">
                Audience
                <select value={audience} onChange={(event) => updateFilter("audience", event.target.value)} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm">
                  <option value="all">All</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="children">Children</option>
                  <option value="unisex">Unisex</option>
                </select>
              </label>
              <label className="text-xs font-medium">
                Min price
                <Input type="number" min="0" value={minPrice} onChange={(event) => updateFilter("minPrice", event.target.value)} className="mt-1 h-9" placeholder="₦0" />
              </label>
              <label className="text-xs font-medium">
                Max price
                <Input type="number" min="0" value={maxPrice} onChange={(event) => updateFilter("maxPrice", event.target.value)} className="mt-1 h-9" placeholder="Any" />
              </label>
              <label className="col-span-2 text-xs font-medium sm:col-span-1">
                Sort
                <select value={sort} onChange={(event) => updateFilter("sort", event.target.value)} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm">
                  <option value="relevance">Relevance</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                  <option value="name_asc">Name: A–Z</option>
                </select>
              </label>
              <Button type="button" variant="ghost" size="sm" className="self-end" onClick={clearFilters}>Clear filters</Button>
            </div>
          )}

          {!query ? (
            <Card className="mt-8 p-8 text-center text-muted-foreground">Enter a search term to discover products and artisans.</Card>
          ) : query.length < 2 ? (
            <Card className="mt-8 p-8 text-center text-muted-foreground">Enter at least 2 characters to search.</Card>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Searching…</div>
          ) : error ? (
            <Card className="mt-8 p-8 text-center">
              <p className="font-medium">Search unavailable</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </Card>
          ) : totalShown === 0 ? (
            <Card className="mt-8 p-10 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium">No results found for “{query}”</p>
              <p className="mt-1 text-sm text-muted-foreground">Try another term or clear the filters.</p>
            </Card>
          ) : (
            <div className="mt-8 space-y-12">
              <p className="text-sm text-muted-foreground" aria-live="polite">{totalShown} matching results shown</p>

              {results.categories.length > 0 && (
                <section aria-labelledby="search-categories-heading">
                  <h2 id="search-categories-heading" className="mb-4 flex items-center gap-2 text-xl font-semibold"><Tag className="h-5 w-5" /> Categories</h2>
                  <div className="flex flex-wrap gap-2">
                    {results.categories.map((item) => (
                      <Link key={item.id} to={`/marketplace/category/${item.id}`} className="rounded-full border bg-card px-4 py-2 text-sm hover:border-primary hover:text-primary">
                        <HighlightMatch text={item.name} query={query} />
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {filteredProducts.length > 0 && (
                <section aria-labelledby="search-products-heading">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 id="search-products-heading" className="flex items-center gap-2 text-xl font-semibold"><Package className="h-5 w-5" /> Products ({filteredProducts.length})</h2>
                    <Link to={allProductsHref} className="text-sm font-medium text-primary hover:underline">View all matching products</Link>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
                    {filteredProducts.slice(0, productLimit).map((product) => <ProductCard key={product.id} product={product} />)}
                  </div>
                  {productLimit < filteredProducts.length && <Button variant="outline" className="mt-6" onClick={() => setProductLimit((limit) => limit + 8)}>Show more products</Button>}
                </section>
              )}

              {results.providers.length > 0 && (
                <section aria-labelledby="search-artisans-heading">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 id="search-artisans-heading" className="flex items-center gap-2 text-xl font-semibold"><Store className="h-5 w-5" /> Artisans & services ({results.providers.length})</h2>
                    <Link to={`/marketplace/artisans?q=${encodeURIComponent(query)}`} className="text-sm font-medium text-primary hover:underline">View all matching artisans</Link>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.providers.slice(0, artisanLimit).map((provider) => (
                      <Link key={provider.id} to={`/marketplace/provider/${provider.id}`} className="flex min-w-0 items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary">
                        <img src={provider.heroImage || FALLBACK_IMAGE} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = FALLBACK_IMAGE; }} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold"><HighlightMatch text={provider.brandName} query={query} /></span>
                          <span className="block truncate text-sm text-muted-foreground">{provider.category || "Artisan service"}{provider.city ? ` · ${provider.city}` : ""}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                  {artisanLimit < results.providers.length && <Button variant="outline" className="mt-6" onClick={() => setArtisanLimit((limit) => limit + 6)}>Show more artisans</Button>}
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <MarketplaceFooter />
    </div>
  );
};

export default MarketplaceSearch;
