import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MoreVertical, Calendar, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Orders = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const orders = [
    {
      id: "ORD-001",
      customer: "Chioma Okafor",
      product: "Custom Ankara Dress",
      provider: "Adanna Fabrics",
      amount: "₦45,000",
      date: "2025-10-20",
      status: "pending",
    },
    {
      id: "ORD-002",
      customer: "Ibrahim Suleiman",
      product: "Handcrafted Leather Bag",
      provider: "Kola Leatherworks",
      amount: "₦32,000",
      date: "2025-10-19",
      status: "approved",
    },
    {
      id: "ORD-003",
      customer: "Grace Nwosu",
      product: "Traditional Wall Art",
      provider: "Amara Crafts",
      amount: "₦18,000",
      date: "2025-10-19",
      status: "in-progress",
    },
    {
      id: "ORD-004",
      customer: "Taiwo Adeyemi",
      product: "Custom Mahogany Table",
      provider: "Eze Furniture",
      amount: "₦125,000",
      date: "2025-10-18",
      status: "pending",
    },
    {
      id: "ORD-005",
      customer: "Amina Bello",
      product: "Beaded Jewelry Set",
      provider: "Amara Crafts",
      amount: "₦15,000",
      date: "2025-10-18",
      status: "completed",
    },
    {
      id: "ORD-006",
      customer: "Emeka Okonkwo",
      product: "Bespoke Leather Shoes",
      provider: "Kola Leatherworks",
      amount: "₦55,000",
      date: "2025-10-17",
      status: "approved",
    },
  ];

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
            placeholder="Search orders by ID, customer, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-input bg-card"
          />
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="overflow-hidden border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Order Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-foreground">
                            {order.id}
                          </h3>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.replace("-", " ")}
                          </Badge>
                        </div>
                        <p className="mt-1 text-base font-medium text-foreground">
                          {order.product}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          by {order.provider}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{order.customer}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{order.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-display font-bold text-foreground">
                        {order.amount}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        {order.status === "pending" && (
                          <>
                            <DropdownMenuItem className="text-primary">
                              Approve Order
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Reject Order
                            </DropdownMenuItem>
                          </>
                        )}
                        {order.status === "approved" && (
                          <DropdownMenuItem>Mark In Progress</DropdownMenuItem>
                        )}
                        {order.status === "in-progress" && (
                          <DropdownMenuItem>Mark Complete</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Orders;
