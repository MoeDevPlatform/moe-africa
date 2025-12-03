import { useState } from "react";
import { Star, ThumbsUp, CheckCircle, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface Review {
  id: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  date: Date;
  comment: string;
  images?: string[];
  verifiedPurchase: boolean;
  helpful: number;
}

interface CustomerReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizes[size],
            star <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
};

const ReviewCard = ({ review, onImageClick }: { review: Review; onImageClick: (images: string[], index: number) => void }) => {
  const [isHelpful, setIsHelpful] = useState(false);

  return (
    <div className="border-b pb-6 last:border-b-0">
      <div className="flex items-start gap-4">
        <Avatar className="h-10 w-10">
          {review.authorAvatar && <AvatarImage src={review.authorAvatar} />}
          <AvatarFallback className="bg-primary/10 text-primary">
            {review.authorName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{review.authorName}</span>
              {review.verifiedPurchase && (
                <Badge variant="outline" className="text-xs gap-1">
                  <CheckCircle className="h-3 w-3 text-primary" />
                  Verified Purchase
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {review.date.toLocaleDateString("en-NG", { 
                year: "numeric", 
                month: "short", 
                day: "numeric" 
              })}
            </span>
          </div>
          
          <StarRating rating={review.rating} />
          
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {review.comment}
          </p>
          
          {review.images && review.images.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {review.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => onImageClick(review.images!, index)}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity"
                >
                  <img src={image} alt={`Review image ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-4 mt-4">
            <Button
              variant="ghost"
              size="sm"
              className={cn("text-xs gap-1", isHelpful && "text-primary")}
              onClick={() => setIsHelpful(!isHelpful)}
            >
              <ThumbsUp className={cn("h-3 w-3", isHelpful && "fill-primary")} />
              Helpful ({review.helpful + (isHelpful ? 1 : 0)})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RatingBar = ({ stars, count, total }: { stars: number; count: number; total: number }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-8">{stars}★</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-muted-foreground text-right">{count}</span>
    </div>
  );
};

const CustomerReviews = ({ reviews, averageRating, totalReviews }: CustomerReviewsProps) => {
  const [sortBy, setSortBy] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedImages, setSelectedImages] = useState<{ images: string[]; index: number } | null>(null);

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b.date.getTime() - a.date.getTime();
      case "highest":
        return b.rating - a.rating;
      case "helpful":
        return b.helpful - a.helpful;
      default:
        return 0;
    }
  });

  const visibleReviews = sortedReviews.slice(0, visibleCount);

  return (
    <div className="mt-12 pt-8 border-t">
      <h2 className="text-2xl font-display font-bold mb-6">Customer Reviews</h2>
      
      {/* Rating Summary */}
      <div className="flex flex-col md:flex-row gap-8 mb-8 p-6 bg-muted/50 rounded-xl">
        <div className="text-center md:text-left md:pr-8 md:border-r">
          <div className="text-5xl font-bold mb-2">{averageRating.toFixed(1)}</div>
          <StarRating rating={Math.round(averageRating)} size="lg" />
          <p className="text-sm text-muted-foreground mt-2">{totalReviews} reviews</p>
        </div>
        
        <div className="flex-1 space-y-2">
          {ratingDistribution.map(({ stars, count }) => (
            <RatingBar key={stars} stars={stars} count={count} total={totalReviews} />
          ))}
        </div>
      </div>
      
      {/* Sort & Filter */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{reviews.length} reviews</p>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="highest">Highest Rating</SelectItem>
            <SelectItem value="helpful">Most Helpful</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Reviews List */}
      <div className="space-y-6">
        {visibleReviews.length > 0 ? (
          visibleReviews.map((review) => (
            <ReviewCard 
              key={review.id} 
              review={review} 
              onImageClick={(images, index) => setSelectedImages({ images, index })}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No reviews yet. Be the first to review!</p>
          </div>
        )}
      </div>
      
      {/* Load More */}
      {visibleCount < reviews.length && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((prev) => prev + 5)}
            className="gap-2"
          >
            <ChevronDown className="h-4 w-4" />
            Load More Reviews
          </Button>
        </div>
      )}

      {/* Image Modal */}
      <Dialog open={!!selectedImages} onOpenChange={() => setSelectedImages(null)}>
        <DialogContent className="max-w-3xl p-0 bg-background/95 backdrop-blur-xl">
          {selectedImages && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10"
                onClick={() => setSelectedImages(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={selectedImages.images[selectedImages.index]}
                alt="Review image"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              {selectedImages.images.length > 1 && (
                <div className="flex justify-center gap-2 p-4">
                  {selectedImages.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImages({ ...selectedImages, index: idx })}
                      className={cn(
                        "w-12 h-12 rounded overflow-hidden",
                        idx === selectedImages.index ? "ring-2 ring-primary" : "opacity-50"
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerReviews;
