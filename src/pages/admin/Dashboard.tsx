import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingBag, AlertCircle, TrendingUp, Loader2 } from "lucide-react";
import { adminService, type AdminDashboardStats } from "@/lib/apiServices";
import { toast } from "sonner";

const Dashboard = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminService
      .getDashboard()
      .then(setStats)
      .catch((err) => {
        toast.error("Failed to load admin dashboard");
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const cards = [
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, endpoint: "GET /admin/dashboard" },
    { title: "Total Artisans", value: stats?.totalArtisans ?? 0, icon: Users, endpoint: "GET /admin/artisans" },
    { title: "Total Products", value: stats?.totalProducts ?? 0, icon: Package, endpoint: "GET /admin/products" },
    { title: "Total Orders", value: stats?.totalOrders ?? 0, icon: ShoppingBag, endpoint: "GET /admin/orders" },
  ];

  const pending = [
    { title: "Artisans awaiting approval", value: stats?.pendingArtisans ?? 0, href: "/admin/providers" },
    { title: "Products awaiting approval", value: stats?.pendingProducts ?? 0, href: "/admin/products" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard Overview</h1>
          <p className="mt-1 text-muted-foreground">Marketplace performance and pending reviews</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {cards.map((stat) => (
                <Card key={stat.title} className="border-border bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-display font-bold text-foreground">{stat.value.toLocaleString()}</div>
                    <p className="text-[10px] text-muted-foreground/60 mt-2 font-mono">{stat.endpoint}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl font-display flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-accent" /> Pending Approvals
                </CardTitle>
                <CardDescription>Items requiring admin action</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pending.map((p) => (
                  <a
                    key={p.title}
                    href={p.href}
                    className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{p.title}</span>
                    <span className="text-2xl font-display font-bold text-primary">{p.value}</span>
                  </a>
                ))}
              </CardContent>
            </Card>

            {stats?.revenue != null && (
              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold text-foreground">
                    ₦{Number(stats.revenue).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
