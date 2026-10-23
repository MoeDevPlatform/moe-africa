import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Package,
  ShoppingBag,
  AlertCircle,
  UserCircle,
  LayoutList,
  Gauge,
  MessageSquare,
  Activity,
} from "lucide-react";
import {
  adminService,
  adminMessagingService,
  type AdminDashboardStats,
  type AdminEventsSummary,
} from "@/lib/apiServices";
import { apiGet } from "@/lib/moeApi";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type ActivityItem = {
  id: string;
  kind: "message" | "contact_us" | "review";
  title: string;
  subtitle: string;
  createdAt: string;
  href: string;
  unread?: boolean;
};

const Dashboard = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [eventsTeaser, setEventsTeaser] = useState<{
    last24h: number;
    productViews: number;
    searches: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivity = async () => {
    const items: ActivityItem[] = [];
    try {
      const [messagesRes, unread] = await Promise.all([
        apiGet<{ data?: Array<Record<string, unknown>> }>("/admin/messages", {
          pageSize: 8,
        }),
        adminMessagingService.unreadCount().catch(() => 0),
      ]);
      setUnreadMessages(unread);
      for (const row of messagesRes.data ?? []) {
        const createdAt = String(row.createdAt ?? "");
        if (row.kind === "contact_us" || row.source === "contact_us") {
          items.push({
            id: String(row.id),
            kind: "contact_us",
            title: String(row.subject || "Contact Us message"),
            subtitle: `${row.senderName || "Visitor"} · ${row.senderEmail || ""}`.trim(),
            createdAt,
            href: "/admin/messages?tab=contact",
            unread: row.isRead === false,
          });
        } else {
          items.push({
            id: String(row.id),
            kind: "message",
            title: String(row.lastMessage || "Customer conversation"),
            subtitle: `${row.customerName || "Customer"} → ${row.providerName || "Artisan"}`,
            createdAt,
            href: row.conversationId
              ? `/admin/messages/${row.conversationId}`
              : "/admin/messages",
          });
        }
      }
    } catch {
      /* messages optional on dashboard */
    }
    try {
      const reviewsRes = await apiGet<{
        data?: Array<Record<string, unknown>>;
      }>("/admin/reviews", { pageSize: 8 });
      for (const row of reviewsRes.data ?? []) {
        const rating = Number(row.rating ?? 0);
        const artisanName = String(row.artisanName || `Artisan #${row.artisanId}`);
        const comment = String(row.comment || "").trim();
        items.push({
          id: `review-${row.id}`,
          kind: "review",
          title: `${rating}★ review · ${artisanName}`,
          subtitle: `${row.customerName || "Customer"}${comment ? ` — ${comment.slice(0, 80)}` : ""}`,
          createdAt: String(row.createdAt ?? ""),
          href: String(row.href || `/admin/artisans/${row.artisanId}`),
        });
      }
    } catch {
      /* reviews optional on dashboard */
    }
    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    setActivity(items.slice(0, 10));
  };

  const loadEventsTeaser = async () => {
    try {
      const summary: AdminEventsSummary = await adminService.eventsSummary();
      const byType = summary.byEventType?.last24h ?? [];
      const fromTypes = (type: string) =>
        byType.find((r) => r.eventType === type)?.count ??
        (summary.last24h ?? [])
          .filter((r) => r.eventType === type)
          .reduce((s, r) => s + r.count, 0);
      const total =
        summary.totals?.last24h ??
        byType.reduce((s, r) => s + r.count, 0) ??
        (summary.last24h ?? []).reduce((s, r) => s + r.count, 0);
      setEventsTeaser({
        last24h: total,
        productViews: fromTypes("product_view"),
        searches: fromTypes("search"),
      });
    } catch {
      setEventsTeaser(null);
    }
  };

  const load = () => {
    setIsLoading(true);
    setError(null);
    Promise.all([
      adminService.getDashboard().then(setStats),
      loadActivity(),
      loadEventsTeaser(),
    ])
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

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-display flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent" /> Behaviour signals
              </CardTitle>
              <CardDescription>
                Marketplace events used for demand badges and recommendations
              </CardDescription>
            </div>
            <Link to="/admin/behaviour" className="text-sm font-medium underline shrink-0">
              Open Behaviour
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading && !eventsTeaser ? (
              <Skeleton className="h-16 w-full" />
            ) : eventsTeaser ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Events (24h)</p>
                  <p className="text-2xl font-display font-semibold tabular-nums">
                    {eventsTeaser.last24h.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Product views</p>
                  <p className="text-2xl font-display font-semibold tabular-nums">
                    {eventsTeaser.productViews.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Searches</p>
                  <p className="text-2xl font-display font-semibold tabular-nums">
                    {eventsTeaser.searches.toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Behaviour summary unavailable. Open{" "}
                <Link to="/admin/behaviour" className="underline text-primary">
                  Behaviour
                </Link>{" "}
                after deploy, or browse the marketplace to generate events.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-display flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-accent" /> Recent activity
              </CardTitle>
              <CardDescription>
                Customer messages, Contact Us, and recent artisan reviews
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {unreadMessages > 0 && (
                <Badge variant="destructive">{unreadMessages} unread</Badge>
              )}
              <Link to="/admin/messages" className="text-sm font-medium underline">
                All messages
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent messages or reviews yet. Contact Us and inbox items appear here when
                submitted.
              </p>
            ) : (
              activity.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className="flex items-start justify-between gap-3 rounded-md border border-border p-3 hover:bg-muted transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {item.kind === "contact_us"
                          ? "Contact Us"
                          : item.kind === "review"
                            ? "Review"
                            : "Message"}
                      </span>
                      {item.unread && <Badge variant="secondary">New</Badge>}
                    </div>
                    <p className="text-sm font-medium truncate mt-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                  {item.createdAt && (
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  )}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-display flex items-center gap-2">
                  <LayoutList className="h-5 w-5 text-accent" /> Homepage curation
                </CardTitle>
                <CardDescription>Active curated item counts</CardDescription>
              </div>
              <Link to="/admin/sections" className="text-sm font-medium underline">
                Manage
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (stats?.curation?.sections?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No curated sections yet.</p>
              ) : (
                stats!.curation!.sections.map((s) => (
                  <Link
                    key={s.sectionKey}
                    to={`/admin/sections/${s.sectionKey}`}
                    className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium">{s.label}</span>
                      <p className="text-xs text-muted-foreground font-mono">{s.sectionKey}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.isActive ? "default" : "secondary"}>
                        {s.activeItemCount}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-display flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-accent" /> Artisan scoring
                </CardTitle>
                <CardDescription>Internal ranking status</CardDescription>
              </div>
              <Link to="/admin/artisans/scores" className="text-sm font-medium underline">
                View scores
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between rounded-md border border-border p-3">
                    <span className="text-sm">Scored artisans</span>
                    <span className="font-display text-lg font-semibold">
                      {stats?.scoring?.scoredArtisans ?? 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last calculated:{" "}
                    {stats?.scoring?.lastCalculatedAt
                      ? new Date(stats.scoring.lastCalculatedAt).toLocaleString()
                      : "Never"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
