import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminDisputesService, type Dispute } from "@/lib/apiServices";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Disputes = () => {
  const [rows, setRows] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolutionDraft, setResolutionDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminDisputesService
      .list({ pageSize: 50 })
      .then((res) => setRows(Array.isArray(res) ? res : res.data ?? []))
      .catch((e: Error) => toast.error(e.message || "Failed to load disputes"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (id: string, status: string) => {
    setSavingId(id);
    try {
      await adminDisputesService.update(id, {
        status,
        resolution: resolutionDraft[id],
      });
      toast.success("Dispute updated");
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Disputes</h1>
          <p className="text-muted-foreground mt-1">
            Customer order problem reports
          </p>
        </div>

        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No disputes yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rows.map((d) => (
              <Card key={d.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">
                      Order #{d.orderId} · {d.issueType}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(d.createdAt).toLocaleString()} · customer {d.customerId}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {d.status.replace(/_/g, " ")}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{d.description}</p>
                  <Textarea
                    placeholder="Resolution note"
                    value={resolutionDraft[d.id] ?? d.resolution ?? ""}
                    onChange={(e) =>
                      setResolutionDraft((prev) => ({ ...prev, [d.id]: e.target.value }))
                    }
                  />
                  <div className="flex flex-wrap gap-2 items-center">
                    <Select
                      defaultValue={d.status}
                      onValueChange={(v) => update(d.id, v)}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="under_review">Under review</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={savingId === d.id}
                      onClick={() => update(d.id, d.status)}
                    >
                      {savingId === d.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save note"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Disputes;
