import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreVertical, MapPin, Star, Eye, Edit, Trash2 } from "lucide-react";
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
import { toast } from "sonner";

const Providers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch providers
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['admin-providers', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('service_providers')
        .select(`
          *,
          service_category:service_categories(id, name)
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`brand_name.ilike.%${searchQuery}%,address_city.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_providers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      toast.success("Provider deleted successfully");
      setIsDeleteOpen(false);
      setSelectedProvider(null);
    },
    onError: () => {
      toast.error("Failed to delete provider");
    },
  });

  const handleCreate = () => {
    setSelectedProvider(null);
    setIsFormOpen(true);
  };

  const handleEdit = (provider: any) => {
    setSelectedProvider(provider);
    setIsFormOpen(true);
  };

  const handleView = (provider: any) => {
    setSelectedProvider(provider);
    setIsDetailOpen(true);
  };

  const handleDelete = (provider: any) => {
    setSelectedProvider(provider);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedProvider) {
        const { error } = await supabase
          .from('service_providers')
          .update(data)
          .eq('id', selectedProvider.id);
        if (error) throw error;
        toast.success("Provider updated successfully");
      } else {
        const { error } = await supabase.from('service_providers').insert(data);
        if (error) throw error;
        toast.success("Provider created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      setIsFormOpen(false);
      setSelectedProvider(null);
    } catch (error) {
      toast.error("Operation failed");
      console.error(error);
    }
  };

  const confirmDelete = () => {
    if (selectedProvider) {
      deleteMutation.mutate(selectedProvider.id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Service Providers
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage artisans and their profiles
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
              GET /service-providers
            </p>
          </div>
          <Button 
            onClick={handleCreate}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search providers by name, category, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-input bg-card"
            />
          </div>
        </div>

        {/* Table View - Responsive */}
        <Card className="border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="hidden sm:table-cell">Rating</TableHead>
                <TableHead className="hidden xl:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading providers...
                  </TableCell>
                </TableRow>
              ) : providers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No providers found
                  </TableCell>
                </TableRow>
              ) : (
                providers.map((provider: any) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-warm text-sm font-bold text-primary-foreground">
                          {provider.brand_name?.substring(0, 2).toUpperCase() || "??"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{provider.brand_name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {provider.address_city}, {provider.address_state}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {provider.service_category?.name || 'N/A'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {provider.address_city}, {provider.address_state}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        <span>{provider.rating || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Badge
                        variant={provider.enabled ? "default" : "secondary"}
                        className={
                          provider.enabled
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-accent-foreground"
                        }
                      >
                        {provider.enabled ? 'active' : 'inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(provider)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(provider)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(provider)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedProvider ? "Edit Provider" : "Create New Provider"}
            </SheetTitle>
            <SheetDescription>
              {selectedProvider
                ? "Update provider information and settings"
                : "Add a new service provider to the marketplace"}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ProviderForm
              provider={selectedProvider}
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
            <SheetDescription>
              View complete provider information
            </SheetDescription>
          </SheetHeader>
          {selectedProvider && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-warm text-2xl font-bold text-primary-foreground">
                  {selectedProvider.avatar}
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold">{selectedProvider.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProvider.category}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
                  <p className="text-sm font-medium mt-1">{selectedProvider.location}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Rating</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="text-sm font-medium">{selectedProvider.rating}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Products</p>
                  <p className="text-sm font-medium mt-1">{selectedProvider.products} listed</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                  <Badge
                    variant={selectedProvider.status === "active" ? "default" : "secondary"}
                    className="mt-1"
                  >
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
              Are you sure you want to delete {selectedProvider?.name}? This action cannot be undone
              and will remove all associated products.
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
          <p className="text-xs text-muted-foreground font-mono mt-4">
            DELETE /service-providers/{selectedProvider?.id}
          </p>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Providers;
