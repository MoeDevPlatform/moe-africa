import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { customOrderService, type CustomOrderRecord } from "@/lib/apiServices";
import { toast } from "sonner";

const CustomOrdersAdminPage = () => {
  const [rows, setRows] = useState<CustomOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customOrderService
      .listAdmin()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e: Error) => toast.error(e.message || "Failed to load custom orders"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Custom Orders</h1>
          <p className="text-muted-foreground text-sm">
            Commission requests across eligible artisans (separate from product variations).
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custom orders yet.</p>
            ) : (
              <div className="space-y-3">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-start justify-between gap-3 border rounded-lg p-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium truncate">
                        {row.artisanName || `Artisan ${row.artisanId}`}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {row.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Customer: {row.customerName || row.customerId}
                        {row.budget != null ? ` · Budget ₦${row.budget.toLocaleString()}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {row.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CustomOrdersAdminPage;
