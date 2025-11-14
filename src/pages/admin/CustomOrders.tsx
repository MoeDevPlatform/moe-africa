import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, DollarSign } from "lucide-react";

interface CustomOrder {
  id: string;
  customer_id: string;
  service_provider_id: string;
  description: string;
  measurement_data: any;
  design_images: string[] | null;
  status: string;
  quote_amount: number | null;
  created_at: string;
  service_providers?: { brand_name: string };
}

const CustomOrders = () => {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("custom_orders")
      .select("*, service_providers(brand_name)")
      .order("created_at", { ascending: false });

    if (data) {
      setOrders(data as any);
    }
    setLoading(false);
  };

  const handleSendQuote = async () => {
    if (!selectedOrder || !quoteAmount) return;

    const { error } = await supabase
      .from("custom_orders")
      .update({
        quote_amount: parseFloat(quoteAmount),
        status: "quoted",
        quote_sent_at: new Date().toISOString(),
      })
      .eq("id", selectedOrder.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send quote",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Quote sent!",
        description: "The customer has been notified of the quote.",
      });
      setShowQuoteDialog(false);
      setSelectedOrder(null);
      setQuoteAmount("");
      setQuoteNotes("");
      fetchOrders();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      quoted: "secondary",
      accepted: "default",
      completed: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Custom Orders</h1>
          <p className="text-muted-foreground">
            Manage custom order requests from customers
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quote</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No custom orders yet
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">Customer</p>
                          <p className="text-sm text-muted-foreground">{order.customer_id.slice(0, 8)}...</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.service_providers?.brand_name || "N/A"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {order.description}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {order.quote_amount ? `₦${order.quote_amount.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowQuoteDialog(true);
                              }}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Quote
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* View Order Dialog */}
        <Dialog open={!!selectedOrder && !showQuoteDialog} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Custom Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div>
                  <Label>Customer ID</Label>
                  <p className="text-sm">{selectedOrder.customer_id}</p>
                </div>
                <div>
                  <Label>Service Provider</Label>
                  <p className="text-sm">{selectedOrder.service_providers?.brand_name}</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm">{selectedOrder.description}</p>
                </div>
                {selectedOrder.measurement_data && Object.keys(selectedOrder.measurement_data).length > 0 && (
                  <div>
                    <Label>Measurements</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      {Object.entries(selectedOrder.measurement_data).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span> {value as string}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedOrder.design_images && selectedOrder.design_images.length > 0 && (
                  <div>
                    <Label>Design Images</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {selectedOrder.design_images.map((img, idx) => (
                        <img key={idx} src={img} alt={`Design ${idx + 1}`} className="rounded-lg" />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Label>Status</Label>
                  <div className="mt-2">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                {selectedOrder.quote_amount && (
                  <div>
                    <Label>Quote Amount</Label>
                    <p className="text-lg font-semibold mt-1">₦{selectedOrder.quote_amount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Send Quote Dialog */}
        <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Quote</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="quote-amount">Quote Amount (₦)</Label>
                <Input
                  id="quote-amount"
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="quote-notes">Notes (Optional)</Label>
                <Textarea
                  id="quote-notes"
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Additional notes for the customer"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuoteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendQuote} disabled={!quoteAmount}>
                Send Quote
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default CustomOrders;
