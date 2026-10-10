import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { customOrderService, type CustomOrderRecord } from "@/lib/apiServices";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ArtisanCustomOrdersPanel = () => {
  const [rows, setRows] = useState<CustomOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    customOrderService
      .listForArtisan()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e: Error) => toast.error(e.message || "Failed to load custom orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const respond = async (id: string, status: "accepted" | "declined") => {
    setBusyId(id);
    try {
      await customOrderService.respond(id, {
        status,
        artisanResponse: responses[id]?.trim() || undefined,
      });
      toast.success(status === "accepted" ? "Request accepted" : "Request declined");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Could not update request");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No custom order requests yet.
      </p>
    );
  }

  return (
    <div className="space-y-4" data-testid="artisan-custom-orders">
      {rows.map((row) => (
        <div key={row.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium line-clamp-3">{row.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {row.budget != null ? `Budget ₦${row.budget.toLocaleString()}` : "No budget"}
                {row.deadline ? ` · Due ${row.deadline}` : ""}
              </p>
            </div>
            <Badge variant="outline" className="capitalize shrink-0">
              {row.status}
            </Badge>
          </div>
          {row.status === "pending" && (
            <>
              <Textarea
                placeholder="Optional response to the customer"
                value={responses[row.id] ?? ""}
                onChange={(e) =>
                  setResponses((p) => ({ ...p, [row.id]: e.target.value }))
                }
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={busyId === row.id}
                  onClick={() => respond(row.id, "accepted")}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === row.id}
                  onClick={() => respond(row.id, "declined")}
                >
                  Decline
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default ArtisanCustomOrdersPanel;
