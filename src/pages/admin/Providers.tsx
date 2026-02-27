import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreVertical, MapPin, Star, Eye, Edit, Trash2, Loader2, CheckCircle, Award } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProviderForm from "@/components/admin/ProviderForm";
import { useAllProviders, useUpdateProvider, useDeleteProvider, ServiceProvider } from "@/hooks/useProviders";
import { toast } from "sonner";

const Providers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);

  const { data: providers = [], isLoading } = useAllProviders();
  const updateProvider = useUpdateProvider();
  const deleteProvider = useDeleteProvider();

  const filtered = providers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.service_categories as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => { setSelectedProvider(null); setIsFormOpen(true); };
  const handleEdit = (p: ServiceProvider) => { setSelectedProvider(p); setIsFormOpen(true); };
  const handleView = (p: ServiceProvider) => { setSelectedProvider(p); setIsDetailOpen(true); };
  const handleDelete = (p: ServiceProvider) => { setSelectedProvider(p); setIsDeleteOpen(true); };

  const confirmDelete = async () => {
    if (!selectedProvider) return;
    try {
      await deleteProvider.mutateAsync(selectedProvider.id);
      toast.success("Provider deleted successfully");
      setIsDeleteOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSubmit = () => {
    setIsFormOpen(false);
    setSelectedProvider(null);
  };

  const toggleFeatured = async (p: ServiceProvider) => {
    try {
      await updateProvider.mutateAsync({ id: p.id, featured: !p.featured });
      toast.success(`Provider ${!p.featured ? "marked as featured" : "removed from featured"}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleVerified = async (p: ServiceProvider) => {
    try {
      await updateProvider.mutateAsync({ id: p.id, verified: !p.verified });
      toast.success(`Provider ${!p.verified ? "verified" : "unverified"}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Service Providers</h1>
            <p className="mt-1 text-muted-foreground">Manage artisans and their profiles</p>
            <p className="text-xs text-muted-foreground/60 mt-1 font-mono">GET /service-providers</p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search providers by name, category, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-input bg-card"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Badges</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No providers found. Add your first provider.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-warm flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0">
                            {provider.logo_url
                              ? <img src={provider.logo_url} alt={provider.name} className="w-full h-full object-cover" />
                              : provider.name.slice(0, 2).toUpperCase()
                            }
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{provider.name}</p>
                            <p className="text-xs text-muted-foreground">{provider.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{(provider.service_categories as any)?.name || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {[provider.city, provider.state].filter(Boolean).join(", ") || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-accent text-accent" />
                          <span>{provider.rating ?? "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {provider.featured && <Badge className="bg-accent text-accent-foreground text-xs"><Award className="h-3 w-3 mr-1" />Featured</Badge>}
                          {provider.verified && <Badge className="bg-primary text-primary-foreground text-xs"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={provider.status === "active" ? "default" : "secondary"}
                          className={provider.status === "active" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}
                        >
                          {provider.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(provider)}><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(provider)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleFeatured(provider)}>
                              <Award className="h-4 w-4 mr-2" />
                              {provider.featured ? "Remove Featured" : "Mark Featured"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleVerified(provider)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {provider.verified ? "Remove Verified" : "Mark Verified"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(provider)}>
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedProvider ? "Edit Provider" : "Create New Provider"}</SheetTitle>
            <SheetDescription>
              {selectedProvider ? "Update provider information and settings" : "Add a new service provider to the marketplace"}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ProviderForm
              provider={selectedProvider as any}
              onSubmit={handleSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Provider Details</SheetTitle>
            <SheetDescription>View complete provider information</SheetDescription>
          </SheetHeader>
          {selectedProvider && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-gradient-warm flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {selectedProvider.logo_url
                    ? <img src={selectedProvider.logo_url} alt={selectedProvider.name} className="w-full h-full object-cover" />
                    : selectedProvider.name.slice(0, 2).toUpperCase()
                  }
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-display font-bold">{selectedProvider.name}</h3>
                    {selectedProvider.verified && <CheckCircle className="h-5 w-5 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{(selectedProvider.service_categories as any)?.name || "—"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
                  <p className="text-sm font-medium mt-1">{[selectedProvider.city, selectedProvider.state].filter(Boolean).join(", ") || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Contact</p>
                  <p className="text-sm font-medium mt-1">{selectedProvider.email}</p>
                  <p className="text-sm font-medium">{selectedProvider.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Rating</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="text-sm font-medium">{selectedProvider.rating ?? "—"}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                  <Badge variant={selectedProvider.status === "active" ? "default" : "secondary"} className="mt-1">
                    {selectedProvider.status}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-mono pt-4 border-t">
                GET /service-providers/{selectedProvider.id}
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProvider?.name}"? This action cannot be undone and will remove all associated products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
          <p className="text-xs text-muted-foreground font-mono mt-4">
            DELETE /service-providers/{selectedProvider?.id}
          </p>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Providers;
