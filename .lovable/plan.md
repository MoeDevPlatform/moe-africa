

## Fix: ProductCard Null Safety with Better UX

### Changes to `src/components/marketplace/ProductCard.tsx`

**Lines 123-129** - Replace the entire price block with null-safe version:

```tsx
<div className="flex items-center justify-between">
  <div>
    {product.priceRange?.min != null ? (
      <>
        <p className="text-xs text-muted-foreground">Starting from</p>
        <p className="text-xl font-bold text-primary">
          {product.currency === "NGN" ? "₦" : "$"}{product.priceRange.min.toLocaleString()}
        </p>
      </>
    ) : (
      <p className="text-sm text-muted-foreground italic">Price on request</p>
    )}
  </div>
  
  <Button 
    size="sm" 
    variant="outline" 
    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
    onClick={(e) => {
      e.stopPropagation();
      navigate(`/marketplace/product/${product.id}`);
    }}
  >
    View Details
  </Button>
</div>
```

### Rationale

1. **No priceRange.max in render** - The component only displays `min`, not `max`. The `priceRange` object is passed to the wishlist (line 40) but that's just data passing, not display formatting.

2. **Better UX for missing price** - When `min` is null, hide the "Starting from" label entirely and show "Price on request" instead. This avoids the awkward "Starting from —" combo.

3. **Currency symbol guard** - Moved inside the conditional so it only renders when a price exists.

4. **Line count** - Single edit of lines 123-129, preserving all existing styling and button logic.

