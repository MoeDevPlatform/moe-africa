import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/marketplace/Navbar";
import Footer from "@/components/marketplace/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Paintbrush,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  ordersService,
  customOrderService,
  Order as ApiOrder,
  type CustomOrderRecord,
} from "@/lib/apiServices";

interface Order {
  id: string;
  productName: string;
  productImage: string;
  providerName: string;
  status:
    | "pending"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "awaiting_payment"
    | "custom";
  price: number;
  date: string;
  isCustomOrder: boolean;
}

const getStatusConfig = (status: Order["status"] | CustomOrderRecord["status"]) => {
  const configs: Record<
    string,
    { label: string; icon: typeof Clock; variant: "secondary" | "default" | "destructive" | "outline"; color: string }
  > = {
    in_review: {
      label: "Under review",
      icon: Clock,
      variant: "outline",
      color: "text-amber-600",
    },
    pending: {
      label: "With artisan",
      icon: Clock,
      variant: "secondary",
      color: "text-muted-foreground",
    },
    in_progress: {
      label: "In Progress",
      icon: Paintbrush,
      variant: "default",
      color: "text-primary",
    },
    completed: {
      label: "Completed",
      icon: CheckCircle,
      variant: "default",
      color: "text-green-600",
    },
    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      variant: "destructive",
      color: "text-destructive",
    },
    awaiting_payment: {
      label: "Awaiting Payment",
      icon: CreditCard,
      variant: "outline",
      color: "text-amber-600",
    },
    custom: {
      label: "Custom Order",
      icon: Paintbrush,
      variant: "secondary",
      color: "text-accent",
    },
    accepted: {
      label: "Accepted",
      icon: CheckCircle,
      variant: "default",
      color: "text-green-600",
    },
    declined: {
      label: "Declined",
      icon: XCircle,
      variant: "destructive",
      color: "text-destructive",
    },
  };
  return configs[status] ?? configs.pending;
};

const OrderCard = ({ order }: { order: Order }) => {
  const navigate = useNavigate();
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/marketplace/orders/${order.id}`)}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-32 h-32 sm:h-auto bg-muted flex-shrink-0">
            <img
              src={order.productImage}
              alt={order.productName}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>
          <div className="flex-1 p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{order.id}</p>
                <h3 className="font-semibold text-base">{order.productName}</h3>
                <p className="text-sm text-muted-foreground">{order.providerName}</p>
              </div>
              <Badge variant={statusConfig.variant} className="self-start gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.date).toLocaleDateString()}
                </p>
                <p className="font-bold text-primary">₦{order.price.toLocaleString()}</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                View Details
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CustomOrderCard = ({ order }: { order: CustomOrderRecord }) => {
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const budget =
    order.budgetMax ?? order.budget ?? order.budgetMin ?? null;

  return (
    <Card className="overflow-hidden" data-testid="custom-order-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Custom request · {order.id}</p>
            <h3 className="font-semibold text-base">
              {order.artisanName || `Artisan #${order.artisanId}`}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{order.description}</p>
          </div>
          <Badge variant={statusConfig.variant} className="self-start gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {order.createdAt ? (
            <p className="text-muted-foreground">
              Submitted {new Date(order.createdAt).toLocaleDateString()}
            </p>
          ) : null}
          {budget != null ? (
            <p className="font-medium text-primary">Budget ₦{Number(budget).toLocaleString()}</p>
          ) : null}
        </div>
        {order.artisanResponse ? (
          <div
            className="rounded-md border border-border bg-muted/40 p-3 text-sm"
            data-testid="custom-order-response"
          >
            <p className="font-medium text-foreground mb-1">Artisan response</p>
            <p className="text-muted-foreground whitespace-pre-wrap">{order.artisanResponse}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Payment links or quotes appear here only when the artisan includes them in their
              reply. No automatic checkout is created for custom requests.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {order.status === "in_review"
              ? "MOE is reviewing this request. The artisan will see it after we send it on."
              : "Waiting for the artisan to review your request. You’ll see their response here."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const Orders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "all";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      try {
        const [ordersRes, commissions] = await Promise.all([
          ordersService.list().catch(() => ({ data: [] as ApiOrder[] })),
          customOrderService.listMine().catch(() => [] as CustomOrderRecord[]),
        ]);
        setOrders(
          (ordersRes.data ?? []).map((o: ApiOrder) => ({
            id: o.id,
            productName: o.productName,
            productImage: o.productImage,
            providerName: o.providerName,
            status: (o.isCustomOrder ? "custom" : o.status) as Order["status"],
            price: o.price,
            date: o.createdAt,
            isCustomOrder: o.isCustomOrder,
          })),
        );
        setCustomOrders(commissions);
      } finally {
        setIsLoading(false);
      }
    };
    void loadOrders();
  }, []);

  const onTabChange = (tab: string) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    if (tab === "all") next.delete("tab");
    else next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  const filterOrders = (tab: string) => {
    switch (tab) {
      case "in_progress":
        return orders.filter((o) => o.status === "in_progress");
      case "completed":
        return orders.filter((o) => o.status === "completed");
      case "cancelled":
        return orders.filter((o) => o.status === "cancelled");
      case "awaiting_payment":
        return orders.filter((o) => o.status === "awaiting_payment");
      case "custom":
        return [];
      default:
        return orders;
    }
  };

  const filteredOrders = filterOrders(activeTab);
  const showCustom = activeTab === "custom" || activeTab === "all";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-display font-bold">My Orders</h1>
          </div>
          <p className="text-muted-foreground">Track and manage your orders and custom requests</p>
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 mb-6 bg-muted/50 p-1">
            <TabsTrigger value="all" className="flex-1 min-w-[100px]">
              All
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="flex-1 min-w-[100px]">
              In Progress
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 min-w-[100px]">
              Completed
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-1 min-w-[100px]">
              Cancelled
            </TabsTrigger>
            <TabsTrigger value="awaiting_payment" className="flex-1 min-w-[100px]">
              Awaiting Payment
            </TabsTrigger>
            <TabsTrigger
              value="custom"
              className="flex-1 min-w-[100px]"
              data-testid="orders-tab-custom"
            >
              Custom Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {showCustom && customOrders.length > 0 ? (
                  <div className="space-y-4" data-testid="custom-orders-list">
                    {activeTab === "all" ? (
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Custom requests
                      </h2>
                    ) : null}
                    {customOrders.map((co) => (
                      <CustomOrderCard key={co.id} order={co} />
                    ))}
                  </div>
                ) : null}

                {activeTab !== "custom" && filteredOrders.length > 0 ? (
                  <div className="space-y-4">
                    {activeTab === "all" && customOrders.length > 0 ? (
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pt-2">
                        Catalogue orders
                      </h2>
                    ) : null}
                    {filteredOrders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                ) : null}

                {!isLoading &&
                ((activeTab === "custom" && customOrders.length === 0) ||
                  (activeTab !== "custom" &&
                    filteredOrders.length === 0 &&
                    !(activeTab === "all" && customOrders.length > 0))) ? (
                  <div className="text-center py-16">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                    <p className="text-muted-foreground">
                      You don&apos;t have any orders in this category yet.
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Orders;
