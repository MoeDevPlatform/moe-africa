import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminService, type ArtisanScoreRow } from "@/lib/apiServices";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";

const ArtisanScores = () => {
  const [rows, setRows] = useState<ArtisanScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const load = () => {
    setLoading(true);
    adminService
      .listArtisanScores({ page: 1, pageSize: 50 })
      .then((res) => setRows(res.items ?? []))
      .catch((err) => toast.error(err?.message || "Failed to load scores"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const recalculate = async () => {
    setRecalculating(true);
    try {
      const res = await adminService.recalculateArtisanScores();
      toast.success(
        res.status === "already_running"
          ? "Recalculation already running"
          : `Recalculated ${res.processed ?? 0} artisans`,
      );
      load();
    } catch (err: any) {
      toast.error(err?.message || "Recalculation failed");
    } finally {
      setRecalculating(false);
    }
  };

  const fmt = (n: number | null | undefined) =>
    n == null ? "—" : Number(n).toFixed(1);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Artisan Scores</h1>
            <p className="mt-1 text-muted-foreground">
              Internal composite ranking (admin only)
            </p>
          </div>
          <Button onClick={recalculate} disabled={recalculating}>
            {recalculating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Recalculate
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scores by composite rank</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artisan</TableHead>
                    <TableHead>Composite</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Reviews</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Avg response (hrs)</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No scores yet. Run recalculate to generate them.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.artisanId}>
                        <TableCell>
                          <div className="font-medium">{r.name || `#${r.artisanId}`}</div>
                          <div className="text-xs text-muted-foreground">{r.email}</div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {fmt(r.compositeScore)}
                        </TableCell>
                        <TableCell>{fmt(r.orderCompletionRate)}</TableCell>
                        <TableCell>{fmt(r.reviewQualityScore)}</TableCell>
                        <TableCell>{fmt(r.activityScore)}</TableCell>
                        <TableCell>
                          {r.avgResponseTimeHrs == null
                            ? "—"
                            : fmt(r.avgResponseTimeHrs)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.lastCalculatedAt
                            ? new Date(r.lastCalculatedAt).toLocaleString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ArtisanScores;
