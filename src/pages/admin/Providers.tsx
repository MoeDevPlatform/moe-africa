import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
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
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  const providers = [
    {
      id: 1,
      name: "Adanna Fabrics",
      category: "Tailoring",
      location: "Lagos, Nigeria",
      rating: 4.8,
      products: 34,
      status: "active",
      avatar: "AF",
    },
    {
      id: 2,
      name: "Kola Leatherworks",
      category: "Leather Goods",
      location: "Ibadan, Nigeria",
      rating: 4.9,
      products: 28,
      status: "active",
      avatar: "KL",
    },
    {
      id: 3,
      name: "Amara Crafts",
      category: "Home Decor",
      location: "Abuja, Nigeria",
      rating: 4.7,
      products: 41,
      status: "pending",
      avatar: "AC",
    },
    {
      id: 4,
      name: "Eze Furniture",
      category: "Furniture",
      location: "Port Harcourt, Nigeria",
      rating: 4.6,
      products: 19,
      status: "active",
      avatar: "EF",
    },
  ];

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

  const handleSubmit = (data: any) => {
    // API call would go here
    toast.success(selectedProvider ? "Provider updated successfully" : "Provider created successfully");
    setIsFormOpen(false);
    setSelectedProvider(null);
  };

  const confirmDelete = () => {
    // API call would go here
    toast.success("Provider deleted successfully");
    setIsDeleteOpen(false);
    setSelectedProvider(null);
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

        {/* Table View */}
        <Card className="border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-warm text-sm font-bold text-primary-foreground">
                        {provider.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {provider.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{provider.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {provider.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      <span>{provider.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>{provider.products}</TableCell>
                  <TableCell>
                    <Badge
                      variant={provider.status === "active" ? "default" : "secondary"}
                      className={
                        provider.status === "active"
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-accent-foreground"
                      }
                    >
                      {provider.status}
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
              ))}
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
