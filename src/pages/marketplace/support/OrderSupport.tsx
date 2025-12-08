import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Search, Package, AlertCircle, MessageSquare, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";

const supportActions = [
  {
    icon: Package,
    title: "Track My Order",
    description: "Check the current status and location of your order",
    link: "/marketplace/support/track-order",
  },
  {
    icon: RefreshCw,
    title: "Request Return/Refund",
    description: "Initiate a return or request a refund for your order",
    link: "/marketplace/support/return-policy",
  },
  {
    icon: AlertCircle,
    title: "Report a Problem",
    description: "Report issues with your order or delivery",
    link: "/marketplace/support/report",
  },
  {
    icon: MessageSquare,
    title: "Contact Artisan",
    description: "Send a message directly to the artisan",
    link: "/marketplace/messages",
  },
];

const OrderSupport = () => {
  const [orderNumber, setOrderNumber] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would search for the order
    console.log("Searching for order:", orderNumber);
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
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Order Support</h1>
          <p className="text-muted-foreground max-w-2xl">
            Get help with your orders, track deliveries, and resolve issues
          </p>
        </div>

        {/* Order Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Find Your Order</h2>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Enter your order number (e.g., MOE-123456)"
                  className="pl-10"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
              </div>
              <Button type="submit">
                Search Order
              </Button>
            </form>
            <p className="text-sm text-muted-foreground mt-3">
              You can find your order number in your confirmation email or in{" "}
              <Link to="/marketplace/orders" className="text-primary hover:underline">
                My Orders
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Support Actions */}
        <h2 className="text-xl font-semibold mb-4">What do you need help with?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {supportActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.link}>
                <Card className="h-full hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Recent Orders Quick Access */}
        <div className="bg-muted/50 rounded-xl p-6 text-center">
          <h3 className="font-semibold mb-2">View All Your Orders</h3>
          <p className="text-muted-foreground mb-4">
            Access your complete order history and manage your orders
          </p>
          <Link to="/marketplace/orders">
            <Button>Go to My Orders</Button>
          </Link>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default OrderSupport;
