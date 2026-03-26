import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/marketplace/Navbar";
import Footer from "@/components/marketplace/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Clock, CheckCircle, XCircle, CreditCard, Paintbrush, ChevronRight } from "lucide-react";
import { ordersService } from "@/lib/apiServices";

interface Order {
  id: string;
  productName: string;
  productImage: string;
  providerName: string;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "awaiting_payment" | "custom";
  price: number;
  date: string;
  isCustomOrder: boolean;
}

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    productName: "Royal Blue Agbada Set",
    productImage: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
    providerName: "Ade's Tailoring",
    status: "in_progress",
    price: 85000,
    date: "2024-01-15",
    isCustomOrder: false,
  },
  {
    id: "ORD-002",
    productName: "Custom Leather Sandals",
    productImage: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400",
    providerName: "Musa's Leatherworks",
    status: "completed",
    price: 35000,
    date: "2024-01-10",
    isCustomOrder: true,
  },
  {
    id: "ORD-003",
    productName: "Traditional Senator Outfit",
    productImage: "https://images.unsplash.com/photo-1558769132-cb1aea3c8501?w=400",
    providerName: "Ade's Tailoring",
    status: "awaiting_payment",
    price: 65000,
    date: "2024-01-18",
    isCustomOrder: false,
  },
  {
    id: "ORD-004",
    productName: "Bespoke Ankara Dress",
    productImage: "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400",
    providerName: "Funke's Fashion House",
    status: "pending",
    price: 45000,
    date: "2024-01-20",
    isCustomOrder: false,
  },
  {
    id: "ORD-005",
    productName: "Custom Wedding Gele",
    productImage: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400",
    providerName: "Bisi Accessories",
    status: "custom",
    price: 28000,
    date: "2024-01-12",
    isCustomOrder: true,
  },
  {
    id: "ORD-006",
    productName: "Casual Kaftan",
    productImage: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
    providerName: "Ade's Tailoring",
    status: "cancelled",
    price: 25000,
    date: "2024-01-05",
    isCustomOrder: false,
  },
];

const getStatusConfig = (status: Order["status"]) => {
  const configs = {
    pending: { label: "Pending", icon: Clock, variant: "secondary" as const, color: "text-muted-foreground" },
    in_progress: { label: "In Progress", icon: Paintbrush, variant: "default" as const, color: "text-primary" },
    completed: { label: "Completed", icon: CheckCircle, variant: "default" as const, color: "text-green-600" },
    cancelled: { label: "Cancelled", icon: XCircle, variant: "destructive" as const, color: "text-destructive" },
    awaiting_payment: { label: "Awaiting Payment", icon: CreditCard, variant: "outline" as const, color: "text-amber-600" },
    custom: { label: "Custom Order", icon: Paintbrush, variant: "secondary" as const, color: "text-accent" },
  };
  return configs[status];
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
                <p className="text-xs text-muted-foreground">{new Date(order.date).toLocaleDateString()}</p>
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

const Orders = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await ordersService.list();
        if (res.data.length > 0) {
          setOrders(
            res.data.map((o) => ({
              id: o.id,
              productName: o.productName,
              productImage: o.productImage,
              providerName: o.providerName,
              status: o.status === "custom" ? "custom" : o.status,
              price: o.price,
              date: o.createdAt,
              isCustomOrder: o.isCustomOrder,
            })) as Order[]
          );
        }
      } catch {
        // Keep mock data
      }
    };
    loadOrders();
  }, []);

  const filterOrders = (tab: string) => {
    switch (tab) {
      case "in_progress":
        return orders.filter(o => o.status === "in_progress");
      case "completed":
        return orders.filter(o => o.status === "completed");
      case "cancelled":
        return orders.filter(o => o.status === "cancelled");
      case "awaiting_payment":
        return orders.filter(o => o.status === "awaiting_payment");
      case "custom":
        return orders.filter(o => o.isCustomOrder);
      default:
        return orders;
    }
  };

  const filteredOrders = filterOrders(activeTab);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-display font-bold">My Orders</h1>
          </div>
          <p className="text-muted-foreground">Track and manage your orders</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 mb-6 bg-muted/50 p-1">
            <TabsTrigger value="all" className="flex-1 min-w-[100px]">All</TabsTrigger>
            <TabsTrigger value="in_progress" className="flex-1 min-w-[100px]">In Progress</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 min-w-[100px]">Completed</TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-1 min-w-[100px]">Cancelled</TabsTrigger>
            <TabsTrigger value="awaiting_payment" className="flex-1 min-w-[100px]">Awaiting Payment</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1 min-w-[100px]">Custom Orders</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground">You don't have any orders in this category yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Orders;
