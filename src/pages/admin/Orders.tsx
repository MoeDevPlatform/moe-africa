import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MoreVertical, Calendar, User, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { toast } from "sonner";

const Orders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: orders = [], isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();

  const filtered = orders.filter((o) =>
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.products as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Order status updated to ${status}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-accent text-accent-foreground";
      case "approved": return "bg-primary text-primary-foreground";
      case "in-progress": return "bg-secondary text-secondary-foreground";
      case "completed": return "bg-primary/80 text-primary-foreground";
      case "cancelled": return "bg-destructive/20 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Orders</h1>
            <p className="mt-1 text-muted-foreground">Review and manage customer orders</p>
            <p className="text-xs text-muted-foreground/60 mt-1 font-mono">GET /orders</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders by ID, customer, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-input bg-card"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No orders found.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <Card key={order.id} className="overflow-hidden border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-foreground font-mono">
                              {order.id.slice(0, 8).toUpperCase()}
                            </h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.replace("-", " ")}
                            </Badge>
                          </div>
                          <p className="mt-1 text-base font-medium text-foreground">
                            {(order.products as any)?.name || "Unknown Product"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            by {(order.products as any)?.service_providers?.name || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{order.customer_name || order.customer_id?.slice(0, 8) || "Guest"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        {order.payment_reference && (
                          <div className="text-xs font-mono text-muted-foreground">
                            Ref: {order.payment_reference}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-display font-bold text-foreground">
                          {order.price_final ? `₦${order.price_final.toLocaleString()}` : "—"}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {order.status === "pending" && (
                            <>
                              <DropdownMenuItem className="text-primary" onClick={() => handleStatusChange(order.id, "approved")}>
                                Approve Order
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(order.id, "cancelled")}>
                                Reject Order
                              </DropdownMenuItem>
                            </>
                          )}
                          {order.status === "approved" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "in-progress")}>
                              Mark In Progress
                            </DropdownMenuItem>
                          )}
                          {order.status === "in-progress" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "completed")}>
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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

export default Orders;
