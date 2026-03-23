import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Package, Shield } from "lucide-react";
import logo from "@/assets/logo.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between">
          <img src={logo} alt="MOE" className="h-16 w-auto" />
          <Link to="/admin/login">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Admin Portal
            </Button>
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero Content */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-tight">
            Authentic African
            <br />
            <span className="bg-gradient-warm bg-clip-text text-transparent">
              Craftsmanship
            </span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with skilled African artisans for custom-made products.
            From tailoring to furniture, discover excellence in every stitch and curve.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/admin/login">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary-dark shadow-lg hover:shadow-xl transition-all duration-300">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Learn More
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl bg-card border border-border p-8 shadow-md transition-all duration-300 hover:shadow-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                Vetted Artisans
              </h3>
              <p className="text-muted-foreground">
                Every service provider is carefully selected and quality-assured to ensure excellence.
              </p>
            </div>

            <div className="rounded-2xl bg-card border border-border p-8 shadow-md transition-all duration-300 hover:shadow-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 mb-4">
                <Package className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                Custom Orders
              </h3>
              <p className="text-muted-foreground">
                Made-to-order products tailored to your exact specifications and preferences.
              </p>
            </div>

            <div className="rounded-2xl bg-card border border-border p-8 shadow-md transition-all duration-300 hover:shadow-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 mb-4">
                <Shield className="h-7 w-7 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                Trust & Quality
              </h3>
              <p className="text-muted-foreground">
                We handle payments, logistics, and support so you can focus on what matters.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="rounded-3xl bg-gradient-hero p-12 text-center shadow-lg">
            <h2 className="text-4xl font-display font-bold text-primary-foreground mb-4">
              Ready to Discover African Excellence?
            </h2>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
              Join our marketplace and experience the finest craftsmanship Africa has to offer.
            </p>
            <Link to="/admin/login">
              <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90 shadow-md">
                Access Admin Portal
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <img src={logo} alt="MOE" className="h-12 w-auto mx-auto mb-4" />
          <p className="text-muted-foreground">
            © 2026 MOE Marketplace. Built For Africa, By Us.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
