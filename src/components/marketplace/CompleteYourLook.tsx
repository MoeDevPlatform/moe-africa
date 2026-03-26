import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { Product, getProviderById, products as mockProducts } from "@/data/mockData";
import { productsService } from "@/lib/apiServices";

interface CompleteYourLookProps {
  currentProduct: Product;
}

const CompleteYourLook = ({ currentProduct }: CompleteYourLookProps) => {
  const navigate = useNavigate();

  const handleProductClick = (productId: number) => {
    navigate(`/marketplace/product/${productId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find complementary products based on style tags and different categories
  const getSuggestions = (): Product[] => {
    const currentTags = currentProduct.tags.map(t => t.toLowerCase());
    
    // Get products from different categories that share style tags
    const suggestions = products.filter(p => {
      // Exclude current product
      if (p.id === currentProduct.id) return false;
      // Prefer different categories for variety
      const isDifferentCategory = p.category !== currentProduct.category;
      // Check for tag overlap
      const hasMatchingTag = p.tags.some(tag => 
        currentTags.includes(tag.toLowerCase()) || 
        currentTags.some(ct => tag.toLowerCase().includes(ct) || ct.includes(tag.toLowerCase()))
      );
      return isDifferentCategory || hasMatchingTag;
    });
    
    // Sort by tag match count and return top 4
    return suggestions
      .sort((a, b) => {
        const aMatches = a.tags.filter(t => currentTags.includes(t.toLowerCase())).length;
        const bMatches = b.tags.filter(t => currentTags.includes(t.toLowerCase())).length;
        return bMatches - aMatches;
      })
      .slice(0, 4);
  };

  const suggestions = getSuggestions();

  if (suggestions.length === 0) return null;

  return (
    <section className="mt-12 border-t pt-10 pb-8 md:mt-16 md:pt-12">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-accent" />
        <h2 className="text-xl md:text-2xl font-display font-bold">Complete Your Look</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {suggestions.map((product) => {
          const provider = getProviderById(product.providerId);
          return (
            <Card 
              key={product.id} 
              className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
              onClick={() => handleProductClick(product.id)}
            >
              <div className="relative aspect-square bg-muted">
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
                  {product.category}
                </Badge>
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm line-clamp-1 mb-1">{product.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{provider?.brandName}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {product.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">
                    ₦{product.priceRange.min.toLocaleString()}+
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product.id);
                    }}
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default CompleteYourLook;
