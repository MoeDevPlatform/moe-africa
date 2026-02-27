import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, FolderTree, Image, TrendingUp, AlertCircle } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Providers",
      value: "48",
      description: "+4 new this month",
      icon: Users,
      trend: "+8.3%",
      endpoint: "GET /service-providers",
    },
    {
      title: "Total Products",
      value: "342",
      description: "+23 this week",
      icon: Package,
      trend: "+6.7%",
      endpoint: "GET /products",
    },
    {
      title: "Active Categories",
      value: "12",
      description: "Service + Product",
      icon: FolderTree,
      trend: "Stable",
      endpoint: "GET /service-categories + /product-categories",
    },
    {
      title: "Media Uploads",
      value: "1,247",
      description: "Total files",
      icon: Image,
      trend: "+12.1%",
      endpoint: "GET /media",
    },
  ];

  const recentActivity = [
    { action: "New provider registered", provider: "Kemi Fabrics", time: "2 hours ago", status: "pending" },
    { action: "Product approved", product: "Ankara Dress", time: "5 hours ago", status: "success" },
    { action: "Category created", category: "Footwear", time: "1 day ago", status: "success" },
    { action: "Provider verification", provider: "Ade Tailors", time: "2 days ago", status: "warning" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-muted-foreground">
            Monitor your marketplace performance and activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold text-foreground">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span className="text-xs text-primary font-medium">{stat.trend}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-2 font-mono">
                  {stat.endpoint}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-xl font-display">Recent Activity</CardTitle>
            <CardDescription>Latest updates across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    {activity.status === "pending" && (
                      <AlertCircle className="h-5 w-5 text-accent" />
                    )}
                    {activity.status === "success" && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                    {activity.status === "warning" && (
                      <div className="h-2 w-2 rounded-full bg-accent" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.provider || activity.product || activity.category}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
