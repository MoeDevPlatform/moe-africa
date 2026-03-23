import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import Index from "./pages/Index";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Providers from "./pages/admin/Providers";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import Orders from "./pages/admin/Orders";
import Media from "./pages/admin/Media";
import NotFound from "./pages/NotFound";
import Landing from "./pages/marketplace/Landing";
import MarketplaceHome from "./pages/marketplace/Home";
import ProviderDetail from "./pages/marketplace/ProviderDetail";
import ProductDetail from "./pages/marketplace/ProductDetail";
import Cart from "./pages/marketplace/Cart";
import Checkout from "./pages/marketplace/Checkout";
import Messages from "./pages/marketplace/Messages";
import Wishlist from "./pages/marketplace/Wishlist";
import CategoryProviders from "./pages/marketplace/CategoryProviders";
import CategoryProducts from "./pages/marketplace/CategoryProducts";
import CustomerOrders from "./pages/marketplace/Orders";
import OrderDetail from "./pages/marketplace/OrderDetail";
import Settings from "./pages/marketplace/Settings";
import Auth from "./pages/Auth";
import AllProducts from "./pages/marketplace/AllProducts";
import AllArtisans from "./pages/marketplace/AllArtisans";

// Support Pages
import HelpCenter from "./pages/marketplace/support/HelpCenter";
import FAQs from "./pages/marketplace/support/FAQs";
import ContactUs from "./pages/marketplace/support/ContactUs";
import OrderSupport from "./pages/marketplace/support/OrderSupport";
import ReportIssue from "./pages/marketplace/support/ReportIssue";
import TrackOrder from "./pages/marketplace/support/TrackOrder";
import ReturnPolicy from "./pages/marketplace/support/ReturnPolicy";

// Footer Pages
import About from "./pages/marketplace/About";
import HowItWorks from "./pages/marketplace/HowItWorks";
import Blog from "./pages/marketplace/Blog";
import BlogDetail from "./pages/marketplace/BlogDetail";
import ShippingInfo from "./pages/marketplace/ShippingInfo";
import PrivacyPolicy from "./pages/marketplace/PrivacyPolicy";
import TermsOfService from "./pages/marketplace/TermsOfService";
import CookiePolicy from "./pages/marketplace/CookiePolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <NotificationProvider>
      <WishlistProvider>
        <CartProvider>
          <PreferencesProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Footer & Static Pages */}
                  <Route path="/about" element={<About />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogDetail />} />
                  <Route path="/shipping" element={<ShippingInfo />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/cookies" element={<CookiePolicy />} />
                  
                  {/* Marketplace Routes */}
                  <Route path="/marketplace" element={<MarketplaceHome />} />
                  <Route path="/marketplace/products" element={<AllProducts />} />
                  <Route path="/marketplace/artisans" element={<AllArtisans />} />
                  <Route path="/marketplace/category/:category" element={<CategoryProviders />} />
                  <Route path="/marketplace/category/:category/products" element={<CategoryProducts />} />
                  <Route path="/marketplace/provider/:id" element={<ProviderDetail />} />
                  <Route path="/marketplace/product/:id" element={<ProductDetail />} />
                  <Route path="/marketplace/cart" element={<Cart />} />
                  <Route path="/marketplace/checkout" element={<Checkout />} />
                  <Route path="/marketplace/messages" element={<Messages />} />
                  <Route path="/marketplace/wishlist" element={<Wishlist />} />
                  <Route path="/marketplace/orders" element={<CustomerOrders />} />
                  <Route path="/marketplace/orders/:orderId" element={<OrderDetail />} />
                  <Route path="/marketplace/settings" element={<Settings />} />
                  
                  {/* Support Routes */}
                  <Route path="/marketplace/support/help" element={<HelpCenter />} />
                  <Route path="/marketplace/support/faqs" element={<FAQs />} />
                  <Route path="/marketplace/support/contact" element={<ContactUs />} />
                  <Route path="/marketplace/support/order-support" element={<OrderSupport />} />
                  <Route path="/marketplace/support/report" element={<ReportIssue />} />
                  <Route path="/marketplace/support/track-order" element={<TrackOrder />} />
                  <Route path="/marketplace/support/return-policy" element={<ReturnPolicy />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<Login />} />
                  <Route path="/admin" element={<Dashboard />} />
                  <Route path="/admin/providers" element={<Providers />} />
                  <Route path="/admin/products" element={<Products />} />
                  <Route path="/admin/categories" element={<Categories />} />
                  <Route path="/admin/media" element={<Media />} />
                  <Route path="/admin/orders" element={<Orders />} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </PreferencesProvider>
        </CartProvider>
      </WishlistProvider>
    </NotificationProvider>
  </QueryClientProvider>
);

export default App;
