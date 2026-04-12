

## Fix: CustomizationFormModal Null Safety for category

### Problem
Line 67 crashes when `category` is null: `category.toLowerCase()` throws `TypeError: can't access property "toLowerCase", category is null`

### Solution
Add null-safe fallbacks on lines 67 and 138:

**Line 67** - Guard the isShoemaking check:
```tsx
const isShoemaking = (category ?? "").toLowerCase().includes("shoe");
```

**Line 138** - Ensure category has a valid value for the cart item:
```tsx
category: (category ?? "tailoring") as "tailoring" | "shoemaking",
```

### Rationale
1. **Default to tailoring flow** - When category is null/undefined, `(category ?? "")` becomes `""`, which doesn't contain "shoe", so `isShoemaking` is false. This safely defaults to the tailoring (non-shoe) customization flow.

2. **Cart item safety** - The cart item needs a valid category string. Using `"tailoring"` as the fallback ensures type safety and sensible defaults.

3. **No other changes needed** - All other usages (stepTitles, canProceed, conditional rendering, ReviewStep props) derive from `isShoemaking`, which is now safely false when category is null.

### File Modified
- `src/components/marketplace/CustomizationFormModal.tsx` (lines 67, 138)

