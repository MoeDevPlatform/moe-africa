import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminService,
  searchService,
  productsService,
  providersService,
  type AdminSection,
  type AdminSectionItem,
} from "@/lib/apiServices";
import { toast } from "sonner";
import { ArrowLeft, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import {
  mergeKeywords,
  parseKeywordInput,
  removeKeywordFrom,
} from "@/lib/sectionKeywords";

const SectionDetail = () => {
  const { sectionKey = "" } = useParams();
  const [section, setSection] = useState<AdminSection | null>(null);
  const [items, setItems] = useState<AdminSectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ id: number; label: string; score?: number; artisanName?: string | null }>
  >([]);
  const [searching, setSearching] = useState(false);
  const [keywordsText, setKeywordsText] = useState("");
  const [savedKeywords, setSavedKeywords] = useState<string[]>([]);
  const [removingKeyword, setRemovingKeyword] = useState<string | null>(null);
  const [savingKeywords, setSavingKeywords] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!sectionKey) return;
    setLoading(true);
    adminService
      .getSection(sectionKey)
      .then((s) => {
        setSection(s);
        const sorted = [...(s.items ?? [])].sort((a, b) => a.position - b.position);
        setItems(sorted);
        setSavedKeywords(s.keywords ?? []);
      })
      .catch((err) => toast.error(err?.message || "Failed to load section"))
      .finally(() => setLoading(false));
  }, [sectionKey]);

  useEffect(() => {
    load();
  }, [load]);

  const itemType =
    sectionKey === "featured_artisans" ? "artisan" : "product";

  // Browse list shown before typing; filtered live as the admin types.
  const [catalogue, setCatalogue] = useState<
    Array<{ id: number; label: string; image?: string; sub?: string; artisanName?: string | null }>
  >([]);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  useEffect(() => {
    if (!sectionKey) return;
    let cancelled = false;
    setCatalogueLoading(true);
    const task =
      itemType === "artisan"
        ? providersService.list({ pageSize: 100 } as never).then((r) =>
            (r.data ?? []).map((p) => ({
              id: p.id,
              label: p.brandName || p.businessName || `Artisan #${p.id}`,
              image: p.heroImage || p.productPreviews?.[0]?.imageUrl,
              sub: [p.city, p.category].filter(Boolean).join(" · "),
            })),
          )
        : productsService.list({ pageSize: 100 } as never).then((r) =>
            (r.data ?? []).map((p) => ({
              id: p.id,
              label: p.name || `Product #${p.id}`,
              image: p.images?.[0],
              artisanName: p.artisanName || null,
              sub: p.priceRange?.min != null ? `₦${p.priceRange.min.toLocaleString()}` : undefined,
            })),
          );
    task
      .then((rows) => !cancelled && setCatalogue(rows))
      .catch(() => !cancelled && setCatalogue([]))
      .finally(() => !cancelled && setCatalogueLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sectionKey, itemType]);

  const imageById = new Map(catalogue.map((c) => [c.id, c]));
  const q = query.trim().toLowerCase();
  const visibleResults: Array<{
    id: number;
    label: string;
    score?: number;
    image?: string;
    sub?: string;
    artisanName?: string | null;
  }> =
    results.length > 0
      ? results.map((r) => {
          const known = imageById.get(r.id);
          return {
            ...r,
            image: known?.image,
            sub: known?.sub,
            artisanName: r.artisanName || known?.artisanName || null,
          };
        })
      : catalogue.filter((c) => !q || c.label.toLowerCase().includes(q) || (c.artisanName || "").toLowerCase().includes(q));
  const curatedIds = new Set(items.map((i) => Number(i.itemId)));

  const runSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      const q = query.trim().toLowerCase();
      const res = await searchService.search(
        query.trim(),
        itemType === "artisan" ? "providers" : "products",
      );
      if (itemType === "artisan") {
        let providers = res.providers ?? [];
        // Fallback: admin artisan list when /search returns nothing for short/admin names
        if (providers.length === 0) {
          try {
            const adminList = await adminService.listArtisans({ pageSize: 100 });
            providers = (adminList.data ?? [])
              .filter((a) => {
                const blob = `${a.brandName || ""} ${a.businessName || ""} ${a.name || ""} ${a.email || ""}`.toLowerCase();
                return blob.includes(q);
              })
              .map((a) => ({
                id: a.id,
                brandName: a.brandName || a.businessName || a.name || `Artisan #${a.id}`,
              })) as typeof providers;
          } catch {
            /* ignore */
          }
        }
        let scoreMap = new Map<number, number>();
        try {
          const scores = await adminService.listArtisanScores({ pageSize: 100 });
          scoreMap = new Map(
            (scores.items ?? []).map((r) => [r.artisanId, r.compositeScore]),
          );
        } catch {
          /* scores optional for search UI */
        }
        setResults(
          providers.map((p) => ({
            id: p.id,
            label: p.brandName || `Artisan #${p.id}`,
            score: scoreMap.get(p.id),
          })),
        );
      } else {
        let products = res.products ?? [];
        if (products.length === 0) {
          try {
            const adminProducts = await adminService.listProducts({ pageSize: 100 });
            products = (adminProducts.data ?? [])
              .filter((p) => (p.name || "").toLowerCase().includes(q))
              .map((p) => ({ id: p.id, name: p.name, artisanName: p.artisanName || p.artisan || null })) as typeof products;
          } catch {
            /* ignore */
          }
        }
        setResults(
          products.map((p) => ({
            id: p.id,
            label: p.name || `Product #${p.id}`,
            artisanName:
              ("artisanName" in p ? (p as { artisanName?: string | null }).artisanName : null) || null,
          })),
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const addItem = async (id: number) => {
    try {
      await adminService.addSectionItem(sectionKey, {
        itemType,
        itemId: String(id),
      });
      toast.success("Item added");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add item");
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await adminService.removeSectionItem(sectionKey, itemId);
      toast.success("Item removed");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      await adminService.reorderSectionItems(
        sectionKey,
        items.map((it, idx) => ({ itemId: it.itemId, position: idx })),
      );
      toast.success("Order saved");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  const addKeywords = async () => {
    const incoming = parseKeywordInput(keywordsText);
    if (incoming.length === 0) return;
    const { merged, added, duplicates } = mergeKeywords(savedKeywords, incoming);
    if (added.length === 0) {
      toast.info(
        duplicates.length === 1
          ? `"${duplicates[0]}" is already saved`
          : `${duplicates.map((d) => `"${d}"`).join(", ")} are already saved`,
      );
      setKeywordsText("");
      return;
    }
    const previous = savedKeywords;
    setSavingKeywords(true);
    setSavedKeywords(merged);
    try {
      await adminService.setSeasonalKeywords(merged);
      toast.success(
        added.length === 1 ? `Saved "${added[0]}"` : `Saved ${added.length} keywords`,
      );
      if (duplicates.length > 0) {
        toast.info(
          duplicates.length === 1
            ? `"${duplicates[0]}" was already saved`
            : `${duplicates.map((d) => `"${d}"`).join(", ")} were already saved`,
        );
      }
      setKeywordsText("");
    } catch (err: unknown) {
      setSavedKeywords(previous);
      toast.error(err instanceof Error ? err.message : "Failed to save keywords");
    } finally {
      setSavingKeywords(false);
    }
  };

  const removeKeyword = async (keyword: string) => {
    setRemovingKeyword(keyword);
    const next = removeKeywordFrom(savedKeywords, keyword);
    setSavedKeywords(next);
    try {
      await adminService.setSeasonalKeywords(next);
      toast.success(`Removed "${keyword}"`);
    } catch (err: unknown) {
      setSavedKeywords(savedKeywords);
      toast.error(err instanceof Error ? err.message : "Failed to remove keyword");
    } finally {
      setRemovingKeyword(null);
    }
  };

  const onDrop = (toIndex: number) => {
    if (dragIndex == null || dragIndex === toIndex) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/sections">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-display font-bold">
              {section?.label || sectionKey}
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">{sectionKey}</p>
          </div>
          {section && (
            <Badge variant={section.isActive ? "default" : "secondary"}>
              {section.isActive ? "Active" : "Inactive"}
            </Badge>
          )}
        </div>

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            {sectionKey === "seasonal_picks" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Seasonal keywords
                    {savedKeywords.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        {savedKeywords.length} saved
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      data-testid="keyword-input"
                      value={keywordsText}
                      onChange={(e) => setKeywordsText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void addKeywords();
                        }
                      }}
                      placeholder="Add a keyword — or paste several, separated by commas"
                      aria-label="Add seasonal keywords, comma separated"
                    />
                    <Button
                      data-testid="add-keywords"
                      onClick={addKeywords}
                      disabled={savingKeywords || keywordsText.trim().length === 0}
                    >
                      {savingKeywords ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Add keywords
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can save as many keywords as you like — each one you add is kept
                    alongside the others. Delete any keyword with its trash icon.
                  </p>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Saved keywords
                    </p>
                    {savedKeywords.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        None saved yet. Add one above.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {savedKeywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background pl-3 pr-1.5 py-1 text-sm"
                          >
                            {keyword}
                            <button
                              type="button"
                              data-testid={`remove-keyword-${keyword}`}
                              onClick={() => removeKeyword(keyword)}
                              disabled={removingKeyword !== null}
                              aria-label={`Delete saved keyword ${keyword}`}
                              className="rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:opacity-50"
                            >
                              {removingKeyword === keyword ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Curated items</CardTitle>
                <Button onClick={saveOrder} disabled={saving || items.length === 0}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save order
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No curated items yet. Search below to add products or artisans.
                  </p>
                ) : (
                  <ul data-testid="curated-items" className="space-y-2">
                  {items.map((item, index) => (
                    <li
                      key={item.id}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDrop(index)}
                      className="flex items-center gap-3 rounded-md border border-border p-3 bg-card"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="text-xs text-muted-foreground w-6">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {(typeof item.preview?.name === "string"
                            ? item.preview.name
                            : null) || `${item.itemType} #${item.itemId}`}
                        </p>
                        {item.itemType === "product" && (
                          <p className="truncate text-xs text-muted-foreground" data-testid="curated-artisan-name">
                            {typeof item.preview?.artisanName === "string" && item.preview.artisanName
                              ? item.preview.artisanName
                              : "Artisan unavailable"}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {item.itemType} · id {item.itemId}
                          {item.compositeScore != null
                            ? ` · score ${Math.round(item.compositeScore)}`
                            : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`remove-section-item-${item.itemId}`}
                        onClick={() => removeItem(item.itemId)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Add {itemType === "artisan" ? "artisan" : "product"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    data-testid={itemType === "artisan" ? "artisan-search" : "product-search"}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setResults([]);
                    }}
                    placeholder={`Search ${itemType}s…`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void runSearch();
                      }
                    }}
                  />
                  <Button
                    data-testid="search-btn"
                    onClick={runSearch}
                    disabled={searching}
                  >
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </Button>
                </div>
                <div className="max-h-[480px] space-y-2 overflow-y-auto pr-3">
                  {catalogueLoading && results.length === 0 && (
                    <p className="text-sm text-muted-foreground">Loading {itemType}s…</p>
                  )}
                  {!catalogueLoading && visibleResults.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No {itemType}s match. Press Search to look further.
                    </p>
                  )}
                  {visibleResults.map((r) => {
                    const already = curatedIds.has(r.id);
                    return (
                      <div
                        key={r.id}
                        data-testid="search-result"
                        data-product-id={r.id}
                        className="flex items-center gap-3 rounded-md border p-3"
                      >
                        <img
                          src={r.image || "/placeholder.svg"}
                          alt={r.label}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                          className={`h-12 w-12 shrink-0 bg-muted object-cover ${
                            itemType === "artisan" ? "rounded-full" : "rounded-md"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium" data-testid="curation-product-name">{r.label}</p>
                          {itemType === "product" && (
                            <p className="truncate text-xs text-muted-foreground" data-testid="curation-artisan-name">
                              {r.artisanName || "Artisan unavailable"}
                            </p>
                          )}
                          {r.sub && <p className="truncate text-xs text-muted-foreground">{r.sub}</p>}
                          {r.score != null && (
                            <p className="text-xs text-muted-foreground">
                              Composite score: {Math.round(r.score)}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          data-testid="add-to-section"
                          disabled={already}
                          aria-label={already ? `${r.label} already added` : `Add ${r.label}`}
                          onClick={() => addItem(r.id)}
                        >
                          {already ? "Added" : "Add"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default SectionDetail;
