import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Check, X, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  adminService,
  type AdminArtisanDetail,
  type ApprovalStatus,
} from "@/lib/apiServices";

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-4 py-2 border-b border-border/60 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="col-span-2 text-sm">{value ?? "—"}</span>
  </div>
);

const ArtisanDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<AdminArtisanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [action, setAction] = useState<ApprovalStatus | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = () => {
    if (!id) return;
    setIsLoading(true);
    adminService
      .getArtisan(Number(id))
      .then(setDetail)
      .catch((e: any) => {
        if (e?.status === 404) setNotFound(true);
        else toast.error(e?.message || "Failed to load artisan");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAction = async () => {
    if (!detail || !action) return;
    setSubmitting(true);
    try {
      await adminService.setArtisanStatus(
        detail.user.id,
        action,
        reason.trim() || undefined,
      );
      toast.success(`Artisan ${action}`);
      setAction(null);
      setReason("");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Status update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!detail) return;
    setSubmitting(true);
    try {
      await adminService.removeArtisan(
        detail.user.id,
        reason.trim() || undefined,
      );
      toast.success(
        `"${detail.artisanProfile.brandName}" deleted permanently`,
      );
      navigate("/admin/artisans");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete artisan");
    } finally {
      setSubmitting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/admin/artisans">
            <ArrowLeft className="h-4 w-4" /> Back to artisans
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : notFound ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">Artisan not found.</CardContent></Card>
        ) : detail ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold">
                  {detail.artisanProfile.brandName}
                </h1>
                <p className="text-muted-foreground">{detail.user.name} · {detail.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    detail.artisanProfile.status === "approved"
                      ? "default"
                      : detail.artisanProfile.status === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                  className="capitalize text-sm"
                >
                  {detail.artisanProfile.status}
                </Badge>
                {detail.artisanProfile.status !== "approved" && (
                  <Button onClick={() => setAction("approved")} className="gap-2">
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                )}
                {detail.artisanProfile.status !== "rejected" && (
                  <Button
                    variant="outline"
                    onClick={() => setAction("rejected")}
                    className="gap-2 text-destructive"
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => setConfirmDelete(true)}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Artisan profile</CardTitle></CardHeader>
                <CardContent>
                  <Row label="Brand" value={detail.artisanProfile.brandName} />
                  <Row label="Category" value={detail.artisanProfile.category} />
                  <Row label="City" value={detail.artisanProfile.city} />
                  <Row label="Rating" value={detail.artisanProfile.rating} />
                  <Row label="Reviews" value={detail.artisanProfile.reviewCount} />
                  <Row label="Rejection reason" value={detail.artisanProfile.rejectionReason} />
                  <Row
                    label="Created"
                    value={new Date(detail.artisanProfile.createdAt).toLocaleString()}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Business & user</CardTitle></CardHeader>
                <CardContent>
                  <Row label="Business name" value={detail.businessProfile?.businessName} />
                  <Row
                    label="Custom orders"
                    value={detail.businessProfile?.customOrdersEnabled ? "Enabled" : "Disabled"}
                  />
                  <Row
                    label="Rush orders"
                    value={detail.businessProfile?.rushOrderEnabled ? "Enabled" : "Disabled"}
                  />
                  <Row
                    label="Estimated delivery"
                    value={
                      detail.businessProfile?.estimatedDeliveryDays != null
                        ? `${detail.businessProfile.estimatedDeliveryDays} days`
                        : "—"
                    }
                  />
                  <Row label="Phone" value={detail.user.phone} />
                  <Row label="Products" value={detail.productCount} />
                  <Row label="Orders" value={detail.orderCount} />
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>

      <Dialog open={!!action} onOpenChange={(o) => { if (!o) { setAction(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "approved" ? "Approve" : "Reject"} artisan</DialogTitle>
            <DialogDescription>
              {action === "approved"
                ? "Confirm approval — the artisan will be visible to customers."
                : "Provide a reason for rejection."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={action === "rejected" ? "Reason for rejection (required)" : "Optional note"}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={submitting || (action === "rejected" && !reason.trim())}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmDelete}
        onOpenChange={(o) => {
          if (!o) {
            setConfirmDelete(false);
            setReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete "{detail?.artisanProfile.brandName}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the artisan account from the admin portal and
              marketplace. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional reason (audit)"
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default ArtisanDetailPage;