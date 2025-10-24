import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface ImageItem {
  url: string;
  caption?: string;
  order?: number;
}

interface ImageGalleryViewerProps {
  images: ImageItem[];
  featuredImage?: string;
}

export const ImageGalleryViewer = ({ images, featuredImage }: ImageGalleryViewerProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  // Combine featured + gallery images
  const allImages = featuredImage 
    ? [{ url: featuredImage, caption: "Featured", order: -1 }, ...images]
    : images;

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    setSelectedIndex((prev) => 
      prev === null ? null : (prev - 1 + allImages.length) % allImages.length
    );
  };

  const goToNext = () => {
    setSelectedIndex((prev) => 
      prev === null ? null : (prev + 1) % allImages.length
    );
  };

  if (allImages.length === 0) return null;

  return (
    <>
      <div className="space-y-4">
        {/* Featured/Main Image */}
        <div 
          className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => openLightbox(0)}
        >
          <img
            src={allImages[0].url}
            alt={allImages[0].caption || "Featured image"}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Thumbnail Strip */}
        {allImages.length > 1 && (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {allImages.slice(1).map((image, index) => (
              <div
                key={index + 1}
                className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity border-2 border-transparent hover:border-primary"
                onClick={() => openLightbox(index + 1)}
              >
                <img
                  src={image.url}
                  alt={image.caption || `Image ${index + 2}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Navigation Buttons */}
            {allImages.length > 1 && selectedIndex !== null && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

            {/* Image */}
            {selectedIndex !== null && (
              <div className="w-full h-full flex flex-col items-center justify-center p-8">
                <img
                  src={allImages[selectedIndex].url}
                  alt={allImages[selectedIndex].caption || `Image ${selectedIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
                {allImages[selectedIndex].caption && (
                  <p className="text-white text-center mt-4 text-lg">
                    {allImages[selectedIndex].caption}
                  </p>
                )}
                <p className="text-white/60 text-sm mt-2">
                  {selectedIndex + 1} / {allImages.length}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
