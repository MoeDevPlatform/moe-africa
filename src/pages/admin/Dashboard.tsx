import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Package, ShoppingBag, AlertCircle, UserCircle } from "lucide-react";
import { adminService, type AdminDashboardStats } from "@/lib/apiServices";
import { toast } from "sonner";

const Dashboard = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    adminService
      .getDashboard()
      .then(setStats)
      .catch((err) => {
        const msg = err?.message || "Failed to load dashboard";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const cards = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: UserCircle,
      href: "/admin/users",
    },
    {
      title: "Total Artisans",
      value: stats?.totalArtisans ?? 0,
      icon: Users,
      href: "/admin/artisans",
      badge: stats?.artisansByStatus.pending ?? 0,
    },
    {
      title: "Total Products",
      value: stats?.totalProducts ?? 0,
      icon: Package,
      href: "/admin/products",
      badge: stats?.productsByStatus.pending ?? 0,
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders ?? 0,
      icon: ShoppingBag,
      href: "/admin/orders",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard Overview</h1>
          <p className="mt-1 text-muted-foreground">Marketplace activity and pending reviews</p>
          <p className="text-xs text-muted-foreground/60 mt-1 font-mono">GET /admin/dashboard</p>
        </div>

        {error && !isLoading && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="flex items-center justify-between p-4">
              <p className="text-sm text-destructive">{error}</p>
              <button onClick={load} className="text-sm font-medium underline">
                Retry
              </button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((stat) => (
            <Link key={stat.title} to={stat.href}>
              <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-9 w-24" />
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-display font-bold text-foreground">
                        {stat.value.toLocaleString()}
                      </div>
                      {stat.badge ? (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                          {stat.badge} pending
                        </span>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-xl font-display flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-accent" /> Artisans by status
              </CardTitle>
              <CardDescription>Breakdown from /admin/dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(["pending", "approved", "rejected"] as const).map((k) => (
                <Link
                  key={k}
                  to={`/admin/artisans?status=${k}`}
                  className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted transition-colors"
                >
                  <span className="text-sm capitalize">{k}</span>
                  <span className="font-display text-lg font-semibold">
                    {isLoading ? "—" : stats?.artisansByStatus[k] ?? 0}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-xl font-display flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-accent" /> Products by status
              </CardTitle>
              <CardDescription>Draft products are excluded</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(["pending", "approved", "rejected"] as const).map((k) => (
                <Link
                  key={k}
                  to={`/admin/products?status=${k}`}
                  className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted transition-colors"
                >
                  <span className="text-sm capitalize">{k}</span>
                  <span className="font-display text-lg font-semibold">
                    {isLoading ? "—" : stats?.productsByStatus[k] ?? 0}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
