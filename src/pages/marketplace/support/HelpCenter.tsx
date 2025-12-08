import { Search, BookOpen, MessageSquare, Package, CreditCard, Truck, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";

const helpTopics = [
  {
    icon: Package,
    title: "Orders & Tracking",
    description: "Track your orders, view order history, and manage deliveries",
    link: "/marketplace/support/track-order",
  },
  {
    icon: CreditCard,
    title: "Payments & Billing",
    description: "Payment methods, refunds, and billing inquiries",
    link: "/marketplace/support/faqs",
  },
  {
    icon: Truck,
    title: "Shipping & Delivery",
    description: "Delivery times, shipping costs, and international orders",
    link: "/marketplace/support/faqs",
  },
  {
    icon: Shield,
    title: "Returns & Refunds",
    description: "Return policy, refund process, and exchanges",
    link: "/marketplace/support/return-policy",
  },
  {
    icon: MessageSquare,
    title: "Contact Artisans",
    description: "How to message artisans and custom order inquiries",
    link: "/marketplace/support/faqs",
  },
  {
    icon: BookOpen,
    title: "Getting Started",
    description: "New to MOE? Learn how to browse, order, and customize",
    link: "/marketplace/support/faqs",
  },
];

const HelpCenter = () => {
  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Help Center</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Find answers to your questions and get support for your MOE orders
          </p>
          
          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search for help articles..."
              className="pl-12 h-12 text-base"
            />
          </div>
        </div>

        {/* Help Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
          {helpTopics.map((topic) => {
            const Icon = topic.icon;
            return (
              <Link key={topic.title} to={topic.link}>
                <Card className="h-full hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{topic.title}</h3>
                        <p className="text-sm text-muted-foreground">{topic.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-muted/50 rounded-xl p-6 md:p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Still need help?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is here to assist you with any questions
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/marketplace/support/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Contact Support
            </Link>
            <Link 
              to="/marketplace/support/faqs"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              View FAQs
            </Link>
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default HelpCenter;
