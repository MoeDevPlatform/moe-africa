import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, User, Search, Heart, Package, Settings, Menu, ChevronDown, HelpCircle, LogOut, Palette, Store, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import logo from "@/assets/logo.png";
import SearchResults from "./SearchResults";
import NotificationCenter from "./NotificationCenter";
import MegaMenu from "./MegaMenu";
import MobileMenu from "./MobileMenu";
import CartAbandonmentBanner from "./CartAbandonmentBanner";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { useClerk, useUser } from "@clerk/react";
import { isClerkEnabled } from "@/lib/clerk";

const supportLinks = [
  { name: "Help Center", path: "/marketplace/support/help" },
  { name: "FAQs", path: "/marketplace/support/faqs" },
  { name: "Order Support", path: "/marketplace/support/order-support" },
  { name: "Contact Us", path: "/marketplace/support/contact" },
  { name: "Report an Issue", path: "/marketplace/support/report" },
  { name: "Track My Order", path: "/marketplace/support/track-order" },
  { name: "Return / Refund Policy", path: "/marketplace/support/return-policy" },
];

/** Hover label for icon-only navbar buttons. Relies on the app-level <TooltipProvider>. */
const IconTooltip = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
);

const SignInLink = () => (
  <Link to="/auth" className="hidden sm:block">
    <Button variant="outline" size="sm" className="gap-2" aria-label="Sign in to your account">
      <User className="h-4 w-4" aria-hidden="true" />
      <span className="hidden lg:inline">Sign In</span>
    </Button>
  </Link>
);

/** Avatar/menu shared by MOE-only and Clerk-aware auth slots. */
const UserAvatarMenu = ({
  name,
  email,
  avatarUrl,
  isArtisan,
  onLogout,
}: {
  name: string;
  email: string;
  avatarUrl?: string;
  isArtisan: boolean;
  onLogout: () => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
        <Avatar className="h-8 w-8">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
          </AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56 bg-card">
      <div className="px-3 py-2">
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-muted-foreground">{email}</p>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to="/marketplace/settings" className="cursor-pointer gap-2">
          <User className="h-4 w-4" /> My Profile
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to="/marketplace/orders" className="cursor-pointer gap-2">
          <Package className="h-4 w-4" /> My Orders
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to="/marketplace/messages" className="cursor-pointer gap-2">
          <MessageSquare className="h-4 w-4" /> Messages
        </Link>
      </DropdownMenuItem>
      {isArtisan && (
        <DropdownMenuItem asChild>
          <Link to="/artisan/dashboard" className="cursor-pointer gap-2">
            <Store className="h-4 w-4" /> Artisan Dashboard
          </Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="cursor-pointer gap-2 text-destructive focus:text-destructive"
        onClick={onLogout}
      >
        <LogOut className="h-4 w-4" /> Sign Out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

/**
 * When Clerk is enabled, treat either a MOE session or an active Clerk session
 * as signed-in. Mounted only under <ClerkProvider>.
 */
const ClerkAwareAuthSlot = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isArtisan, logout } = useAuth();
  const { isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();

  const showSignedIn = isAuthenticated || Boolean(isSignedIn);
  if (!showSignedIn) return <SignInLink />;

  const name = user?.name || clerkUser?.fullName || clerkUser?.firstName || "User";
  const email = user?.email || clerkUser?.primaryEmailAddress?.emailAddress || "";
  const avatarUrl = user?.avatarUrl || clerkUser?.imageUrl || undefined;

  return (
    <UserAvatarMenu
      name={name}
      email={email}
      avatarUrl={avatarUrl}
      isArtisan={isArtisan}
      onLogout={() => {
        void (async () => {
          try { await signOut(); } catch { /* non-fatal */ }
          logout();
          navigate("/");
        })();
      }}
    />
  );
};

/** Legacy path — AuthContext only (no Clerk hooks). */
const MoeAuthSlot = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isArtisan, logout } = useAuth();
  if (!isAuthenticated || !user) return <SignInLink />;
  return (
    <UserAvatarMenu
      name={user.name}
      email={user.email}
      avatarUrl={user.avatarUrl}
      isArtisan={isArtisan}
      onLogout={() => { logout(); navigate("/"); }}
    />
  );
};

const MarketplaceNavbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { getItemCount } = useCart();
  const { getItemCount: getWishlistCount } = useWishlist();

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

  const userMenu = isClerkEnabled ? <ClerkAwareAuthSlot /> : <MoeAuthSlot />;

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
      <CartAbandonmentBanner />
      
    <header className="marketplace-nav sticky top-0 z-50 w-full border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 lg:h-20 items-center justify-between gap-2 lg:gap-5">
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setShowMobileMenu(true)}
            aria-label="Open mobile menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>

          {/* Logo */}
          <Link to="/marketplace" className="flex shrink-0 items-center">
            <img loading="lazy" decoding="async" src={logo} alt="MOE Africa" className="h-10 lg:h-12 w-auto" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }} />
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex min-w-0 flex-1 max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                data-testid="search-input"
                placeholder="Search products, artisans and services"
                aria-label="Search the marketplace"
                className="h-12 pl-10 w-full rounded-full border-primary/40 bg-surface"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={handleSearchFocus}
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <IconTooltip label="Notifications">
              <span className="inline-flex">
                <NotificationCenter />
              </span>
            </IconTooltip>
            
            <IconTooltip label="Wishlist">
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
            </IconTooltip>

            <IconTooltip label="Orders">
              <Link to="/marketplace/orders" className="hidden xl:block">
                <Button variant="ghost" size="icon" aria-label="View your orders">
                  <Package className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
            </IconTooltip>

            <IconTooltip label="Messages">
              <Link to="/marketplace/messages" className="hidden xl:block">
                <Button variant="ghost" size="icon" aria-label="Open messages">
                  <MessageSquare className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
            </IconTooltip>

            {/* Support Dropdown */}
            <DropdownMenu>
              <IconTooltip label="Help & Support">
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden sm:flex" aria-label="Open support menu">
                    <HelpCircle className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
              </IconTooltip>
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

            <IconTooltip label="Settings">
              <Link to="/marketplace/settings" className="hidden xl:block">
                <Button variant="ghost" size="icon" aria-label="Settings">
                  <Settings className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
            </IconTooltip>
            
            <IconTooltip label="Cart">
              <Link to="/marketplace/cart">
                <Button variant="ghost" size="icon" className="relative" aria-label={`Shopping cart${getItemCount() > 0 ? `, ${getItemCount()} items` : ''}`}>
                  <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                  <span
                    data-testid="cart-count"
                    className={
                      getItemCount() > 0
                        ? "absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold"
                        : "sr-only"
                    }
                  >
                    {getItemCount()}
                  </span>
                </Button>
              </Link>
            </IconTooltip>

            {userMenu}
          </nav>
        </div>

        <nav className="hidden lg:flex items-center gap-6 border-t border-border/60 py-2 text-sm" aria-label="Marketplace discovery">
          <div onMouseEnter={handleMegaMenuEnter} onMouseLeave={handleMegaMenuLeave}>
            <Button variant="ghost" className="gap-2 px-0 hover:bg-transparent" onClick={() => setShowMegaMenu(true)} aria-expanded={showMegaMenu} aria-controls="marketplace-categories">
              <Menu className="h-4 w-4" /> Categories <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          <Link className="hover:text-primary hover:underline" to="/marketplace/products">All Products</Link>
          <Link className="hover:text-primary hover:underline" to="/marketplace/products?audience=men">Men</Link>
          <Link className="hover:text-primary hover:underline" to="/marketplace/products?audience=women">Women</Link>
          <Link className="hover:text-primary hover:underline" to="/marketplace/products?audience=children">Children</Link>
          <Link className="hover:text-primary hover:underline" to="/marketplace/products?sort=newest">New Arrivals</Link>
          <Link className="hover:text-primary hover:underline" to="/marketplace/products?collection=best-sellers">Best Sellers</Link>
          <Link className="hover:text-primary hover:underline" to="/marketplace/artisans">Explore Artisans</Link>
          <Link className="hover:text-primary hover:underline" to="/marketplace/custom-orders">Custom Orders</Link>
        </nav>

        {/* Mobile Search */}
        <div className="lg:hidden pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              data-testid="search-input"
              placeholder="Search products and artisans"
              aria-label="Search the marketplace"
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
