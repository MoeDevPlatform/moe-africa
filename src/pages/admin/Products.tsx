import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Check, X, Loader2, Eye, FileText, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  adminService,
  type AdminProductRow,
  type ProductStatus,
  type Pagination,
} from "@/lib/apiServices";

const statusVariant = (s: ProductStatus) =>
  s === "approved"
    ? "default"
    : s === "rejected"
    ? "destructive"
    : s === "draft"
    ? "outline"
    : "secondary";

const Products = () => {
  const [params, setParams] = useSearchParams();
  const initialStatus = (params.get("status") as ProductStatus | null) ?? "all";

  const [rows, setRows] = useState<AdminProductRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalPages: 1,
    totalItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">(initialStatus);
  const [search, setSearch] = useState("");
  const [actionRow, setActionRow] = useState<
    { row: AdminProductRow; next: ProductStatus } | null
  >(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removeRow, setRemoveRow] = useState<AdminProductRow | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const load = (page = 1, status: ProductStatus | "all" = statusFilter) => {
    setIsLoading(true);
    adminService
      .listProducts({
        page,
        pageSize: 20,
        status: status === "all" ? undefined : status,
      })
      .then((res) => {
        setRows(res.data ?? []);
        setPagination(
          res.pagination ?? { page, pageSize: 20, totalPages: 1, totalItems: 0 },
        );
      })
      .catch((e: any) => toast.error(e?.message || "Failed to load products"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (statusFilter === "all") params.delete("status");
    else params.set("status", statusFilter);
    setParams(params, { replace: true });
    load(1, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = rows.filter((r) =>
    !search
      ? true
      : r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.artisan?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAction = async () => {
    if (!actionRow) return;
    setIsSubmitting(true);
    try {
      await adminService.setProductStatus(
        actionRow.row.id,
        actionRow.next,
        reason.trim() || undefined,
      );
      toast.success(`Product set to ${actionRow.next}`);
      setActionRow(null);
      setReason("");
      load(pagination.page, statusFilter);
    } catch (e: any) {
      toast.error(e?.message || "Status update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!removeRow) return;
    setIsRemoving(true);
    try {
      await adminService.removeProduct(removeRow.id);
      toast.success(`"${removeRow.name}" removed from the marketplace`);
      setRemoveRow(null);
      load(pagination.page, statusFilter);
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove product");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Products</h1>
          <p className="mt-1 text-muted-foreground">Approve, reject, or move products to draft</p>
          <p className="text-xs text-muted-foreground/60 mt-1 font-mono">GET /admin/products</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search product or artisan…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-input bg-card"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ProductStatus | "all")}
          >
            <SelectTrigger className="w-full sm:w-48 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Artisan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      No products match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        ₦{Number(row.price ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.artisan ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.status)} className="capitalize">
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild size="sm" variant="ghost">
                            <Link to={`/admin/products/${row.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {row.status !== "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => setActionRow({ row, next: "approved" })}
                            >
                              <Check className="h-4 w-4" /> Approve
                            </Button>
                          )}
                          {row.status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-destructive"
                              onClick={() => setActionRow({ row, next: "rejected" })}
                            >
                              <X className="h-4 w-4" /> Reject
                            </Button>
                          )}
                          {row.status !== "draft" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1"
                              onClick={() => setActionRow({ row, next: "draft" })}
                            >
                              <FileText className="h-4 w-4" /> Draft
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} total
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => load(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => load(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={!!actionRow}
        onOpenChange={(o) => {
          if (!o) {
            setActionRow(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionRow?.next === "approved"
                ? "Approve"
                : actionRow?.next === "rejected"
                ? "Reject"
                : "Move to draft"}{" "}
              {actionRow?.row.name}
            </DialogTitle>
            <DialogDescription>
              {actionRow?.next === "approved"
                ? "The product will be visible to customers immediately."
                : actionRow?.next === "rejected"
                ? "Provide a reason — it will be stored on the product."
                : "The product will be hidden from the public catalog."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              actionRow?.next === "rejected"
                ? "Reason for rejection (required)"
                : "Optional note"
            }
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionRow(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={
                isSubmitting ||
                (actionRow?.next === "rejected" && !reason.trim())
              }
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Products;