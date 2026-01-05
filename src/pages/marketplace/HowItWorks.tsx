import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Palette, Package, Star } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      title: "Discover Artisans",
      description: "Browse our curated collection of verified African artisans. Filter by category, location, style, and ratings to find the perfect match for your needs.",
    },
    {
      icon: Palette,
      title: "Customize Your Order",
      description: "Work directly with artisans to customize your order. Choose materials, colors, sizes, and add personal touches to create something truly unique.",
    },
    {
      icon: Package,
      title: "Track & Receive",
      description: "Follow your order from creation to delivery. Our artisans keep you updated throughout the process, and we ensure safe delivery to your doorstep.",
    },
    {
      icon: Star,
      title: "Review & Share",
      description: "Share your experience! Your reviews help other customers and support artisans in building their reputation on the platform.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-center">
            How It Works
          </h1>
          
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Getting your custom creation is simple. Here's how MOE Marketplace connects you with 
            Africa's finest artisans.
          </p>

          {/* Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-6 flex gap-6 items-start">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                          Step {index + 1}
                        </span>
                        <h3 className="text-xl font-display font-bold">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FAQ CTA */}
          <div className="mt-12 text-center p-8 bg-primary/5 rounded-2xl">
            <h2 className="text-2xl font-display font-bold mb-4">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">
              Check out our FAQ section or contact our support team for assistance.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a href="/marketplace/support/faqs" className="text-primary hover:underline font-medium">
                View FAQs →
              </a>
              <a href="/marketplace/support/contact" className="text-primary hover:underline font-medium">
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default HowItWorks;
