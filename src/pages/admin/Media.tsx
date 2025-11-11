import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Image as ImageIcon, Trash2, Download, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const Media = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  const mediaFiles = [
    {
      id: 1,
      url: "https://cdn.moe.africa/products/ankara-jacket.webp",
      type: "image/webp",
      entity: "product",
      entityId: 101,
      name: "ankara-jacket.webp",
      size: "2.3 MB",
      uploadedAt: "2025-10-20",
    },
    {
      id: 2,
      url: "https://cdn.moe.africa/providers/ade-logo.webp",
      type: "image/webp",
      entity: "provider",
      entityId: 32,
      name: "ade-logo.webp",
      size: "512 KB",
      uploadedAt: "2025-10-18",
    },
    {
      id: 3,
      url: "https://cdn.moe.africa/products/leather-bag.webp",
      type: "image/webp",
      entity: "product",
      entityId: 102,
      name: "leather-bag.webp",
      size: "1.8 MB",
      uploadedAt: "2025-10-19",
    },
    {
      id: 4,
      url: "https://cdn.moe.africa/products/traditional-art.webp",
      type: "image/webp",
      entity: "product",
      entityId: 103,
      name: "traditional-art.webp",
      size: "3.1 MB",
      uploadedAt: "2025-10-21",
    },
  ];

  const handleDelete = (media: any) => {
    setSelectedMedia(media);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    toast.success("Media file deleted successfully");
    setIsDeleteOpen(false);
    setSelectedMedia(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Media Manager
            </h1>
            <p className="mt-1 text-muted-foreground">
              Upload and manage images and files
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
              GET /media
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300">
            <Plus className="mr-2 h-4 w-4" />
            Upload Media
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search media files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-input bg-card"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="product">Product Images</SelectItem>
              <SelectItem value="provider">Provider Logos</SelectItem>
              <SelectItem value="category">Category Images</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Media Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mediaFiles.map((media) => (
            <Card key={media.id} className="overflow-hidden border-border bg-card shadow-sm hover:shadow-md transition-all">
              <div className="aspect-square bg-muted flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground" />
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="font-medium text-sm text-foreground truncate">
                    {media.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {media.size} • {media.uploadedAt}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {media.entity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ID: {media.entityId}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(media)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground/60 font-mono truncate">
                  GET /media/{media.id}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Upload Area */}
        <Card className="border-2 border-dashed border-border bg-card/50">
          <div className="p-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Upload Media Files
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop files here or click to browse
            </p>
            <Button variant="outline">
              Choose Files
            </Button>
            <p className="text-xs text-muted-foreground mt-4 font-mono">
              POST /media/upload
            </p>
          </div>
        </Card>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedMedia?.name}? This action cannot be undone.
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
            DELETE /media/{selectedMedia?.id}
          </p>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Media;
