import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ZoomIn, ZoomOut, RotateCw, X, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

const ProductImageGallery = ({ images, productName }: ProductImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  // Embla carousel for swipe support
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev();
      setSelectedIndex(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
      setSelectedIndex(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index);
      setSelectedIndex(index);
    }
  }, [emblaApi]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || !isHovering) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const resetView = () => {
    setZoom(100);
    setRotation(0);
  };

  return (
    <div className="space-y-4">
      {/* Main Image Carousel */}
      <div className="relative">
        <div 
          ref={emblaRef}
          className="overflow-hidden rounded-2xl"
        >
          <div className="flex">
            {images.map((image, index) => (
              <div 
                key={index}
                className="flex-[0_0_100%] min-w-0"
              >
                <div 
                  ref={index === selectedIndex ? imageContainerRef : null}
                  className="relative aspect-square bg-muted cursor-zoom-in group"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  onMouseMove={handleMouseMove}
                  onClick={() => setShowFullscreen(true)}
                >
                  <img 
                    src={image} 
                    alt={`${productName} - View ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-200"
                    style={{
                      transform: isHovering && index === selectedIndex ? `scale(1.5)` : 'scale(1)',
                      transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg opacity-80 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                scrollPrev();
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg opacity-80 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                scrollNext();
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
        
        {/* Fullscreen Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4 opacity-70 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setShowFullscreen(true);
          }}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>

        {/* Zoom indicator */}
        {isHovering && (
          <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
            Swipe or use arrows • Click for fullscreen
          </div>
        )}
        
        {/* Image counter */}
        <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
          {selectedIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted transition-all",
              selectedIndex === index 
                ? "ring-2 ring-primary ring-offset-2" 
                : "opacity-60 hover:opacity-100"
            )}
          >
            <img 
              src={image} 
              alt={`${productName} thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background/95 backdrop-blur-xl">
          <DialogTitle className="sr-only">{productName} - Full View</DialogTitle>
          
          {/* Controls */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(50, zoom - 25))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="w-32">
                <Slider
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                  min={50}
                  max={200}
                  step={10}
                />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium min-w-[40px] text-center">{zoom}%</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="icon" className="h-8 w-8" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" className="h-8 w-8" onClick={resetView}>
                Reset
              </Button>
              <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setShowFullscreen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="flex items-center justify-center h-[80vh] overflow-auto p-8">
            <img 
              src={images[selectedIndex]} 
              alt={`${productName} - Full View`}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              }}
            />
          </div>

          {/* Thumbnail Strip */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "w-12 h-12 rounded-md overflow-hidden transition-all",
                  selectedIndex === index 
                    ? "ring-2 ring-primary" 
                    : "opacity-50 hover:opacity-100"
                )}
              >
                <img 
                  src={image} 
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductImageGallery;
