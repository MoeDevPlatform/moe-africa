import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/marketplace/Navbar";
import Footer from "@/components/marketplace/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Package, 
  CheckCircle, 
  Clock, 
  Truck, 
  MapPin,
  MessageSquare,
  FileText,
  Bell,
  Paintbrush,
  Search,
  Box
} from "lucide-react";

interface TrackingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  current: boolean;
  date?: string;
}

const trackingSteps: TrackingStep[] = [
  {
    id: "received",
    title: "Order Received",
    description: "Your order has been confirmed",
    icon: Package,
    completed: true,
    current: false,
    date: "Jan 15, 2024 - 10:30 AM",
  },
  {
    id: "crafting",
    title: "Being Crafted",
    description: "Artisan is working on your order",
    icon: Paintbrush,
    completed: true,
    current: false,
    date: "Jan 16, 2024 - 2:00 PM",
  },
  {
    id: "quality",
    title: "Quality Check",
    description: "Product undergoing quality inspection",
    icon: Search,
    completed: false,
    current: true,
    date: "Expected: Jan 18, 2024",
  },
  {
    id: "dispatch",
    title: "Ready for Dispatch",
    description: "Package ready for shipping",
    icon: Box,
    completed: false,
    current: false,
  },
  {
    id: "delivery",
    title: "Out for Delivery",
    description: "On the way to your location",
    icon: Truck,
    completed: false,
    current: false,
  },
  {
    id: "delivered",
    title: "Delivered",
    description: "Order successfully delivered",
    icon: CheckCircle,
    completed: false,
    current: false,
  },
];

const mockOrderDetail = {
  id: "ORD-001",
  productName: "Royal Blue Agbada Set",
  productImage: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
  providerName: "Ade's Tailoring",
  providerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
  status: "in_progress",
  price: 85000,
  date: "2024-01-15",
  estimatedDelivery: "Jan 22 - Jan 25, 2024",
  deliveryAddress: "15 Marina Road, Victoria Island, Lagos, Nigeria",
  customizations: {
    size: "L",
    color: "Royal Blue with Gold Embroidery",
    material: "Premium Cotton",
    style: "Traditional Cut",
  },
  courier: {
    name: "GIG Logistics",
    trackingNumber: "GIG-2024-78543",
  },
};

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Order Details</h1>
            <p className="text-muted-foreground">{mockOrderDetail.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Info */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-32 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={mockOrderDetail.productImage}
                      alt={mockOrderDetail.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg mb-1">{mockOrderDetail.productName}</h2>
                    <p className="text-muted-foreground text-sm mb-2">by {mockOrderDetail.providerName}</p>
                    <Badge variant="secondary" className="mb-3">
                      <Clock className="h-3 w-3 mr-1" />
                      In Progress
                    </Badge>
                    <p className="font-bold text-xl text-primary">₦{mockOrderDetail.price.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Production & Delivery Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Production & Delivery Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Desktop Horizontal Stepper */}
                <div className="hidden md:block">
                  <div className="relative">
                    <div className="flex justify-between">
                      {trackingSteps.map((step, index) => {
                        const StepIcon = step.icon;
                        return (
                          <div key={step.id} className="flex flex-col items-center relative z-10" style={{ width: `${100 / trackingSteps.length}%` }}>
                            <div 
                              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                                step.completed 
                                  ? "bg-primary text-primary-foreground" 
                                  : step.current 
                                    ? "bg-accent text-accent-foreground ring-2 ring-accent ring-offset-2"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <StepIcon className="h-5 w-5" />
                            </div>
                            <p className={`text-xs text-center font-medium ${step.current ? "text-accent" : step.completed ? "text-foreground" : "text-muted-foreground"}`}>
                              {step.title}
                            </p>
                            {step.date && (
                              <p className="text-[10px] text-muted-foreground text-center mt-1">{step.date}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Progress Line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-0">
                      <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${(trackingSteps.filter(s => s.completed).length / (trackingSteps.length - 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Vertical Stepper */}
                <div className="md:hidden space-y-4">
                  {trackingSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    return (
                      <div key={step.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              step.completed 
                                ? "bg-primary text-primary-foreground" 
                                : step.current 
                                  ? "bg-accent text-accent-foreground ring-2 ring-accent ring-offset-2"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <StepIcon className="h-5 w-5" />
                          </div>
                          {index < trackingSteps.length - 1 && (
                            <div className={`w-0.5 h-12 ${step.completed ? "bg-primary" : "bg-muted"}`} />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className={`font-medium ${step.current ? "text-accent" : step.completed ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.title}
                          </p>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          {step.date && (
                            <p className="text-xs text-muted-foreground mt-1">{step.date}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Live Delivery Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Live Delivery Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative bg-muted rounded-lg h-64 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                  <div className="text-center z-10">
                    <MapPin className="h-12 w-12 text-primary mx-auto mb-3 animate-bounce" />
                    <p className="text-muted-foreground text-sm">Map tracking will be available</p>
                    <p className="text-muted-foreground text-sm">once your order is dispatched</p>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-4 left-4 w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <div className="absolute bottom-8 right-8 w-3 h-3 bg-accent rounded-full animate-pulse" />
                  <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-secondary rounded-full animate-pulse" />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Courier</p>
                    <p className="font-medium">{mockOrderDetail.courier.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Tracking #</p>
                    <p className="font-medium">{mockOrderDetail.courier.trackingNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customization Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Customization Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(mockOrderDetail.customizations).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-muted-foreground capitalize">{key}</p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Delivery Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estimated Delivery</p>
                  <p className="font-medium text-primary">{mockOrderDetail.estimatedDelivery}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
                  <p className="font-medium text-sm">{mockOrderDetail.deliveryAddress}</p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Button className="w-full gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Message Artisan
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Bell className="h-4 w-4" />
                  Notification Preferences
                </Button>
                <Button variant="ghost" className="w-full gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Download Invoice
                </Button>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>In-app notifications</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>SMS alerts</span>
                  <Badge variant="outline">Set up</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Email confirmations</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderDetail;
