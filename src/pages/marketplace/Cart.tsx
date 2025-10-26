import { Link } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Edit, Package } from "lucide-react";

const Cart = () => {
  // Mock cart items
  const cartItems = [
    {
      id: 1,
      productName: "Custom Ankara Jacket",
      providerName: "Ade Tailors",
      customization: "Slim fit, Size L, Blue & Gold pattern",
      price: 28000,
      deliveryDays: 7,
      imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200",
    },
    {
      id: 2,
      productName: "Leather Brogues",
      providerName: "Royal Shoes",
      customization: "Size 42, Brown leather",
      price: 35000,
      deliveryDays: 10,
      imageUrl: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=200",
    },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const deliveryFee = 2500;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-display font-bold mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
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
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <img 
                        src={item.imageUrl} 
                        alt={item.productName}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-display font-semibold mb-1">{item.productName}</h3>
                        <p className="text-sm text-muted-foreground mb-2">by {item.providerName}</p>
                        <p className="text-sm text-muted-foreground mb-3">{item.customization}</p>
                        <p className="text-xs text-muted-foreground">Estimated delivery: ~{item.deliveryDays} days</p>
                      </div>

                      <div className="text-right space-y-4">
                        <p className="text-2xl font-bold text-primary">₦{item.price.toLocaleString()}</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
    </div>
  );
};

export default Cart;
