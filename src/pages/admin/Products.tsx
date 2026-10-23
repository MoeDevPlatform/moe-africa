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
import { Search, Check, X, Loader2, Eye, FileText, Trash2, Plus, ImagePlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/contexts/CategoriesContext";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import type { AdminArtisanRow } from "@/lib/apiServices";
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
  UPLOAD_ACCEPT_ATTR,
  UPLOAD_MAX_BYTES,
  type AdminProductRow,
  type ProductStatus,
  type Pagination,
} from "@/lib/apiServices";
import ProductVariationsEditor from "@/components/artisan/ProductVariationsEditor";
import type { ProductVariationTypeDef } from "@/lib/productVariations";

const MAX_ADMIN_IMAGES = 5;
const ADMIN_UPLOAD_MAX = 2 * 1024 * 1024; // matches BE multer product limit

type UploadedImage = { url: string; name: string; previewUrl: string };

const statusVariant = (s: ProductStatus) =>
  s === "approved"
    ? "default"
    : s === "rejected"
    ? "destructive"
    : s === "draft"
    ? "outline"
    : "secondary";

type BulkStatusAction = { kind: "status"; next: ProductStatus };
type BulkDeleteAction = { kind: "delete" };
type BulkAction = BulkStatusAction | BulkDeleteAction;

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
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [actionRow, setActionRow] = useState<
    { row: AdminProductRow; next: ProductStatus } | null
  >(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removeRow, setRemoveRow] = useState<AdminProductRow | null>(null);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [artisanOptions, setArtisanOptions] = useState<AdminArtisanRow[]>([]);
  useCategories();
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    category: "",
    priceMin: "",
    priceMax: "",
    estimatedDelivery: "",
    artisanId: "",
  });
  const [variationTypes, setVariationTypes] = useState<ProductVariationTypeDef[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [imageError, setImageError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!addOpen) return;
    adminService
      .listArtisans({ pageSize: 100, status: "approved" })
      .then((res) => setArtisanOptions(res.data ?? []))
      .catch(() => setArtisanOptions([]));
  }, [addOpen]);

  const resetAddForm = () => {
    setProductForm({
      name: "",
      description: "",
      category: "",
      priceMin: "",
      priceMax: "",
      estimatedDelivery: "",
      artisanId: "",
    });
    setVariationTypes([]);
    images.forEach((i) => {
      if (i.previewUrl.startsWith("blob:")) URL.revokeObjectURL(i.previewUrl);
    });
    setImages([]);
    setImageError("");
  };

  const handleImageSelect = async (files: FileList | null) => {
    if (!files?.length) return;
    setImageError("");
    const remaining = MAX_ADMIN_IMAGES - images.length;
    if (remaining <= 0) {
      setImageError(`You can upload up to ${MAX_ADMIN_IMAGES} images.`);
      return;
    }
    const batch = Array.from(files).slice(0, remaining);
    setIsUploading(true);
    try {
      for (const file of batch) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          setImageError("Only JPEG, PNG or WebP images are allowed");
          continue;
        }
        if (file.size > ADMIN_UPLOAD_MAX) {
          setImageError("Image must be 2MB or smaller");
          continue;
        }
        if (file.size > UPLOAD_MAX_BYTES) {
          setImageError("Image is too large");
          continue;
        }
        const previewUrl = URL.createObjectURL(file);
        const { url } = await adminService.uploadProductImage(file);
        setImages((prev) => [...prev, { url, name: file.name, previewUrl }]);
      }
    } catch (e: unknown) {
      setImageError(e instanceof Error ? e.message : "Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const handleAddProduct = async () => {
    if (!productForm.name.trim() || !productForm.artisanId || !productForm.estimatedDelivery.trim()) {
      toast.error("Name, artisan, and estimated delivery are required");
      return;
    }
    setAdding(true);
    try {
      const imageUrls = images.map((i) => i.url).filter(Boolean);
      const payload: Record<string, unknown> = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        category: productForm.category || undefined,
        priceMin: Number(productForm.priceMin) || 0,
        estimatedDelivery: productForm.estimatedDelivery.trim(),
        artisanId: Number(productForm.artisanId),
      };
      if (productForm.priceMax) {
        payload.priceMax = Number(productForm.priceMax);
      }
      if (imageUrls.length > 0) {
        payload.images = imageUrls;
      }
      if (variationTypes.length > 0) {
        payload.variationTypes = variationTypes;
      }

      await adminService.createProduct(payload);
      toast.success(<span data-testid="success-toast">Product created</span>);
      setAddOpen(false);
      resetAddForm();
      load(pagination.page, statusFilter);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create product");
    } finally {
      setAdding(false);
    }
  };

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
        setSelected(new Set());
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

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        !search
          ? true
          : r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.artisan?.toLowerCase().includes(search.toLowerCase()),
      ),
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
    setIsSubmitting(true);
    try {
      await adminService.removeProduct(removeRow.id, reason.trim() || undefined);
      toast.success(`"${removeRow.name}" removed from the marketplace`);
      setRemoveRow(null);
      setReason("");
      load(pagination.page, statusFilter);
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove product");
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
          await adminService.removeProduct(id, note);
        } else {
          await adminService.setProductStatus(id, bulkAction.next, note);
        }
        ok += 1;
      } catch {
        fail += 1;
      }
    }

    if (ok) {
      toast.success(
        bulkAction.kind === "delete"
          ? `Deleted ${ok} product${ok === 1 ? "" : "s"}`
          : `Marked ${ok} product${ok === 1 ? "" : "s"} as ${bulkAction.next}`,
      );
    }
    if (fail) toast.error(`${fail} product${fail === 1 ? "" : "s"} failed`);

    setBulkAction(null);
    setReason("");
    setIsSubmitting(false);
    load(pagination.page, statusFilter);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Products</h1>
            <p className="mt-1 text-muted-foreground">
              Approve, reject, draft, or permanently delete products — including in bulk
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 font-mono">GET /admin/products</p>
          </div>
          <Button data-testid="add-product-btn" onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
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
              className="gap-1"
              onClick={() => setBulkAction({ kind: "status", next: "draft" })}
            >
              <FileText className="h-4 w-4" /> Draft
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-destructive"
              onClick={() => setBulkAction({ kind: "delete" })}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      No products match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id} data-state={selected.has(row.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(row.id)}
                          onCheckedChange={(v) => toggleOne(row.id, v === true)}
                          aria-label={`Select ${row.name}`}
                        />
                      </TableCell>
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
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-destructive hover:text-destructive"
                            onClick={() => setRemoveRow(row)}
                            aria-label={`Delete ${row.name}`}
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
                ? `Delete ${selectedCount} product${selectedCount === 1 ? "" : "s"}`
                : bulkAction?.kind === "status"
                ? `${
                    bulkAction.next === "approved"
                      ? "Approve"
                      : bulkAction.next === "rejected"
                      ? "Reject"
                      : "Draft"
                  } ${selectedCount} product${selectedCount === 1 ? "" : "s"}`
                : "Bulk action"}
            </DialogTitle>
            <DialogDescription>
              {bulkAction?.kind === "delete"
                ? "This permanently removes the selected products from the marketplace, storefronts, search, and wishlists. This cannot be undone."
                : bulkAction?.kind === "status" && bulkAction.next === "approved"
                ? "Selected products will become visible to customers."
                : bulkAction?.kind === "status" && bulkAction.next === "rejected"
                ? "Provide a shared reason applied to every selected product."
                : "Selected products will be hidden from the public catalog."}
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
            <AlertDialogTitle>Delete "{removeRow?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the product from the marketplace, the artisan's storefront,
              search, wishlists, and all other surfaces. This action cannot be undone.
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

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetAddForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add product</DialogTitle>
            <DialogDescription>POST /admin/products for an artisan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Artisan</Label>
              <Select
                value={productForm.artisanId}
                onValueChange={(v) => setProductForm({ ...productForm, artisanId: v })}
              >
                <SelectTrigger data-testid="admin-product-artisan">
                  <SelectValue placeholder="Select artisan" />
                </SelectTrigger>
                <SelectContent>
                  {artisanOptions.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.brandName ?? a.businessName ?? a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-name">Product name</Label>
              <Input
                id="prod-name"
                name="name"
                data-testid="admin-product-name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-desc">Description</Label>
              <Textarea
                id="prod-desc"
                data-testid="admin-product-description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={productForm.category}
                onValueChange={(v) => setProductForm({ ...productForm, category: v })}
              >
                <SelectTrigger data-testid="admin-product-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Min price (₦)</Label>
                <Input
                  type="number"
                  data-testid="admin-product-price-min"
                  value={productForm.priceMin}
                  onChange={(e) => setProductForm({ ...productForm, priceMin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max price (₦)</Label>
                <Input
                  type="number"
                  data-testid="admin-product-price-max"
                  value={productForm.priceMax}
                  onChange={(e) => setProductForm({ ...productForm, priceMax: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-eta">Estimated delivery</Label>
              <Input
                id="prod-eta"
                name="estimatedDelivery"
                data-testid="admin-product-eta"
                placeholder="e.g. 7 days"
                value={productForm.estimatedDelivery}
                onChange={(e) => setProductForm({ ...productForm, estimatedDelivery: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-product-images">Product images</Label>
              <label
                htmlFor="admin-product-images"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
              >
                <ImagePlus className="h-6 w-6" />
                <input
                  id="admin-product-images"
                  data-testid="admin-product-images"
                  type="file"
                  accept={UPLOAD_ACCEPT_ATTR}
                  multiple
                  className="sr-only"
                  disabled={isUploading || images.length >= MAX_ADMIN_IMAGES || adding}
                  onChange={(e) => {
                    void handleImageSelect(e.target.files);
                    e.target.value = "";
                  }}
                />
                {isUploading
                  ? "Uploading…"
                  : images.length >= MAX_ADMIN_IMAGES
                    ? `Maximum of ${MAX_ADMIN_IMAGES} images reached`
                    : "Click to select images (JPEG/PNG/WebP, max 2MB)"}
              </label>
              {imageError ? (
                <p className="text-sm text-destructive" data-testid="admin-product-image-error">
                  {imageError}
                </p>
              ) : null}
              {images.length > 0 ? (
                <div className="flex flex-wrap gap-2" data-testid="admin-product-image-previews">
                  {images.map((img, idx) => (
                    <div key={`${img.url}-${idx}`} className="relative h-16 w-16 overflow-hidden rounded border">
                      <img src={img.previewUrl || img.url} alt={img.name} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-0.5 top-0.5 rounded bg-background/90 px-1 text-xs"
                        aria-label={`Remove ${img.name}`}
                        onClick={() => removeImage(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <ProductVariationsEditor
              category={productForm.category}
              value={variationTypes}
              onChange={setVariationTypes}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                resetAddForm();
              }}
              disabled={adding || isUploading}
            >
              Cancel
            </Button>
            <Button
              data-testid="admin-product-create-submit"
              onClick={() => void handleAddProduct()}
              disabled={adding || isUploading}
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Products;
