import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { testOrdersService, type TestOrderOptionProduct, type TestOrderOptionUser, type TestOrderSummary } from "@/lib/apiServices";
import { ExternalLink, FlaskConical, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const status = (value: string | null | undefined) => value?.replace(/_/g, " ") || "not started";

const TestOrders = () => {
  const [orders, setOrders] = useState<TestOrderSummary[]>([]);
  const [customers, setCustomers] = useState<TestOrderOptionUser[]>([]);
  const [artisans, setArtisans] = useState<TestOrderOptionUser[]>([]);
  const [products, setProducts] = useState<TestOrderOptionProduct[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [artisanId, setArtisanId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [busy, setBusy] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    try {
      await testOrdersService.config();
      setAllowed(true);
      const [opts, rows] = await Promise.all([testOrdersService.options(), testOrdersService.list()]);
      setCustomers(opts.customers);
      setArtisans(opts.artisans);
      setProducts(opts.products);
      setOrders(rows);
    } catch (error) {
      setAllowed(false);
      toast.error(error instanceof Error ? error.message : "Test order simulator unavailable");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const eligibleProducts = useMemo(
    () => products.filter((product) => !artisanId || product.providerId === Number(artisanId)),
    [products, artisanId],
  );

  const mutate = async (task: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try { await task(); toast.success(message); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Action failed"); }
    finally { setBusy(false); }
  };

  if (allowed === false) {
    return <AdminLayout><Card><CardHeader><CardTitle>Test Orders unavailable</CardTitle></CardHeader><CardContent>This environment or admin account is not authorised.</CardContent></Card></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="test-orders-panel">
        <div>
          <div className="flex items-center gap-2"><FlaskConical className="h-6 w-6 text-amber-600" /><h1 className="text-3xl font-display font-bold">Test Orders</h1></div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Isolated simulation only. Customer settlement and payouts are labelled simulated; no gateway, card, bank account, or real transfer is used. Progress each order through the existing dashboards.</p>
        </div>

        <Card className="border-amber-400/60 bg-amber-50/60 dark:bg-amber-950/20">
          <CardHeader><CardTitle className="text-lg">Create TEST ORDER</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div><Label>Test customer</Label><Select value={customerId} onValueChange={setCustomerId}><SelectTrigger data-testid="test-customer"><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((user) => <SelectItem key={user.id} value={String(user.id)}>{user.name} · {user.email}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Test artisan</Label><Select value={artisanId} onValueChange={(value) => { setArtisanId(value); setProductId(""); }}><SelectTrigger data-testid="test-artisan"><SelectValue placeholder="Select artisan" /></SelectTrigger><SelectContent>{artisans.map((user) => <SelectItem key={user.id} value={String(user.id)}>{user.artisanProfile?.brandName || user.artisanProfile?.businessName || user.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Eligible product</Label><Select value={productId} onValueChange={setProductId}><SelectTrigger data-testid="test-product"><SelectValue placeholder="Select product" /></SelectTrigger><SelectContent>{eligibleProducts.map((product) => <SelectItem key={product.id} value={String(product.id)}>{product.name} · {product.currency} {product.price?.toLocaleString()}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Quantity</Label><Input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min={1} max={20} /></div>
            <div className="md:col-span-4"><Button disabled={busy || !customerId || !artisanId || !productId} data-testid="create-test-order" onClick={() => mutate(() => testOrdersService.create({ customerId: Number(customerId), artisanId: Number(artisanId), productId: Number(productId), quantity: Number(quantity) }), "Test order and simulated customer settlement created")}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simulate Successful Customer Payment</Button></div>
            {(customers.length === 0 || artisans.length === 0 || products.length === 0) && <p className="md:col-span-4 text-sm text-amber-800 dark:text-amber-200">No complete fixtures are available. Mark dedicated local/staging users with <code>isTestUser=true</code>, approve the test artisan, and add an approved product owned by that artisan.</p>}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {orders.map((order) => {
            const recorded = order.transfers.find((transfer) => transfer.status === "recorded");
            return <Card key={order.id} className="border-amber-400/50" data-testid={`test-order-${order.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><CardTitle className="text-lg">{order.testReference}</CardTitle><Badge className="bg-amber-500 text-black">TEST ORDER</Badge><Badge variant="outline">SIMULATED PAYMENT</Badge></div><p className="text-sm text-muted-foreground">{order.productName} · {order.currency} {order.price?.toLocaleString()}</p></div><Button variant="ghost" size="icon" disabled={busy} aria-label="Clean up test order" onClick={() => mutate(() => testOrdersService.cleanup(order.id), "Test order cleaned up")}><Trash2 className="h-4 w-4 text-destructive" /></Button></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4"><p>Customer payment: <b>{status(order.simulatedPaymentStatus)}</b></p><p>Readiness: <b>{status(order.readinessStatus)}</b></p><p>Initial payout: <b>{status(order.initialPayoutStatus)}</b></p><p>Production: <b>{status(order.productionStatus)}</b></p><p>Quality: <b>{status(order.qualityStatus)}</b></p><p>Delivery: <b>{status(order.deliveryStatus)}</b></p><p>Final payout: <b>{status(order.finalPayoutStatus)}</b></p><p>Time scenario: <b>{status(order.simulationTimeScenario)}</b></p></div>
                <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link to={`/marketplace/orders/${order.id}`}>Customer order <ExternalLink className="ml-1 h-3 w-3" /></Link></Button><Button variant="outline" asChild><Link to="/artisan/dashboard?tab=orders&orderView=all">Artisan orders <ExternalLink className="ml-1 h-3 w-3" /></Link></Button><Button variant="outline" asChild><Link to="/admin/orders">Admin orders <ExternalLink className="ml-1 h-3 w-3" /></Link></Button></div>
                <div className="flex flex-wrap gap-2"><Button size="sm" disabled={busy || order.initialPayoutStatus !== "amount_approved"} onClick={() => mutate(() => testOrdersService.recordPayout(order.id), "Simulated payout recorded")}>Record simulated payout</Button><Button size="sm" disabled={busy || !recorded} onClick={() => recorded && mutate(() => testOrdersService.verifyPayout(order.id, recorded.id), "Simulated payout independently verified")}>Verify recorded payout</Button><Select onValueChange={(scenario) => mutate(() => testOrdersService.setTimeScenario(order.id, scenario), "Test-time scenario applied")}><SelectTrigger className="w-[240px]"><SelectValue placeholder="Apply test-time scenario" /></SelectTrigger><SelectContent><SelectItem value="readiness_24h_due">24h readiness deadline due</SelectItem><SelectItem value="production_overdue">Production overdue</SelectItem><SelectItem value="delivery_review_72h_due">72h delivery review due</SelectItem></SelectContent></Select></div>
              </CardContent>
            </Card>;
          })}
          {allowed && orders.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No simulated orders yet.</CardContent></Card>}
        </div>
      </div>
    </AdminLayout>
  );
};

export default TestOrders;
