import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, CheckCircle, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";

const ReturnPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* Header — centered */}
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Return & Refund Policy</h1>
          <p className="text-muted-foreground leading-relaxed">
            Understand our return and refund policies for a smooth shopping experience
          </p>
        </div>

        {/* Content — constrained and centered */}
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Quick Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h2 className="font-semibold text-lg mb-4 text-center">Quick Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-3xl font-bold text-primary mb-1">7</p>
                  <p className="text-sm text-muted-foreground">Days for Returns</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-3xl font-bold text-primary mb-1">5-10</p>
                  <p className="text-sm text-muted-foreground">Days for Refunds</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-3xl font-bold text-primary mb-1">100%</p>
                  <p className="text-sm text-muted-foreground">Quality Guarantee</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eligible Items */}
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                What Can Be Returned
              </h2>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3 leading-relaxed">
                  <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                  Ready-to-wear items within 7 days of delivery (unworn, with tags attached)
                </li>
                <li className="flex items-start gap-3 leading-relaxed">
                  <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                  Items with manufacturing defects or quality issues
                </li>
                <li className="flex items-start gap-3 leading-relaxed">
                  <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                  Items that don't match the product description
                </li>
                <li className="flex items-start gap-3 leading-relaxed">
                  <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                  Custom items that don't match agreed-upon specifications
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Non-Eligible Items */}
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                What Cannot Be Returned
              </h2>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3 leading-relaxed">
                  <ArrowRight className="h-4 w-4 mt-1 text-destructive flex-shrink-0" />
                  Custom-made items (unless defective or not matching specifications)
                </li>
                <li className="flex items-start gap-3 leading-relaxed">
                  <ArrowRight className="h-4 w-4 mt-1 text-destructive flex-shrink-0" />
                  Items that have been worn, washed, or altered
                </li>
                <li className="flex items-start gap-3 leading-relaxed">
                  <ArrowRight className="h-4 w-4 mt-1 text-destructive flex-shrink-0" />
                  Items returned after 7 days from delivery
                </li>
                <li className="flex items-start gap-3 leading-relaxed">
                  <ArrowRight className="h-4 w-4 mt-1 text-destructive flex-shrink-0" />
                  Beauty products that have been opened or used
                </li>
                <li className="flex items-start gap-3 leading-relaxed">
                  <ArrowRight className="h-4 w-4 mt-1 text-destructive flex-shrink-0" />
                  Intimate items or accessories that have been worn
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Return Process */}
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-accent" />
                How to Request a Return
              </h2>
              <ol className="space-y-5">
                {[
                  { step: 1, title: "Go to My Orders", desc: "Find the order you want to return" },
                  { step: 2, title: 'Click "Request Return"', desc: "Select the items and reason for return" },
                  { step: 3, title: "Pack and Ship", desc: "Use original packaging if possible, include the return label" },
                  { step: 4, title: "Receive Your Refund", desc: "Refunds are processed within 5-10 business days after we receive the item" },
                ].map(({ step, title, desc }) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                      {step}
                    </span>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 pb-8">
            <Link to="/marketplace/orders">
              <Button>Go to My Orders</Button>
            </Link>
            <Link to="/marketplace/support/contact">
              <Button variant="outline">Contact Support</Button>
            </Link>
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default ReturnPolicy;
