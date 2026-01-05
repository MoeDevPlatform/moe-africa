import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Globe, Clock, Package } from "lucide-react";

const ShippingInfo = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-center">
            Shipping Information
          </h1>
          
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Everything you need to know about how we deliver your custom creations.
          </p>

          {/* Shipping Options */}
          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold mb-6">Delivery Options</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Standard Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Our standard delivery option for all orders within Nigeria.
                  </p>
                  <ul className="text-sm space-y-2">
                    <li>• Lagos: 2-3 business days</li>
                    <li>• Other major cities: 3-5 business days</li>
                    <li>• Remote areas: 5-7 business days</li>
                    <li>• Starting from ₦2,500</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Express Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Need it faster? Choose express for priority handling.
                  </p>
                  <ul className="text-sm space-y-2">
                    <li>• Lagos: 1-2 business days</li>
                    <li>• Other major cities: 2-3 business days</li>
                    <li>• Remote areas: 3-4 business days</li>
                    <li>• Starting from ₦5,000</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* International Shipping */}
          <section className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  International Shipping
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  We ship to over 50 countries worldwide. International shipping costs and 
                  delivery times vary based on destination.
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">West Africa</h4>
                    <p className="text-muted-foreground">5-7 business days</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Europe & UK</h4>
                    <p className="text-muted-foreground">7-14 business days</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">North America</h4>
                    <p className="text-muted-foreground">10-14 business days</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Rest of World</h4>
                    <p className="text-muted-foreground">14-21 business days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Important Notes */}
          <section>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>• Custom orders require additional production time before shipping.</li>
                  <li>• You'll receive a tracking number once your order ships.</li>
                  <li>• International orders may be subject to customs duties and taxes.</li>
                  <li>• Free shipping on orders over ₦100,000 within Nigeria.</li>
                  <li>• Contact us for bulk order shipping arrangements.</li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default ShippingInfo;
