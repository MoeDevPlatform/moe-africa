import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { paymentsService, type PaymentVerifyResponse } from "@/lib/apiServices";

type GatewayName = "paystack" | "flutterwave";

function readGateway(value: string | null): GatewayName | null {
  return value === "paystack" || value === "flutterwave" ? value : null;
}

const PaymentCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [result, setResult] = useState<PaymentVerifyResponse | null>(null);
  const [phase, setPhase] = useState<"checking" | "done" | "missing">("checking");
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  const gateway = readGateway(params.get("gateway"));
  const reference = params.get("reference") || params.get("trxref") || params.get("tx_ref");
  const orderId = params.get("orderId");

  useEffect(() => {
    let stored: { orderId?: string; gateway?: GatewayName; reference?: string } = {};
    try {
      stored = JSON.parse(sessionStorage.getItem("moe_payment") || "{}");
    } catch {
      stored = {};
    }
    const resolvedGateway = gateway ?? stored.gateway ?? null;
    const resolvedReference = reference || stored.reference || "";
    if (!resolvedGateway || !resolvedReference) {
      setPhase("missing");
      return;
    }
    let cancelled = false;
    paymentsService
      .verify({ reference: resolvedReference, gateway: resolvedGateway })
      .then((verified) => {
        if (cancelled) return;
        setResult(verified);
        setPhase("done");
        if (verified.status === "success") {
          clearCart();
          sessionStorage.removeItem("moe_payment");
          navigate(`/marketplace/order-confirmation/${verified.orderId}`, { replace: true });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Payment could not be verified.");
        setPhase("done");
      });
    return () => {
      cancelled = true;
    };
  }, [gateway, reference, clearCart, navigate]);

  const retry = async () => {
    const resolvedGateway = gateway;
    const resolvedOrder = orderId || result?.orderId;
    if (!resolvedGateway || !resolvedOrder) return;
    setRetrying(true);
    setError("");
    try {
      const started = await paymentsService.initialize({
        orderId: resolvedOrder,
        gateway: resolvedGateway,
        cardOnly: false,
      });
      if (started.alreadyPaid || started.status === "success") {
        navigate(`/marketplace/order-confirmation/${resolvedOrder}`, { replace: true });
        return;
      }
      if (started.paymentUrl) {
        window.location.assign(started.paymentUrl);
        return;
      }
      setError("Secure checkout link was not returned.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not restart payment.");
    } finally {
      setRetrying(false);
    }
  };

  const title =
    phase === "missing"
      ? "Payment was not completed"
      : result?.status === "cancelled"
        ? "Payment cancelled"
        : result?.status === "failed" || error
          ? "Payment failed"
          : result?.status === "pending"
            ? "Payment pending"
            : "Checking payment";

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {phase === "checking" ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {phase === "missing"
                  ? "No payment was confirmed. An order is marked paid only after the payment provider verifies it."
                  : error ||
                    (result?.status === "success"
                      ? "Payment confirmed."
                      : "The order has not been marked as paid.")}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {phase !== "checking" && gateway && (orderId || result?.orderId) && result?.status !== "success" && (
                <Button type="button" onClick={() => void retry()} disabled={retrying}>
                  {retrying ? "Restarting…" : "Try payment again"}
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to="/marketplace/checkout">Back to checkout</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <MarketplaceFooter />
    </div>
  );
};

export default PaymentCallback;
