import { ImageGalleryViewer } from "./ImageGalleryViewer";

interface ProjectGalleryProps {
  coverUrl?: string;
  galleryImages?: Array<{ url: string; caption?: string; order?: number }>;
}

export const ProjectGallery = ({ coverUrl, galleryImages = [] }: ProjectGalleryProps) => {
  // Don't render if there's no cover image and no gallery images
  if (!coverUrl && galleryImages.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <ImageGalleryViewer 
        featuredImage={coverUrl} 
        images={galleryImages} 
      />
    </div>
  );
};
