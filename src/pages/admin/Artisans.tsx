import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Check, X, Loader2, Eye, Trash2 } from "lucide-react";
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
  type AdminArtisanRow,
  type ApprovalStatus,
  type Pagination,
} from "@/lib/apiServices";

const statusVariant = (s: ApprovalStatus) =>
  s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";

type BulkStatusAction = { kind: "status"; next: ApprovalStatus };
type BulkDeleteAction = { kind: "delete" };
type BulkAction = BulkStatusAction | BulkDeleteAction;

const Artisans = () => {
  const [params, setParams] = useSearchParams();
  const initialStatus = (params.get("status") as ApprovalStatus | null) ?? "all";

  const [rows, setRows] = useState<AdminArtisanRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalPages: 1,
    totalItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">(initialStatus);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [actionRow, setActionRow] = useState<
    { row: AdminArtisanRow; next: ApprovalStatus } | null
  >(null);
  const [removeRow, setRemoveRow] = useState<AdminArtisanRow | null>(null);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = (page = 1, status: ApprovalStatus | "all" = statusFilter) => {
    setIsLoading(true);
    adminService
      .listArtisans({
        page,
        pageSize: 20,
        status: status === "all" ? undefined : status,
      })
      .then((res) => {
        setRows(res.data ?? []);
        setPagination(
          res.pagination ?? { page, pageSize: 20, totalPages: 1, totalItems: 0 },
        );
        setSelected(new Set());
      })
      .catch((e) => toast.error(e?.message || "Failed to load artisans"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (statusFilter === "all") params.delete("status");
    else params.set("status", statusFilter);
    setParams(params, { replace: true });
    load(1, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.name?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.brandName?.toLowerCase().includes(q) ||
          r.businessName?.toLowerCase().includes(q)
        );
      }),
    [rows, search],
  );

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const selectedCount = selected.size;

  const toggleOne = (id: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAllFiltered = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of filtered) {
        if (checked) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });
  };

  const handleAction = async () => {
    if (!actionRow) return;
    setIsSubmitting(true);
    try {
      await adminService.setArtisanStatus(
        actionRow.row.id,
        actionRow.next,
        reason.trim() || undefined,
      );
      toast.success(`Artisan ${actionRow.next}`);
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
    setIsSubmitting(true);
    try {
      await adminService.removeArtisan(removeRow.id, reason.trim() || undefined);
      toast.success(
        `"${removeRow.brandName || removeRow.name}" deleted permanently`,
      );
      setRemoveRow(null);
      setReason("");
      load(pagination.page, statusFilter);
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete artisan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulk = async () => {
    if (!bulkAction || selectedCount === 0) return;
    setIsSubmitting(true);
    const ids = [...selected];
    let ok = 0;
    let fail = 0;
    const note = reason.trim() || undefined;

    for (const id of ids) {
      try {
        if (bulkAction.kind === "delete") {
          await adminService.removeArtisan(id, note);
        } else {
          await adminService.setArtisanStatus(id, bulkAction.next, note);
        }
        ok += 1;
      } catch {
        fail += 1;
      }
    }

    if (ok) {
      toast.success(
        bulkAction.kind === "delete"
          ? `Deleted ${ok} artisan${ok === 1 ? "" : "s"}`
          : `Marked ${ok} artisan${ok === 1 ? "" : "s"} as ${bulkAction.next}`,
      );
    }
    if (fail) toast.error(`${fail} artisan${fail === 1 ? "" : "s"} failed`);

    setBulkAction(null);
    setReason("");
    setIsSubmitting(false);
    load(pagination.page, statusFilter);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Artisans</h1>
          <p className="mt-1 text-muted-foreground">
            Review, approve, reject, or permanently delete artisan accounts
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1 font-mono">GET /admin/artisans</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email or brand…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-input bg-card"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ApprovalStatus | "all")}
          >
            <SelectTrigger className="w-full sm:w-48 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-3">
            <span className="text-sm font-medium mr-2">
              {selectedCount} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setBulkAction({ kind: "status", next: "approved" })}
            >
              <Check className="h-4 w-4" /> Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-destructive"
              onClick={() => setBulkAction({ kind: "status", next: "rejected" })}
            >
              <X className="h-4 w-4" /> Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-destructive"
              onClick={() => setBulkAction({ kind: "delete" })}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </div>
        )}

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
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={(v) => toggleAllFiltered(v === true)}
                      aria-label="Select all on this page"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      No artisans match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id} data-state={selected.has(row.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(row.id)}
                          onCheckedChange={(v) => toggleOne(row.id, v === true)}
                          aria-label={`Select ${row.brandName || row.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.brandName || row.businessName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.status)} className="capitalize">
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="ghost">
                            <Link to={`/admin/artisans/${row.id}`}>
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
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-destructive hover:text-destructive"
                            onClick={() => setRemoveRow(row)}
                            aria-label={`Delete ${row.brandName || row.name}`}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </Button>
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
              {actionRow?.next === "approved" ? "Approve" : "Reject"}{" "}
              {actionRow?.row.brandName || actionRow?.row.name}
            </DialogTitle>
            <DialogDescription>
              {actionRow?.next === "approved"
                ? "The artisan will be able to publish products immediately."
                : "Provide a reason — it will be stored on the artisan profile."}
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

      <Dialog
        open={!!bulkAction}
        onOpenChange={(o) => {
          if (!o) {
            setBulkAction(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction?.kind === "delete"
                ? `Delete ${selectedCount} artisan${selectedCount === 1 ? "" : "s"}`
                : bulkAction?.kind === "status" && bulkAction.next === "approved"
                ? `Approve ${selectedCount} artisan${selectedCount === 1 ? "" : "s"}`
                : `Reject ${selectedCount} artisan${selectedCount === 1 ? "" : "s"}`}
            </DialogTitle>
            <DialogDescription>
              {bulkAction?.kind === "delete"
                ? "This permanently removes the selected artisan accounts and their marketplace presence. This cannot be undone."
                : bulkAction?.kind === "status" && bulkAction.next === "approved"
                ? "Selected artisans will become visible to customers."
                : "Provide a shared reason applied to every selected artisan."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              bulkAction?.kind === "status" && bulkAction.next === "rejected"
                ? "Reason for rejection (required)"
                : "Optional note"
            }
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkAction(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={bulkAction?.kind === "delete" ? "destructive" : "default"}
              onClick={handleBulk}
              disabled={
                isSubmitting ||
                (bulkAction?.kind === "status" &&
                  bulkAction.next === "rejected" &&
                  !reason.trim())
              }
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!removeRow}
        onOpenChange={(o) => {
          if (!o) {
            setRemoveRow(null);
            setReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete "{removeRow?.brandName || removeRow?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the artisan account from the admin portal and
              marketplace. Products owned by this artisan may also become unavailable.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional reason (audit)"
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRemove();
              }}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Artisans;
