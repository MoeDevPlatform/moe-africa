import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreVertical, FolderTree, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Textarea } from "@/components/ui/textarea";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { toast } from "sonner";

const categoryIcons: Record<string, string> = {
  tailoring: "👔",
  shoemaking: "👞",
  beauty: "💄",
  leatherwork: "👜",
  accessories: "💍",
  furniture: "🪑",
  art: "🏺",
  crafts: "🎨",
  jewelry: "💎",
};

const categoryColors: Record<string, string> = {
  tailoring: "bg-primary/10",
  shoemaking: "bg-secondary/10",
  beauty: "bg-accent/10",
  leatherwork: "bg-primary/10",
  accessories: "bg-secondary/10",
  furniture: "bg-accent/10",
  art: "bg-primary/10",
  crafts: "bg-secondary/10",
  jewelry: "bg-accent/10",
};

const Categories = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "", slug: "", icon: "", enabled: true });

  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setSelected(null);
    setFormData({ name: "", description: "", slug: "", icon: "", enabled: true });
    setIsFormOpen(true);
  };

  const handleEdit = (cat: any) => {
    setSelected(cat);
    setFormData({
      name: cat.name,
      description: cat.description || "",
      slug: cat.slug || "",
      icon: cat.icon || "",
      enabled: cat.enabled,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
        icon: formData.icon || null,
        enabled: formData.enabled,
      };
      if (selected) {
        await updateCategory.mutateAsync({ id: selected.id, ...payload });
        toast.success("Category updated successfully");
      } else {
        await createCategory.mutateAsync(payload);
        toast.success("Category created successfully");
      }
      setIsFormOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteCategory.mutateAsync(selected.id);
      toast.success("Category deleted successfully");
      setIsDeleteOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const toggleEnabled = async (cat: any) => {
    try {
      await updateCategory.mutateAsync({ id: cat.id, enabled: !cat.enabled });
      toast.success(`Category ${!cat.enabled ? "enabled" : "disabled"}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Categories</h1>
            <p className="mt-1 text-muted-foreground">Organize products into categories</p>
            <p className="text-xs text-muted-foreground/60 mt-1 font-mono">GET /service-categories</p>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300"
            onClick={handleCreate}
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
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FolderTree className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No categories found. Create your first category.</p>
          </div>
        ) : (
          /* Categories Grid */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((category) => {
              const icon = category.icon || categoryIcons[category.slug || ""] || "📦";
              const color = categoryColors[category.slug || ""] || "bg-primary/10";
              return (
                <Card
                  key={category.id}
                  className="overflow-hidden border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${color} text-3xl transition-transform duration-300 group-hover:scale-110`}>
                          {icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
                            {!category.enabled && (
                              <Badge variant="secondary" className="text-xs">Disabled</Badge>
                            )}
                          </div>
                          {category.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
                          )}
                          {category.slug && (
                            <p className="text-xs text-muted-foreground/60 font-mono mt-1">/{category.slug}</p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(category)}>
                            Edit Category
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleEnabled(category)}>
                            {category.enabled ? "Disable" : "Enable"} Category
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => { setSelected(category); setIsDeleteOpen(true); }}
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
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected ? "Edit Category" : "Create Category"}</DialogTitle>
            <DialogDescription>
              {selected ? "Update this service category." : "Add a new service category to the marketplace."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Tailoring" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Slug</Label>
                <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="e.g., tailoring" />
              </div>
              <div className="space-y-1">
                <Label>Icon (emoji)</Label>
                <Input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="e.g., 👔" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Enabled (visible in marketplace)</Label>
              <Switch checked={formData.enabled} onCheckedChange={(v) => setFormData({ ...formData, enabled: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || createCategory.isPending || updateCategory.isPending}
            >
              {(createCategory.isPending || updateCategory.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selected ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selected?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Categories;
