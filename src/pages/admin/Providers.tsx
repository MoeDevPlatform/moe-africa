import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreVertical, MapPin, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Providers = () => {
  const [searchQuery, setSearchQuery] = useState("");

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
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary-dark shadow-md hover:shadow-lg transition-all duration-300">
            <Plus className="mr-2 h-4 w-4" />
            Add Provider
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search providers by name, category, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-input bg-card"
          />
        </div>

        {/* Providers Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <Card
              key={provider.id}
              className="overflow-hidden border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-warm text-lg font-bold text-primary-foreground">
                      {provider.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {provider.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {provider.category}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Provider</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {provider.location}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="text-sm font-medium text-foreground">
                        {provider.rating}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {provider.products} products
                    </span>
                  </div>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Providers;
