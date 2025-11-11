import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Orders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch orders with related data
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          product:products(id, name),
          service_provider:service_providers(id, brand_name),
          customer:profiles(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Update order status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success("Order status updated");
    },
    onError: () => {
      toast.error("Failed to update order");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-accent text-accent-foreground";
      case "approved":
        return "bg-primary text-primary-foreground";
      case "in-progress":
        return "bg-secondary text-secondary-foreground";
      case "completed":
        return "bg-primary-light text-primary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
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
              Orders
            </h1>
            <p className="mt-1 text-muted-foreground">
              Review and manage customer orders
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-input bg-card"
          />
        </div>

        {/* Orders List - Responsive */}
        {isLoading ? (
          <p className="text-center py-8">Loading orders...</p>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Card
                key={order.id}
                className="overflow-hidden border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Order Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <h3 className="text-base sm:text-lg font-semibold text-foreground">
                              {order.id.substring(0, 8)}...
                            </h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.replace("-", " ")}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm sm:text-base font-medium text-foreground">
                            {order.product?.name || 'Unknown Product'}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            by {order.service_provider?.brand_name || 'Unknown Provider'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="truncate">{order.customer?.full_name || order.customer?.email || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-left sm:text-right">
                        <p className="text-xl sm:text-2xl font-display font-bold text-foreground">
                          ₦{order.price_final?.toLocaleString()}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {order.status === "pending" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'approved' })}
                              >
                                Approve Order
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'rejected' })}
                              >
                                Reject Order
                              </DropdownMenuItem>
                            </>
                          )}
                          {order.status === "approved" && (
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'in-progress' })}
                            >
                              Mark In Progress
                            </DropdownMenuItem>
                          )}
                          {order.status === "in-progress" && (
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'completed' })}
                            >
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Orders;
