import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Check, X, Loader2, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { adminService, type ProductStatus } from "@/lib/apiServices";
import { FALLBACK_IMAGE } from "@/lib/imageFallback";

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [action, setAction] = useState<ProductStatus | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!id) return;
    setIsLoading(true);
    adminService
      .getProduct(Number(id))
      .then((p) => setProduct(p))
      .catch((e: any) => {
        if (e?.status === 404) setNotFound(true);
        else toast.error(e?.message || "Failed to load product");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAction = async () => {
    if (!product || !action) return;
    setSubmitting(true);
    try {
      await adminService.setProductStatus(
        Number(product.id),
        action,
        reason.trim() || undefined,
      );
      toast.success(`Product set to ${action}`);
      setAction(null);
      setReason("");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Status update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const images: string[] = Array.isArray(product?.images)
    ? product!.images.map((x: any) => (typeof x === "string" ? x : x?.url)).filter(Boolean)
    : [];
  const status: ProductStatus = (product?.status as ProductStatus) ?? "pending";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/admin/products"><ArrowLeft className="h-4 w-4" /> Back to products</Link>
        </Button>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : notFound ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">Product not found.</CardContent></Card>
        ) : product ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold">{product.name}</h1>
                <p className="text-muted-foreground">{product.category}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    status === "approved" ? "default"
                    : status === "rejected" ? "destructive"
                    : status === "draft" ? "outline" : "secondary"
                  }
                  className="capitalize"
                >{status}</Badge>
                {status !== "approved" && (
                  <Button onClick={() => setAction("approved")} className="gap-2"><Check className="h-4 w-4"/> Approve</Button>
                )}
                {status !== "rejected" && (
                  <Button variant="outline" onClick={() => setAction("rejected")} className="gap-2 text-destructive"><X className="h-4 w-4"/> Reject</Button>
                )}
                {status !== "draft" && (
                  <Button variant="ghost" onClick={() => setAction("draft")} className="gap-2"><FileText className="h-4 w-4"/> Draft</Button>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Images</CardTitle></CardHeader>
                <CardContent>
                  {images.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No images.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {images.map((src, i) => (
                        <img loading="lazy" decoding="async"
                          key={i}
                          src={src}
                          alt={`${product.name} ${i + 1}`}
                          onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                          className="aspect-square w-full rounded-md object-cover"
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div><span className="text-muted-foreground">Provider ID:</span> {product.providerId}</div>
                  <div><span className="text-muted-foreground">Price range:</span> {product.priceRange ? `${product.currency ?? "₦"}${product.priceRange.min}–${product.priceRange.max}` : `${product.currency ?? "₦"}${product.price ?? "—"}`}</div>
                  <div><span className="text-muted-foreground">Rejection reason:</span> {product.rejectionReason ?? "—"}</div>
                  {product.description && (
                    <p className="whitespace-pre-wrap">{product.description}</p>
                  )}
                  {Array.isArray(product.tags) && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.tags.map((t: string) => (
                        <Badge key={t} variant="outline">{t}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>

      <Dialog open={!!action} onOpenChange={(o) => { if (!o) { setAction(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approved" ? "Approve" : action === "rejected" ? "Reject" : "Move to draft"} product
            </DialogTitle>
            <DialogDescription>
              {action === "rejected"
                ? "Provide a rejection reason."
                : "Confirm this status change."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={action === "rejected" ? "Reason for rejection (required)" : "Optional note"}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleAction} disabled={submitting || (action === "rejected" && !reason.trim())}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ProductDetailPage;