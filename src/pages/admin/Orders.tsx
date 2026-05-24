import { useEffect, useState, useCallback } from "react";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  adminOrdersService,
  AdminOrderRow,
  AdminOrderStatus,
  AdminPaymentStatus,
} from "@/lib/apiServices";
import { MoeApiError } from "@/lib/moeApi";

const ORDER_STATUSES: AdminOrderStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
  "approved",
  "shipped",
  "delivered",
  "cancelled",
  "rejected",
];

const PAYMENT_STATUSES: AdminPaymentStatus[] = ["unpaid", "paid", "refunded", "failed"];

const statusBadgeClass = (status: AdminOrderStatus) => {
  switch (status) {
    case "pending":
    case "confirmed":
      return "bg-accent text-accent-foreground";
    case "in_progress":
    case "approved":
    case "shipped":
      return "bg-primary text-primary-foreground";
    case "delivered":
      return "bg-primary-light text-primary-foreground";
    case "cancelled":
    case "rejected":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const paymentBadgeClass = (status: AdminPaymentStatus) => {
  switch (status) {
    case "paid":
      return "bg-primary text-primary-foreground";
    case "unpaid":
      return "bg-accent text-accent-foreground";
    case "refunded":
      return "bg-muted text-muted-foreground";
    case "failed":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const formatPrice = (price: number, currency: string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 0,
  }).format(price);

const Orders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminOrdersService.list({
        page,
        pageSize,
        q: debouncedQ || undefined,
      });
      setOrders(res.data ?? []);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch (err) {
      const msg =
        err instanceof MoeApiError ? err.message : "Failed to load orders";
      setError(msg);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = async (
    id: number,
    body: { status?: AdminOrderStatus; paymentStatus?: AdminPaymentStatus },
  ) => {
    setUpdatingId(id);
    try {
      const updated = await adminOrdersService.update(id, body);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                status: (updated.status as AdminOrderStatus) ?? o.status,
                paymentStatus:
                  (updated.paymentStatus as AdminPaymentStatus) ?? o.paymentStatus,
              }
            : o,
        ),
      );
      toast.success("Order updated");
    } catch (err) {
      const msg =
        err instanceof MoeApiError ? err.message : "Failed to update order";
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Orders
            </h1>
            <p className="mt-1 text-muted-foreground">
              Review and manage customer orders
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order #, product, provider, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-input bg-card"
            aria-label="Search orders"
          />
        </div>

        {/* States */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading orders...
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" className="mt-4" onClick={load}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              No orders found.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="overflow-hidden border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Order Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {order.orderNumber}
                            </h3>
                            <Badge className={statusBadgeClass(order.status)}>
                              {order.status.replace("_", " ")}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={paymentBadgeClass(order.paymentStatus)}
                            >
                              {order.paymentStatus}
                            </Badge>
                          </div>
                          <p className="mt-1 text-base font-medium text-foreground">
                            {order.productName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            by {order.providerName}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            {order.customerName}{" "}
                            <span className="text-xs">({order.customerEmail})</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-display font-bold text-foreground">
                          {formatPrice(order.price, order.currency)}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Order actions"
                            disabled={updatingId === order.id}
                          >
                            {updatingId === order.id ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <MoreVertical className="h-5 w-5" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Set status</DropdownMenuLabel>
                          {ORDER_STATUSES.map((s) => (
                            <DropdownMenuItem
                              key={s}
                              disabled={s === order.status}
                              onClick={() => handleUpdate(order.id, { status: s })}
                              className="capitalize"
                            >
                              {s.replace("_", " ")}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Payment status</DropdownMenuLabel>
                          {PAYMENT_STATUSES.map((p) => (
                            <DropdownMenuItem
                              key={p}
                              disabled={p === order.paymentStatus}
                              onClick={() =>
                                handleUpdate(order.id, { paymentStatus: p })
                              }
                              className="capitalize"
                            >
                              {p}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  {page} / {totalPages}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </AdminLayout>
  );
};

export default Orders;