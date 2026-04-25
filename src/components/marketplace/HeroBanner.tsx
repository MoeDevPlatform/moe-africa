import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import womanThrift from "@/assets/uploads/woman-thrift.jpg";
import africanShoppers from "@/assets/uploads/african-shoppers.jpg";
import secondhandMarket from "@/assets/uploads/secondhand-market.jpg";

interface Banner {
  id: number;
  imageUrl: string;
  title: string;
  description?: string;
  link?: string;
}

const mockBanners: Banner[] = [
  {
    id: 1,
    imageUrl: womanThrift,
    title: "New Collection - Traditional Kente",
    description: "Discover authentic African craftsmanship",
  },
  {
    id: 2,
    imageUrl: africanShoppers,
    title: "Summer Deals - Up to 40% Off",
    description: "Limited time offers on custom tailoring",
  },
  {
    id: 3,
    imageUrl: secondhandMarket,
    title: "Handcrafted Leather Shoes",
    description: "Premium quality, made to order",
  },
];

const HeroBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % mockBanners.length);
  }, []);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + mockBanners.length) % mockBanners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  return (
    <div className="relative w-full h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden rounded-xl bg-muted group">
      {/* Banner Images */}
      <div className="relative h-full w-full">
        {mockBanners.map((banner, index) => (
          <div
            key={banner.id}
            className={cn(
              "absolute inset-0 transition-all duration-500 ease-in-out",
              index === currentIndex 
                ? "opacity-100 translate-x-0" 
                : index < currentIndex 
                ? "opacity-0 -translate-x-full"
                : "opacity-0 translate-x-full"
            )}
          >
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12 text-white">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold mb-2 md:mb-3 drop-shadow-lg">
                {banner.title}
              </h2>
              {banner.description && (
                <p className="text-sm md:text-lg lg:text-xl drop-shadow-md max-w-2xl">
                  {banner.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 md:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-foreground" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 md:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-foreground" />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3">
        {mockBanners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300",
              index === currentIndex 
                ? "bg-white w-6 md:w-8" 
                : "bg-white/50 hover:bg-white/75"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;
