import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { getProductById } from "@/data/mockData";
import CustomizationFormModal from "@/components/marketplace/CustomizationFormModal";

const Wishlist = () => {
  const { items, removeItem } = useWishlist();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleRemove = (productId: number, productName: string) => {
    removeItem(productId);
    toast({
      title: "Removed from wishlist",
      description: `${productName} has been removed from your wishlist.`,
    });
  };

  const handleMoveToCart = (item: any) => {
    const product = getProductById(item.productId);
    if (product) {
      setSelectedItem(item);
      setShowCustomizationModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <h1 className="text-4xl font-display font-bold">My Wishlist</h1>
        </div>

        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Save your favorite items to buy them later</p>
            <Link to="/marketplace">
              <Button>Browse Marketplace</Button>
            </Link>
          </Card>
        ) : (
          <>
            <p className="text-muted-foreground mb-6">
              {items.length} {items.length === 1 ? "item" : "items"} saved
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Card key={item.productId} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="relative h-64 bg-muted">
                    <img 
                      src={item.imageUrl} 
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background"
                      onClick={() => handleRemove(item.productId, item.productName)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-display font-semibold text-lg mb-1 line-clamp-1">{item.productName}</h3>
                    <p className="text-sm text-muted-foreground mb-2">by {item.providerName}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.styleTags.slice(0, 2).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Starting from</p>
                        <p className="text-xl font-bold text-primary">
                          {item.currency === "NGN" ? "₦" : "$"}{item.priceRange.min.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 gap-2"
                        onClick={() => handleMoveToCart(item)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigate(`/marketplace/product/${item.productId}`)}
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <MarketplaceFooter />

      {/* Customization Modal */}
      {selectedItem && (
        <CustomizationFormModal
          open={showCustomizationModal}
          onOpenChange={(open) => {
            setShowCustomizationModal(open);
            if (!open) setSelectedItem(null);
          }}
          providerId={selectedItem.providerId}
          productId={selectedItem.productId}
          productName={selectedItem.productName}
          providerName={selectedItem.providerName}
          basePrice={selectedItem.priceRange.min}
          estimatedDeliveryDays={7}
          category={selectedItem.category as any}
        />
      )}
    </div>
  );
};

export default Wishlist;
