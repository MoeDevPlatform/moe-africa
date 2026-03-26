import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, User, Search, MessageSquare, Heart, Package, Settings, Menu, ChevronDown, HelpCircle, LogOut, Palette, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import logo from "@/assets/logo.png";
import SearchResults from "./SearchResults";
import NotificationCenter from "./NotificationCenter";
import MegaMenu from "./MegaMenu";
import MobileMenu from "./MobileMenu";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";

const supportLinks = [
  { name: "Help Center", path: "/marketplace/support/help" },
  { name: "FAQs", path: "/marketplace/support/faqs" },
  { name: "Order Support", path: "/marketplace/support/order-support" },
  { name: "Contact Us", path: "/marketplace/support/contact" },
  { name: "Report an Issue", path: "/marketplace/support/report" },
  { name: "Track My Order", path: "/marketplace/support/track-order" },
  { name: "Return / Refund Policy", path: "/marketplace/support/return-policy" },
];

const MarketplaceNavbar = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { getItemCount } = useCart();
  const { getItemCount: getWishlistCount } = useWishlist();
  const { user, isAuthenticated, isArtisan, logout } = useAuth();
  
  // Hover delay timer for mega menu stability
  const megaMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchFocus = () => {
    setShowSearchResults(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      setShowSearchResults(true);
    }
  };

  // Mega menu hover handlers with delay
  const handleMegaMenuEnter = useCallback(() => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
      megaMenuTimeoutRef.current = null;
    }
    setShowMegaMenu(true);
  }, []);

  const handleMegaMenuLeave = useCallback(() => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setShowMegaMenu(false);
    }, 200); // 200ms delay before closing
  }, []);

  return (
    <>
      {showSearchResults && (
        <SearchResults
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClose={() => {
            setShowSearchResults(false);
            setSearchQuery("");
          }}
        />
      )}
      
      <MobileMenu isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />
      
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setShowMobileMenu(true)}
            aria-label="Open mobile menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>

          {/* Logo */}
          <Link to="/marketplace" className="flex items-center">
            <img src={logo} alt="MOE" className="h-10 w-auto" />
          </Link>

          {/* Categories Button - Desktop */}
          <div 
            className="hidden md:block relative"
            onMouseEnter={handleMegaMenuEnter}
            onMouseLeave={handleMegaMenuLeave}
          >
            <Button 
              variant="ghost" 
              className="gap-1"
            >
              Categories
              <ChevronDown className={`h-4 w-4 transition-transform ${showMegaMenu ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for artisans, products, or services..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={handleSearchFocus}
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link to="/marketplace">
              <Button variant="ghost" className="hidden lg:inline-flex">
                Explore
              </Button>
            </Link>
            
            <NotificationCenter />
            
            <Link to="/marketplace/messages">
              <Button variant="ghost" size="icon" aria-label="View messages">
                <MessageSquare className="h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>

            <Link to="/marketplace/wishlist">
              <Button variant="ghost" size="icon" className="relative" aria-label={`View wishlist${getWishlistCount() > 0 ? `, ${getWishlistCount()} items` : ''}`}>
                <Heart className="h-5 w-5" aria-hidden="true" />
                {getWishlistCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold" aria-hidden="true">
                    {getWishlistCount()}
                  </span>
                )}
              </Button>
            </Link>

            <Link to="/marketplace/orders" className="hidden sm:block">
              <Button variant="ghost" size="icon" aria-label="View your orders">
                <Package className="h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>

            {/* Support Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden sm:flex" aria-label="Open support menu">
                  <HelpCircle className="h-5 w-5" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card">
                {supportLinks.map((link) => (
                  <DropdownMenuItem key={link.path} asChild>
                    <Link to={link.path} className="cursor-pointer">
                      {link.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/marketplace/settings" className="hidden sm:block">
              <Button variant="ghost" size="icon" aria-label="Settings">
                <Settings className="h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
            
            <Link to="/marketplace/cart">
              <Button variant="ghost" size="icon" className="relative" aria-label={`Shopping cart${getItemCount() > 0 ? `, ${getItemCount()} items` : ''}`}>
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold" aria-hidden="true">
                    {getItemCount()}
                  </span>
                )}
              </Button>
            </Link>

            <Link to="/auth" className="hidden sm:block">
              <Button variant="outline" size="sm" className="gap-2" aria-label="Sign in to your account">
                <User className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">Sign In</span>
              </Button>
            </Link>
          </nav>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={handleSearchFocus}
            />
          </div>
        </div>
      </div>
      
      {/* Mega Menu - Desktop */}
      <MegaMenu 
        isOpen={showMegaMenu} 
        onClose={() => setShowMegaMenu(false)}
        onMouseEnter={handleMegaMenuEnter}
        onMouseLeave={handleMegaMenuLeave}
      />
    </header>
    </>
  );
};

export default MarketplaceNavbar;

