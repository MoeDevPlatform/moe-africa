import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, FolderTree, TrendingUp, AlertCircle, ShoppingCart, Loader2 } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useAllProviders } from "@/hooks/useProviders";
import { useProducts } from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";

const Dashboard = () => {
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const { data: providers = [], isLoading: loadingProviders } = useAllProviders();
  const { data: products = [], isLoading: loadingProducts } = useProducts({ activeOnly: false });
  const { data: orders = [], isLoading: loadingOrders } = useOrders();

  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const activeProviders = providers.filter((p) => p.status === "active").length;
  const activeProducts = products.filter((p) => p.status === "active").length;
  const enabledCategories = categories.filter((c) => c.enabled).length;

  const isLoading = loadingCats || loadingProviders || loadingProducts || loadingOrders;

  const stats = [
    {
      title: "Total Providers",
      value: loadingProviders ? "..." : providers.length.toString(),
      description: `${activeProviders} active`,
      icon: Users,
      trend: `${activeProviders} active`,
      endpoint: "GET /service-providers",
      href: "/admin/providers",
    },
    {
      title: "Total Products",
      value: loadingProducts ? "..." : products.length.toString(),
      description: `${activeProducts} active`,
      icon: Package,
      trend: `${activeProducts} active`,
      endpoint: "GET /products",
      href: "/admin/products",
    },
    {
      title: "Active Categories",
      value: loadingCats ? "..." : enabledCategories.toString(),
      description: `${categories.length} total`,
      icon: FolderTree,
      trend: `${categories.length} total`,
      endpoint: "GET /service-categories",
      href: "/admin/categories",
    },
    {
      title: "Total Orders",
      value: loadingOrders ? "..." : orders.length.toString(),
      description: `${pendingOrders} pending`,
      icon: ShoppingCart,
      trend: `${pendingOrders} pending`,
      endpoint: "GET /orders",
      href: "/admin/orders",
    },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard Overview</h1>
          <p className="mt-1 text-muted-foreground">Monitor your marketplace performance and activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link to={stat.href} key={stat.title}>
              <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold text-foreground">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="text-xs text-primary font-medium">{stat.trend}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-2 font-mono">{stat.endpoint}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Orders */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-xl font-display">Recent Orders</CardTitle>
            <CardDescription>Latest orders placed on the marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No orders yet.</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      {order.status === "pending" && <AlertCircle className="h-5 w-5 text-accent flex-shrink-0" />}
                      {order.status === "completed" && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                      {["approved", "in-progress"].includes(order.status) && <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0" />}
                      {order.status === "cancelled" && <div className="h-2 w-2 rounded-full bg-destructive flex-shrink-0" />}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {order.customer_name || "Guest"} — {(order.products as any)?.name || "Unknown product"}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {order.price_final ? `₦${order.price_final.toLocaleString()}` : "—"}
                      </p>
                      <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
