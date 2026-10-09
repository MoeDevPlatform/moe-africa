import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/marketplace/Navbar";
import Footer from "@/components/marketplace/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Package,
  CheckCircle,
  Clock,
  Truck,
  Paintbrush,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  isActiveOrderStatus,
  ordersService,
  type Order,
  type OrderStatusHistoryEntry,
} from "@/lib/apiServices";

const STEPS = [
  { id: "pending", title: "Order received", icon: Package },
  { id: "awaiting_payment", title: "Awaiting payment", icon: Clock },
  { id: "in_progress", title: "In progress", icon: Paintbrush },
  { id: "completed", title: "Delivered", icon: CheckCircle },
];

const statusIndex = (s: string) => {
  const idx = STEPS.findIndex((step) => step.id === s);
  return idx >= 0 ? idx : 0;
};

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderStatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!orderId) return;
    try {
      const [o, track] = await Promise.all([
        ordersService.getById(orderId),
        ordersService.getTracking(orderId),
      ]);
      setOrder(o);
      setHistory(track.history ?? o.statusHistory ?? []);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !order || !isActiveOrderStatus(order.status)) return;
    const timer = window.setInterval(() => {
      ordersService.getTracking(orderId).then((t) => {
        setHistory(t.history ?? []);
        if (t.status && t.status !== order.status) {
          setOrder((prev) => (prev ? { ...prev, status: t.status as Order["status"] } : prev));
        }
      }).catch(() => {});
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [orderId, order?.status, order]);

  const currentStep = useMemo(
    () => (order ? statusIndex(order.status) : 0),
    [order],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Order not found.</p>
          <Button className="mt-4" onClick={() => navigate("/marketplace/orders")}>
            Back to orders
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">Order #{order.orderNumber ?? order.id}</h1>
            <p className="text-sm text-muted-foreground">{order.productName}</p>
          </div>
          <Badge className="ml-auto capitalize">{order.status.replace(/_/g, " ")}</Badge>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between gap-2">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const done = i <= currentStep;
                const active = i === currentStep;
                return (
                  <div key={step.id} className="flex-1 text-center">
                    <div
                      className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        done ? "border-primary bg-primary/10 text-primary" : "border-muted text-muted-foreground"
                      } ${active ? "ring-2 ring-primary/30" : ""}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] sm:text-xs mt-2 leading-tight">{step.title}</p>
                  </div>
                );
              })}
            </div>
            {order.estimatedDelivery && (
              <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Estimated delivery: {order.estimatedDelivery}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Artisan</span>
              <span className="font-medium">{order.providerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-primary">₦{order.price.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="text-sm">
              <p className="font-medium mb-1">Ship to</p>
              <p className="text-muted-foreground">
                {addr.firstName} {addr.lastName}<br />
                {addr.addressLine1}<br />
                {addr.city}, {addr.state}, {addr.country}
              </p>
            </div>
          </CardContent>
        </Card>

        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="gap-2 px-0">
              <ChevronDown className="h-4 w-4" />
              Order history
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 border-l-2 border-muted pl-4 mt-2">
            {history.map((h, i) => (
              <div key={`${h.createdAt}-${i}`}>
                <p className="font-medium capitalize text-sm">{h.status.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(h.createdAt).toLocaleString()}
                  {h.note ? ` — ${h.note}` : ""}
                </p>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </main>

      <Footer />
    </div>
  );
};

export default OrderDetail;
