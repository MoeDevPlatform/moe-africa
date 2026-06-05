import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  productReviewsService,
  type ProductReview,
  type MyProductReview,
} from "@/lib/apiServices";

interface ProductReviewsProps {
  productId: number;
  /** Artisan profile id that owns the product (from Product.providerId). */
  productOwnerProfileId: number;
}

const MAX_REVIEW_LENGTH = 500;
const PAGE_SIZE = 5;

const StarRow = ({
  value,
  size = "h-4 w-4",
  interactive = false,
  onChange,
}: {
  value: number;
  size?: string;
  interactive?: boolean;
  onChange?: (v: number) => void;
}) => {
  return (
    <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const cls = filled ? "fill-accent text-accent" : "text-muted-foreground/40";
        if (interactive) {
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={n === Math.round(value)}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => onChange?.(n)}
              className="p-0.5 hover:scale-110 transition-transform"
            >
              <Star className={`${size} ${cls}`} />
            </button>
          );
        }
        return <Star key={n} className={`${size} ${cls}`} />;
      })}
    </div>
  );
};

const ProductReviews = ({ productId, productOwnerProfileId }: ProductReviewsProps) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [mine, setMine] = useState<MyProductReview | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ownership check: user.artisanProfile.id maps to product.providerId
  // (the artisan profile id). user.id is the user id and would never match
  // — that's why we use the profile id explicitly.
  const isProductOwner =
    !!user?.artisanProfile?.id &&
    user.artisanProfile.id === productOwnerProfileId;
  const canWriteReview =
    isAuthenticated && user?.role === "customer" && !isProductOwner;

  const loadPage = useCallback(
    async (p: number, append: boolean) => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      const res = await productReviewsService.list(productId, p, PAGE_SIZE);
      setAverageRating(res.averageRating);
      setTotalReviews(res.totalReviews);
      setTotalPages(res.pagination.totalPages);
      setReviews((prev) => (append ? [...prev, ...res.data] : res.data));
      setPage(p);
      if (append) setIsLoadingMore(false);
      else setIsLoading(false);
    },
    [productId],
  );

  const loadMine = useCallback(async () => {
    if (!canWriteReview) {
      setMine(null);
      return;
    }
    const m = await productReviewsService.mine(productId);
    setMine(m);
    if (m) {
      setRating(m.rating);
      setReviewText(m.review ?? "");
    }
  }, [productId, canWriteReview]);

  useEffect(() => {
    loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) return;
    if (reviewText.length > MAX_REVIEW_LENGTH) return;
    setIsSubmitting(true);
    try {
      const payload = {
        rating,
        review: reviewText.trim() || undefined,
      };
      if (mine) {
        await productReviewsService.update(productId, payload);
      } else {
        await productReviewsService.submit(productId, payload);
      }
      toast({ title: "Review submitted!", description: "Thanks for sharing your experience." });
      await Promise.all([loadPage(1, false), loadMine()]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit review.";
      toast({ title: "Could not submit review", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRelative = (iso: string) => {
    try {
      return formatDistanceToNow(new Date(iso), { addSuffix: true });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pb-6 border-b">
        {totalReviews > 0 ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">/ 5</span>
            </div>
            <div className="flex flex-col gap-1">
              <StarRow value={averageRating} size="h-5 w-5" />
              <p className="text-sm text-muted-foreground">
                Based on {totalReviews} review{totalReviews === 1 ? "" : "s"}
              </p>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">
            No reviews yet. Be the first to review this product.
          </p>
        )}
      </div>

      {/* Review list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length > 0 ? (
        <ul className="space-y-6">
          {reviews.map((r) => (
            <li key={r.id} className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-semibold">{r.reviewerName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatRelative(r.createdAt)}
                </span>
              </div>
              <StarRow value={r.rating} />
              {r.review && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {r.review}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {!isLoading && page < totalPages && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => loadPage(page + 1, true)}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…
              </>
            ) : (
              "Show more reviews"
            )}
          </Button>
        </div>
      )}

      {/* Write a review */}
      {canWriteReview && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-display font-semibold text-lg">
                {mine ? "Update Your Review" : "Leave a Review"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Share your experience with this product.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" id="review-rating-label">
                Your rating
              </label>
              <div aria-labelledby="review-rating-label">
                <StarRow
                  value={rating}
                  size="h-7 w-7"
                  interactive
                  onChange={setRating}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Textarea
                placeholder="Share your experience with this product..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={MAX_REVIEW_LENGTH}
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">
                {reviewText.length}/{MAX_REVIEW_LENGTH}
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={rating < 1 || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : mine ? (
                "Update Review"
              ) : (
                "Submit Review"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductReviews;