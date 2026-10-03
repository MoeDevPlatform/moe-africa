import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminService, type AdminSection } from "@/lib/apiServices";
import { toast } from "sonner";
import { LayoutList } from "lucide-react";

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
          <p className="mt-1 text-muted-foreground">
            Curate Best Sellers, Featured Artisans, Editor&apos;s Recommendations, and Seasonal Picks
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full" />
              ))
            : sections.map((s) => (
                <Link key={s.sectionKey} to={`/admin/sections/${s.sectionKey}`}>
                  <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md h-full">
                    <CardHeader className="flex flex-row items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg font-display flex items-center gap-2">
                          <LayoutList className="h-4 w-4 text-muted-foreground" />
                          {s.label}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs mt-1">
                          {s.sectionKey}
                        </CardDescription>
                      </div>
                      <Badge variant={s.isActive ? "default" : "secondary"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {(s.items?.filter((i) => i.isActive).length ?? s.items?.length ?? 0)}{" "}
                        curated item(s)
                      </p>
                      {s.updatedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Updated {new Date(s.updatedAt).toLocaleString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Sections;
