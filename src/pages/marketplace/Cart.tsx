import { useState } from "react";
import { Link } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Edit, Package } from "lucide-react";
import CustomizationFormModal from "@/components/marketplace/CustomizationFormModal";
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
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { getProductById } from "@/data/mockData";

const Cart = () => {
  const { toast } = useToast();
  const { items, removeItem, getTotalPrice } = useCart();
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  
  const handleEditItem = (item: any) => {
    const product = getProductById(item.productId);
    if (product) {
      setEditingItem(item);
      setShowCustomizationModal(true);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    removeItem(itemId);
    setDeleteItemId(null);
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart.",
    });
  };

  const subtotal = getTotalPrice();
  const deliveryFee = 2500;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-display font-bold mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Start browsing to add items to your cart</p>
            <Link to="/marketplace">
              <Button>Browse Marketplace</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const product = getProductById(item.productId);
                return (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <img 
                        src={product?.images[0] || ""} 
                        alt={item.productName}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-display font-semibold mb-1">{item.productName}</h3>
                        <p className="text-sm text-muted-foreground mb-3">by {item.providerName}</p>
                        
                        <div className="space-y-1 mb-3">
                          {item.selectedSize && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Size:</span> <strong>{item.selectedSize}</strong>
                            </p>
                          )}
                          {item.selectedBodyType && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Body Type:</span> <strong>{item.selectedBodyType}</strong>
                            </p>
                          )}
                          {Object.keys(item.selectedVariants).length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {Object.values(item.selectedVariants).join(", ")}
                            </p>
                          )}
                          {Object.keys(item.measurements).length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {Object.entries(item.measurements).map(([key, value]) => `${key}: ${value}`).join(", ")}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 bg-muted rounded">Base: ₦{item.basePrice.toLocaleString()}</span>
                          {item.finalPrice > item.basePrice && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                              Customization: +₦{(item.finalPrice - item.basePrice).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right space-y-4">
                        <p className="text-2xl font-bold text-primary">₦{item.finalPrice.toLocaleString()}</p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditItem(item)}
                          >
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setDeleteItemId(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-xl font-display font-bold mb-6">Order Summary</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>₦{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery Fee</span>
                      <span>₦{deliveryFee.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">₦{total.toLocaleString()}</span>
                    </div>
                  </div>

                  <Link to="/marketplace/checkout">
                    <Button className="w-full mb-3 bg-primary hover:bg-primary-dark">
                      Proceed to Checkout
                    </Button>
                  </Link>
                  
                  <Link to="/marketplace">
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <MarketplaceFooter />

      {/* Edit Item Modal */}
      {editingItem && (
        <CustomizationFormModal
          open={showCustomizationModal}
          onOpenChange={(open) => {
            setShowCustomizationModal(open);
            if (!open) setEditingItem(null);
          }}
          providerId={editingItem.providerId}
          productId={editingItem.productId}
          productName={editingItem.productName}
          providerName={editingItem.providerName}
          basePrice={editingItem.basePrice}
          estimatedDeliveryDays={7}
          category={editingItem.category}
          existingCustomization={editingItem}
          editingCartItemId={editingItem.id}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteItemId !== null} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from your cart? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItemId && handleDeleteItem(deleteItemId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Cart;

