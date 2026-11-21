import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/marketplace/Navbar";
import Footer from "@/components/marketplace/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Package,
  CheckCircle,
  Clock,
  Truck,
  Paintbrush,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  isActiveOrderStatus,
  ordersService,
  disputesService,
  type Order,
  type OrderStatusHistoryEntry,
} from "@/lib/apiServices";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const STEPS = [
  { id: "pending", title: "Order received", icon: Package },
  { id: "awaiting_payment", title: "Awaiting payment", icon: Clock },
  { id: "in_progress", title: "In progress", icon: Paintbrush },
  { id: "completed", title: "Delivered", icon: CheckCircle },
];

const statusIndex = (s: string) => {
  const idx = STEPS.findIndex((step) => step.id === s);
  return idx >= 0 ? idx : 0;
};

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderStatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDispute, setShowDispute] = useState(false);
  const [issueType, setIssueType] = useState("Item not received");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReview, setEditingReview] = useState(false);

  const load = async () => {
    if (!orderId) return;
    try {
      const [o, track] = await Promise.all([
        ordersService.getById(orderId),
        ordersService.getTracking(orderId),
      ]);
      setOrder(o);
      setHistory(track.history ?? o.statusHistory ?? []);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !order || !isActiveOrderStatus(order.status)) return;
    const timer = window.setInterval(() => {
      ordersService.getTracking(orderId).then((t) => {
        setHistory(t.history ?? []);
        if (t.status && t.status !== order.status) {
          setOrder((prev) => (prev ? { ...prev, status: t.status as Order["status"] } : prev));
        }
      }).catch(() => {});
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [orderId, order?.status, order]);

  const currentStep = useMemo(
    () => (order ? statusIndex(order.status) : 0),
    [order],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Order not found.</p>
          <Button className="mt-4" onClick={() => navigate("/marketplace/orders")}>
            Back to orders
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">Order #{order.orderNumber ?? order.id}</h1>
            <p className="text-sm text-muted-foreground">{order.productName}</p>
            {order.isTestOrder && (
              <Badge className="mt-1 bg-amber-500 text-black">TEST ORDER · SIMULATED PAYMENT</Badge>
            )}
          </div>
          <Badge className="ml-auto capitalize">{order.status.replace(/_/g, " ")}</Badge>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between gap-2">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const done = i <= currentStep;
                const active = i === currentStep;
                return (
                  <div key={step.id} className="flex-1 text-center">
                    <div
                      className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        done ? "border-primary bg-primary/10 text-primary" : "border-muted text-muted-foreground"
                      } ${active ? "ring-2 ring-primary/30" : ""}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] sm:text-xs mt-2 leading-tight">{step.title}</p>
                  </div>
                );
              })}
            </div>
            {order.estimatedDelivery && (
              <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Estimated delivery: {order.estimatedDelivery}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Artisan</span>
              <span className="font-medium">{order.providerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-primary">₦{order.price.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="text-sm">
              <p className="font-medium mb-1">Ship to</p>
              <p className="text-muted-foreground">
                {addr.firstName} {addr.lastName}<br />
                {addr.addressLine1}<br />
                {addr.city}, {addr.state}, {addr.country}
              </p>
            </div>
          </CardContent>
        </Card>

        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="gap-2 px-0">
              <ChevronDown className="h-4 w-4" />
              Order history
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 border-l-2 border-muted pl-4 mt-2">
            {history.map((h, i) => (
              <div key={`${h.createdAt}-${i}`}>
                <p className="font-medium capitalize text-sm">{h.status.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(h.createdAt).toLocaleString()}
                  {h.note ? ` — ${h.note}` : ""}
                </p>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Need help with this order?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.production?.fulfillmentStatus === "delivered" ? (
              <Button
                type="button"
                className="mr-2"
                data-testid="customer-accept-delivery"
                onClick={async () => {
                  try {
                    await ordersService.acceptDelivery(order.id);
                    toast.success("Delivery confirmed");
                    await load();
                  } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : "Failed to confirm");
                  }
                }}
              >
                Confirm delivery received
              </Button>
            ) : null}
            {order.production?.fulfillmentStatus === "customer_accepted" ? (
              <div className="space-y-3 rounded-md border p-4" data-testid="rate-your-order">
                <p className="font-medium">
                  {(order.customerRating ?? order.production?.customerRating) != null && !editingReview
                    ? "Your rating"
                    : "Rate Your Order"}
                </p>
                {(order.customerRating ?? order.production?.customerRating) != null && !editingReview ? (
                  <div className="space-y-2">
                    <p className="text-sm" data-testid="order-rating-display">
                      {"★".repeat(order.customerRating ?? order.production?.customerRating ?? 0)}
                      {"☆".repeat(5 - (order.customerRating ?? order.production?.customerRating ?? 0))}
                    </p>
                    {(order.customerReview ?? order.production?.customerReview) ? (
                      <p className="text-sm text-muted-foreground" data-testid="order-review-display">
                        {order.customerReview ?? order.production?.customerReview}
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid="edit-order-review"
                      onClick={() => {
                        setRatingStars(order.customerRating ?? order.production?.customerRating ?? 5);
                        setReviewText(order.customerReview ?? order.production?.customerReview ?? "");
                        setEditingReview(true);
                      }}
                    >
                      Edit review
                    </Button>
                  </div>
                ) : (
                  <form
                    className="space-y-3"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setSubmittingReview(true);
                      try {
                        const body = {
                          rating: ratingStars,
                          review: reviewText.trim() || undefined,
                        };
                        if (editingReview || (order.customerRating ?? order.production?.customerRating) != null) {
                          await ordersService.updateOrderReview(String(order.id), body);
                          toast.success("Review updated");
                        } else {
                          await ordersService.submitOrderReview(String(order.id), body);
                          toast.success("Thanks for your review");
                        }
                        setEditingReview(false);
                        await load();
                      } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : "Failed to submit review");
                      } finally {
                        setSubmittingReview(false);
                      }
                    }}
                  >
                    <div className="flex gap-1" role="group" aria-label="Star rating">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className="text-2xl leading-none"
                          aria-label={`${n} star${n > 1 ? "s" : ""}`}
                          data-testid={`rate-star-${n}`}
                          onClick={() => setRatingStars(n)}
                        >
                          {n <= ratingStars ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="order-review-text">Review (optional)</Label>
                      <Textarea
                        id="order-review-text"
                        data-testid="order-review-text"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share your experience with this order"
                        maxLength={500}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={submittingReview}
                        data-testid="submit-order-review"
                      >
                        {submittingReview ? "Saving…" : editingReview ? "Update review" : "Submit rating"}
                      </Button>
                      {editingReview ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setEditingReview(false)}
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </form>
                )}
              </div>
            ) : null}
            {order.production?.fulfillmentStatus ? (
              <p className="text-sm text-muted-foreground" data-testid="customer-fulfillment-status">
                Delivery status: {order.production.fulfillmentStatus.replace(/_/g, " ")}
              </p>
            ) : null}
            {disputeSubmitted ? (
              <p className="text-sm text-muted-foreground">
                Your report has been submitted. Our team will review it within 2 business days.
              </p>
            ) : !showDispute ? (
              <Button variant="outline" onClick={() => setShowDispute(true)}>
                Report a Problem
              </Button>
            ) : (
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (disputeDesc.trim().length < 20) {
                    toast.error("Please describe the issue (at least 20 characters)");
                    return;
                  }
                  setSubmittingDispute(true);
                  try {
                    try {
                      await ordersService.disputeDelivery(order.id, {
                        description: disputeDesc.trim(),
                        issueType,
                      });
                    } catch {
                      await disputesService.create({
                        orderId: Number(order.id),
                        issueType,
                        description: disputeDesc.trim(),
                      });
                    }
                    setDisputeSubmitted(true);
                    toast.success("Report submitted");
                    await load();
                  } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : "Failed to submit report");
                  } finally {
                    setSubmittingDispute(false);
                  }
                }}
              >
                <div className="space-y-2">
                  <Label>Issue type</Label>
                  <Select value={issueType} onValueChange={setIssueType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Item not received">Item not received</SelectItem>
                      <SelectItem value="Item not as described">Item not as described</SelectItem>
                      <SelectItem value="Wrong item">Wrong item</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dispute-desc">Description</Label>
                  <Textarea
                    id="dispute-desc"
                    value={disputeDesc}
                    onChange={(e) => setDisputeDesc(e.target.value)}
                    minLength={20}
                    required
                    rows={4}
                    placeholder="Tell us what went wrong (min 20 characters)"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submittingDispute}>
                    {submittingDispute ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowDispute(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default OrderDetail;
