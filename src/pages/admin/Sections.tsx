import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminService, type AdminSection } from "@/lib/apiServices";
import { toast } from "sonner";
import { ChevronRight, LayoutList } from "lucide-react";

/** Keys must match BE `SECTION_KEYS` in sections.constants.ts */
const SECTION_GUIDE: Record<
  string,
  { purpose: string; manages: string; marketplace: string }
> = {
  featured_picks: {
    purpose: "Hand-picked products for Featured Picks only. Best Sellers is a different shelf.",
    manages: "Products (order = display order). Newest products fill only this shelf when fewer than four are curated.",
    marketplace: "Homepage → Featured Picks",
  },
  best_sellers: {
    purpose: "The Best Sellers shelf. Optional pins stay here. The system ranking is real orders, not the Featured Picks list.",
    manages: "Products. Order count, then name. Nothing is copied from Featured Picks.",
    marketplace: "Homepage → Best Sellers",
  },
  featured_artisans: {
    purpose: "Pin specific artisans to the Featured Artisans homepage block.",
    manages: "Artisan profiles (order = display order)",
    marketplace: "Homepage → Featured Artisans",
  },
  featured_styles: {
    purpose: "Editor’s Recommendations — hand-picked style / product shelf.",
    manages: "Products (order = display order)",
    marketplace: "Homepage → Editor’s Recommendations",
  },
  seasonal_picks: {
    purpose: "Seasonal or campaign collections (keywords help discovery).",
    manages: "Products + seasonal keywords",
    marketplace: "Homepage seasonal sections",
  },
};

function guideFor(sectionKey: string) {
  return (
    SECTION_GUIDE[sectionKey] ?? {
      purpose: "Curate which items appear in this homepage section and in what order.",
      manages: "Artisans or products depending on the section",
      marketplace: "Matching marketplace homepage block",
    }
  );
}

const Sections = () => {
  const [sections, setSections] = useState<AdminSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .listSections()
      .then((data) => setSections(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(err?.message || "Failed to load sections"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Homepage Sections</h1>
          <p className="mt-1 text-muted-foreground max-w-2xl">
            Each card is a homepage shelf. Open a section to add or reorder curated artisans or
            products, set keywords, and toggle active items. Changes save to the database and appear
            on the live marketplace homepage.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Artisan ranking scores (separate from curation) live under{" "}
            <Link to="/admin/artisans/scores" className="text-primary underline underline-offset-2">
              Artisan Scores
            </Link>
            .
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full" />
              ))
            : sections.map((s) => {
                const guide = guideFor(s.sectionKey);
                const activeCount =
                  s.items?.filter((i) => i.isActive).length ?? s.items?.length ?? 0;
                return (
                  <Link
                    key={s.sectionKey}
                    to={`/admin/sections/${s.sectionKey}`}
                    className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                  >
                    <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md h-full">
                      <CardHeader className="flex flex-row items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-lg font-display flex items-center gap-2">
                            <LayoutList className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="truncate">{s.label}</span>
                          </CardTitle>
                          <CardDescription className="mt-2 text-sm text-foreground/80">
                            {guide.purpose}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Badge variant={s.isActive ? "default" : "secondary"}>
                            {s.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground">{activeCount}</span> curated
                          item{activeCount === 1 ? "" : "s"}
                        </p>
                        <p>
                          <span className="text-foreground/70">Manages:</span> {guide.manages}
                        </p>
                        <p>
                          <span className="text-foreground/70">Shows on:</span> {guide.marketplace}
                        </p>
                        {s.updatedAt && (
                          <p className="text-xs">
                            Updated {new Date(s.updatedAt).toLocaleString()}
                          </p>
                        )}
                        <p className="text-xs font-mono text-muted-foreground/70">{s.sectionKey}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Sections;
