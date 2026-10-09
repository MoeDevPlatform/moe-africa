import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Loader2, Package } from "lucide-react";
import { ordersService, type Order } from "@/lib/apiServices";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    ordersService
      .getById(orderId)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  const ref = order?.orderNumber ?? order?.id ?? orderId ?? "—";
  const estimated =
    order?.estimatedDelivery ??
    (order?.createdAt
      ? `By ${new Date(new Date(order.createdAt).getTime() + 14 * 86400000).toLocaleDateString()}`
      : "7–14 business days");

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-display">
                Order Placed Successfully
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Thank you! We&apos;ve received your order and notified the artisan.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">Order reference</p>
                <p className="text-xl font-mono font-semibold">{ref}</p>
              </div>

              {order ? (
                <div className="space-y-3">
                  <div className="flex gap-3 items-center">
                    <Package className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium">{order.productName}</p>
                      <p className="text-sm text-muted-foreground">{order.providerName}</p>
                    </div>
                    <p className="ml-auto font-semibold text-primary">
                      ₦{order.price.toLocaleString()}
                    </p>
                  </div>
                  <Separator />
                  <p className="text-sm">
                    <span className="text-muted-foreground">Estimated delivery: </span>
                    {estimated}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Estimated delivery: {estimated}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button asChild className="flex-1">
                  <Link to="/marketplace">Continue Shopping</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/marketplace/orders">View My Orders</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <MarketplaceFooter />
    </div>
  );
};

export default OrderConfirmation;
