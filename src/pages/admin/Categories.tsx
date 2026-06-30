import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, MoreVertical, Tag, Loader2 } from "lucide-react";
import { CATEGORY_ICON_MAP, getCategoryIcon, type CategoryDef } from "@/lib/categories";
import { useCategories } from "@/contexts/CategoriesContext";
import { productsService, categoriesService, AdminCategory } from "@/lib/apiServices";
import { useToast } from "@/hooks/use-toast";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Row = {
  // Stable id: backend id for dynamic rows, slug for canonical seeds.
  id: string;
  // Backend id, null for canonical-only seeds.
  backendId: string | null;
  slug: string;
  label: string;
  icon: CategoryDef["icon"] | null;
  isSeed: boolean;
  products: number | null;
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const Categories = () => {
  const { toast } = useToast();
  const { categories: contextCategories, refetchCategories } = useCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [serverCats, setServerCats] = useState<AdminCategory[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formIconKey, setFormIconKey] = useState("Package");
  const [formOrder, setFormOrder] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation.
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (contextCategories.length === 0) return;
    let cancelled = false;
    Promise.all(
      contextCategories.map(async (c) => {
        try {
          const r = await productsService.list({ category: c.value, pageSize: 1 });
          return [c.value, r.pagination?.totalItems ?? 0] as const;
        } catch {
          return [c.value, 0] as const;
        }
      }),
    ).then((pairs) => {
      if (cancelled) return;
      setCounts(Object.fromEntries(pairs));
    });
    return () => { cancelled = true; };
  }, [contextCategories]);

  const loadServerCats = async () => {
    const list = await categoriesService.list();
    setServerCats(list);
  };

  useEffect(() => {
    loadServerCats();
  }, []);

  const palette = ["bg-primary/10", "bg-secondary/10", "bg-accent/10"];

  // Merge canonical seeds with backend rows. Server rows win on slug collision
  // (e.g. so admins can rename "Tailoring" → "Custom Tailoring").
  const rows: Row[] = useMemo(() => {
    const bySlug = new Map<string, Row>();
    contextCategories.forEach((c) => {
      bySlug.set(c.value, {
        id: c.id ?? c.value,
        backendId: c.id ?? null,
        slug: c.value,
        label: c.label,
        icon: c.icon ?? getCategoryIcon(c.iconKey),
        isSeed: false,
        products: counts[c.value] ?? null,
      });
    });
    serverCats.forEach((s) => {
      const seed = bySlug.get(s.slug);
      bySlug.set(s.slug, {
        id: s.id,
        backendId: s.id,
        slug: s.slug,
        label: s.label,
        icon: seed?.icon ?? getCategoryIcon(s.icon),
        isSeed: s.isSeed ?? seed?.isSeed ?? false,
        products: s.productCount ?? seed?.products ?? 0,
      });
    });
    const q = searchQuery.trim().toLowerCase();
    return Array.from(bySlug.values()).filter((r) =>
      q ? r.label.toLowerCase().includes(q) || r.slug.includes(q) : true,
    );
  }, [serverCats, counts, searchQuery, contextCategories]);

  const previewSlug = slugify(formLabel);

  const openAdd = () => {
    setEditing(null);
    setFormLabel("");
    setFormIconKey("Package");
    setFormOrder("");
    setDialogOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setFormLabel(row.label);
    setFormIconKey("Package");
    setFormOrder("");
    setDialogOpen(true);
  };

  const submitForm = async () => {
    const label = formLabel.trim();
    if (!label) {
      toast({ title: "Name required", description: "Enter a category name.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        if (editing.backendId) {
          await categoriesService.update(editing.backendId, {
            label,
            icon: formIconKey,
            ...(formOrder ? { sortOrder: Number(formOrder) } : {}),
          });
        } else {
          await categoriesService.create({
            label,
            slug: editing.slug,
            icon: formIconKey,
            ...(formOrder ? { order: Number(formOrder) } : {}),
          });
        }
        toast({ title: "Category updated" });
      } else {
        await categoriesService.create({
          label,
          slug: previewSlug,
          icon: formIconKey,
          ...(formOrder ? { order: Number(formOrder) } : {}),
        });
        toast({ title: "Category added" });
      }
      setDialogOpen(false);
      await loadServerCats();
      await refetchCategories();
    } catch (e) {
      toast({
        title: "Could not save category",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (!pendingDelete.backendId) {
        throw new Error("This category cannot be deleted because artisans or products are currently assigned to it.");
      }
      if ((pendingDelete.products ?? 0) > 0) {
        throw new Error("This category cannot be deleted because artisans or products are currently assigned to it.");
      }
      await categoriesService.remove(pendingDelete.backendId);
      toast({ title: "Category deleted" });
      setPendingDelete(null);
      await loadServerCats();
      await refetchCategories();
    } catch (e) {
      toast({
        title: "Could not delete",
        description: e instanceof Error ? e.message : "This category cannot be deleted because artisans or products are currently assigned to it.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Categories
            </h1>
            <p className="mt-1 text-muted-foreground">
              Organize products into categories
            </p>
          </div>
          <Button
            onClick={openAdd}
            aria-label="Add category"
            className="bg-primary text-primary-foreground hover:bg-primary-dark shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-input bg-card"
            aria-label="Search categories"
          />
        </div>

        {/* Categories Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((category, idx) => {
            const Icon = category.icon ?? Tag;
            const color = palette[idx % palette.length];
            return (
            <Card
              key={category.id}
              className="overflow-hidden border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer group"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${color} text-3xl transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="h-7 w-7 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {category.label}
                      </h3>
                      {category.products === null ? (
                        <div className="mt-1 h-4 w-20 rounded bg-muted animate-pulse" aria-label="Loading product count" />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {category.products} {category.products === 1 ? "product" : "products"}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${category.label}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(category)}>
                        Edit Category
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        disabled={category.isSeed && !category.backendId}
                        onClick={() => setPendingDelete(category)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the category name shown across the marketplace."
                : "Create a new top-level category. The slug is auto-generated from the name."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-label">Label</Label>
              <Input
                id="cat-label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="e.g. Home & Decor"
                autoFocus
              />
            </div>
            {!editing && previewSlug && (
              <p className="text-xs text-muted-foreground">
                Slug preview: <code>{previewSlug}</code>
              </p>
            )}
            <div className="space-y-2">
              <Label>Icon Key</Label>
              <Select value={formIconKey} onValueChange={setFormIconKey}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CATEGORY_ICON_MAP).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-order">Display Order (optional)</Label>
              <Input
                id="cat-order"
                type="number"
                value={formOrder}
                onChange={(e) => setFormOrder(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submitForm} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.isSeed
                ? "This is a built-in category and cannot be deleted."
                : `"${pendingDelete?.label}" will be removed from the marketplace. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting || (pendingDelete?.isSeed ?? false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Categories;
