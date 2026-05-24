import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Check, X, Loader2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [actionRow, setActionRow] = useState<
    { row: AdminArtisanRow; next: ApprovalStatus } | null
  >(null);
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

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.brandName?.toLowerCase().includes(q) ||
      r.businessName?.toLowerCase().includes(q)
    );
  });

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Artisans</h1>
          <p className="mt-1 text-muted-foreground">Review and approve artisan accounts</p>
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
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      No artisans match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
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
    </AdminLayout>
  );
};

export default Artisans;