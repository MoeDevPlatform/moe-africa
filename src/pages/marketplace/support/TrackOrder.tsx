import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Search, Package, CheckCircle, Truck, MapPin, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import { apiGet } from "@/lib/moeApi";

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowResults(false);

    const trimmed = orderNumber.trim();
    if (!trimmed) {
      setError("Please enter an order reference.");
      return;
    }

    setIsLoading(true);
    try {
      const json = await apiGet<any>(`/orders/${encodeURIComponent(trimmed)}`);
      setOrder(json?.data ?? json);
      setShowResults(true);
    } catch (e: any) {
      setOrder(null);
      setError(e?.message || "Failed to fetch order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Back Link */}
        <Link 
          to="/marketplace/support/help"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Help Center
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Track Your Order</h1>
          <p className="text-muted-foreground max-w-2xl">
            Enter your order number to see real-time tracking information
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8 max-w-2xl">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Enter order number (e.g., MOE-123456)"
                  className="pl-10"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
              </div>
              <Button type="submit">
                Track Order
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {showResults && (
          <div className="max-w-2xl space-y-6">
            {/* Order Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-semibold text-lg">{order?.id ?? order?.orderId ?? orderNumber}</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">{order?.status ?? "In Transit"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Product</p>
                    <p className="font-medium">{order?.productName ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Artisan</p>
                    <p className="font-medium">{order?.providerName ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-medium">
                      ₦{typeof order?.price === "number" ? order.price.toLocaleString() : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline (simplified) */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-2">Order Timeline</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Real-time steps are backend-driven. For now, we display the latest status.
                </p>

                <div className="flex items-center gap-3 px-4 py-3 bg-muted rounded-lg">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">{order?.status ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated: {order?.updatedAt ? new Date(order.updatedAt).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Location */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">Delivery Address</h3>
                    <p className="text-sm text-muted-foreground">
                      {order?.shippingAddress?.addressLine1 ?? "—"}
                      {order?.shippingAddress?.addressLine2 ? <><br />{order.shippingAddress.addressLine2}</> : null}
                      {order?.shippingAddress?.city ? <><br />{order.shippingAddress.city}</> : null}
                      {order?.shippingAddress?.state ? <>, {order.shippingAddress.state}</> : null}
                      {order?.shippingAddress?.country ? <><br />{order.shippingAddress.country}</> : null}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Need Help */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/marketplace/support/report">
                <Button variant="outline">Report a Problem</Button>
              </Link>
              <Link to="/marketplace/support/contact">
                <Button variant="outline">Contact Support</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto">
            <p className="text-destructive text-sm mt-4">{error}</p>
          </div>
        )}

        {/* Not Found State */}
        {!showResults && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter your order number above to track your order</p>
            <p className="text-sm mt-2">
              You can also view all your orders in{" "}
              <Link to="/marketplace/orders" className="text-primary hover:underline">
                My Orders
              </Link>
            </p>
          </div>
        )}
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default TrackOrder;
