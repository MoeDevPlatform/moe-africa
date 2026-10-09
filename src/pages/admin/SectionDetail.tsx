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
  type AdminSection,
  type AdminSectionItem,
} from "@/lib/apiServices";
import { toast } from "sonner";
import { ArrowLeft, GripVertical, Loader2, Trash2 } from "lucide-react";

const SectionDetail = () => {
  const { sectionKey = "" } = useParams();
  const [section, setSection] = useState<AdminSection | null>(null);
  const [items, setItems] = useState<AdminSectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: number; label: string; score?: number }>>([]);
  const [searching, setSearching] = useState(false);
  const [keywordsText, setKeywordsText] = useState("");
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
        setKeywordsText((s.keywords ?? []).join(", "));
      })
      .catch((err) => toast.error(err?.message || "Failed to load section"))
      .finally(() => setLoading(false));
  }, [sectionKey]);

  useEffect(() => {
    load();
  }, [load]);

  const itemType =
    sectionKey === "featured_artisans" ? "artisan" : "product";

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
              .map((p) => ({ id: p.id, name: p.name })) as typeof products;
          } catch {
            /* ignore */
          }
        }
        setResults(
          products.map((p) => ({
            id: p.id,
            label: p.name || `Product #${p.id}`,
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

  const saveKeywords = async () => {
    const keywords = keywordsText
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    try {
      await adminService.setSeasonalKeywords(keywords);
      toast.success("Seasonal keywords updated");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update keywords");
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
                  <CardTitle className="text-lg">Seasonal keywords</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-3">
                  <Input
                    value={keywordsText}
                    onChange={(e) => setKeywordsText(e.target.value)}
                    placeholder="eid, graduation, harmattan"
                  />
                  <Button onClick={saveKeywords}>Save keywords</Button>
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
                    onChange={(e) => setQuery(e.target.value)}
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
                <div className="space-y-2">
                  {results.map((r) => (
                    <div
                      key={r.id}
                      data-testid="search-result"
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{r.label}</p>
                        {r.score != null && (
                          <p className="text-xs text-muted-foreground">
                            Composite score: {Math.round(r.score)}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        data-testid="add-to-section"
                        onClick={() => addItem(r.id)}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
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
