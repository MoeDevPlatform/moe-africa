import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingBag, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Artisans",
      value: "24",
      change: "+12%",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Products",
      value: "156",
      change: "+23%",
      icon: Package,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Pending Orders",
      value: "18",
      change: "+5%",
      icon: ShoppingBag,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Revenue (₦)",
      value: "2.4M",
      change: "+18%",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back! Here's an overview of MOE marketplace.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="overflow-hidden border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-full p-2 ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-display text-foreground">
                    {stat.value}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-primary">{stat.change}</span>{" "}
                    from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-display">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        Custom Ankara Dress
                      </p>
                      <p className="text-sm text-muted-foreground">
                        By Adanna Fabrics
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">₦45,000</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-display">
                Top Performing Artisans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Adanna Fabrics", sales: "₦890K", items: "34 items" },
                  { name: "Kola Leatherworks", sales: "₦720K", items: "28 items" },
                  { name: "Amara Crafts", sales: "₦650K", items: "41 items" },
                ].map((artisan) => (
                  <div
                    key={artisan.name}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-warm" />
                      <div>
                        <p className="font-medium text-foreground">
                          {artisan.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {artisan.items}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-foreground">{artisan.sales}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
