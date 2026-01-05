import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Award, Globe, Heart } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-center">
            About MOE Marketplace
          </h1>
          
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Connecting you with Africa's finest artisans for custom creations that celebrate heritage, 
            craftsmanship, and individual expression.
          </p>

          {/* Mission Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-display font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              MOE Marketplace was founded with a singular vision: to bridge the gap between talented African 
              artisans and customers worldwide who appreciate authentic, handcrafted goods. We believe in 
              preserving traditional craftsmanship while embracing modern design sensibilities.
            </p>
          </section>

          {/* Values */}
          <section className="mb-16">
            <h2 className="text-2xl font-display font-bold mb-6">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <Users className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Community First</h3>
                  <p className="text-sm text-muted-foreground">
                    We empower local artisans and their communities through fair trade practices and 
                    sustainable business partnerships.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <Award className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Quality Craftsmanship</h3>
                  <p className="text-sm text-muted-foreground">
                    Every artisan on our platform is vetted for quality, ensuring you receive 
                    products that meet the highest standards.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <Globe className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Global Reach</h3>
                  <p className="text-sm text-muted-foreground">
                    We connect African artisans with customers worldwide, sharing the beauty of 
                    African craftsmanship globally.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <Heart className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Customer Satisfaction</h3>
                  <p className="text-sm text-muted-foreground">
                    Your satisfaction is our priority. We work tirelessly to ensure every 
                    order exceeds expectations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Stats */}
          <section className="bg-primary/5 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-display font-bold mb-8">MOE by the Numbers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-3xl font-bold text-primary">500+</p>
                <p className="text-sm text-muted-foreground">Verified Artisans</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">10,000+</p>
                <p className="text-sm text-muted-foreground">Happy Customers</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">15+</p>
                <p className="text-sm text-muted-foreground">African Countries</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">4.8★</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default About;
