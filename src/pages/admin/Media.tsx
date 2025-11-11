import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Image as ImageIcon, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

const Media = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch media files
  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ['admin-media', searchQuery, filterType],
    queryFn: async () => {
      let query = supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('file_name', `%${searchQuery}%`);
      }

      if (filterType !== 'all') {
        query = query.eq('linked_entity_type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('media').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      toast.success("Media file deleted successfully");
      setIsDeleteOpen(false);
      setSelectedMedia(null);
    },
    onError: () => {
      toast.error("Failed to delete media file");
    },
  });

  const handleDelete = (media: any) => {
    setSelectedMedia(media);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedMedia) {
      deleteMutation.mutate(selectedMedia.id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300">
            <Plus className="mr-2 h-4 w-4" />
            Upload Media
          </Button>
        </div>

        {/* Filters - Responsive */}
        <div className="flex flex-col sm:flex-row gap-4">
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
            <SelectTrigger className="w-full sm:w-48">
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

        {/* Media Grid - Responsive */}
        {isLoading ? (
          <p className="text-center py-8">Loading media files...</p>
        ) : mediaFiles.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No media files found</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mediaFiles.map((media: any) => (
              <Card key={media.id} className="overflow-hidden border-border bg-card shadow-sm hover:shadow-md transition-all">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {media.file_url ? (
                    <img src={media.file_url} alt={media.file_name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-medium text-sm text-foreground truncate">
                      {media.file_name || 'Unnamed'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(media.file_size)} • {formatDate(media.created_at)}
                    </p>
                  </div>
                  
                  {media.linked_entity_type && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {media.linked_entity_type}
                      </Badge>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {media.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(media.file_url, '_blank')}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(media)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Upload Area - Responsive */}
        <Card className="border-2 border-dashed border-border bg-card/50">
          <div className="p-8 sm:p-12 text-center">
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
          </div>
        </Card>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedMedia?.file_name}? This action cannot be undone.
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

export default Media;
