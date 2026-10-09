import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";

const THIRTY_MIN_MS = 30 * 60 * 1000;
const SESSION_KEY = "moe_cart_nudge_shown";

/**
 * Shows once per session when the cart was started >30 minutes ago and still has items.
 */
const CartAbandonmentBanner = () => {
  const { items, getItemCount } = useCart();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      if (getItemCount() <= 0) return;
      const started = Number(localStorage.getItem("moe_cart_started") || 0);
      if (!started || Date.now() - started < THIRTY_MIN_MS) return;
      setShow(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
  }, [items, getItemCount]);

  if (!show) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-sm flex items-center justify-center gap-3 flex-wrap">
      <span>
        You left something behind. Complete your order before it sells out.
      </span>
      <Button asChild size="sm" variant="outline">
        <Link to="/marketplace/cart">View Cart</Link>
      </Button>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground text-xs"
        onClick={() => setShow(false)}
      >
        Dismiss
      </button>
    </div>
  );
};

export default CartAbandonmentBanner;
