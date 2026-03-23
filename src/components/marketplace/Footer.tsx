import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const MarketplaceFooter = () => {
  return (
    <footer className="border-t bg-card/50 py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <img src={logo} alt="MOE Marketplace Logo" className="h-12 w-auto" />
            <p className="text-sm text-muted-foreground">
              Connecting you with Africa's finest artisans for custom creations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/marketplace" className="text-muted-foreground hover:text-primary transition-colors">Browse Artisans</Link></li>
              <li><Link to="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors">How It Works</Link></li>
              <li><Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/marketplace/support/help" className="text-muted-foreground hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link to="/marketplace/support/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/shipping" className="text-muted-foreground hover:text-primary transition-colors">Shipping Info</Link></li>
              <li><Link to="/marketplace/support/return-policy" className="text-muted-foreground hover:text-primary transition-colors">Returns</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/cookies" className="text-muted-foreground hover:text-primary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 MOE Marketplace. Proudly Built in Africa 🇳🇬
          </p>
          
          {/* Social Icons */}
          <div className="flex gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Follow us on Facebook">
              <Facebook className="h-5 w-5" aria-hidden="true" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Follow us on Twitter">
              <Twitter className="h-5 w-5" aria-hidden="true" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Follow us on Instagram">
              <Instagram className="h-5 w-5" aria-hidden="true" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Follow us on LinkedIn">
              <Linkedin className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketplaceFooter;
