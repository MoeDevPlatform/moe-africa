import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Providers from "./pages/admin/Providers";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import Orders from "./pages/admin/Orders";
import Media from "./pages/admin/Media";
import CustomOrders from "./pages/admin/CustomOrders";
import NotFound from "./pages/NotFound";
import Landing from "./pages/marketplace/Landing";
import MarketplaceHome from "./pages/marketplace/Home";
import ProviderDetail from "./pages/marketplace/ProviderDetail";
import ProductDetail from "./pages/marketplace/ProductDetail";
import CategoryProviders from "./pages/marketplace/CategoryProviders";
import Cart from "./pages/marketplace/Cart";
import Checkout from "./pages/marketplace/Checkout";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Marketplace Routes */}
          <Route path="/marketplace" element={<MarketplaceHome />} />
          <Route path="/marketplace/category/:categoryId" element={<CategoryProviders />} />
          <Route path="/marketplace/provider/:id" element={<ProviderDetail />} />
          <Route path="/marketplace/product/:id" element={<ProductDetail />} />
          <Route path="/marketplace/cart" element={<Cart />} />
          <Route path="/marketplace/checkout" element={<Checkout />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/providers" element={<Providers />} />
          <Route path="/admin/products" element={<Products />} />
          <Route path="/admin/categories" element={<Categories />} />
          <Route path="/admin/media" element={<Media />} />
          <Route path="/admin/orders" element={<Orders />} />
          <Route path="/admin/custom-orders" element={<CustomOrders />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
