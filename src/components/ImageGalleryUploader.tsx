import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImageItem {
  url: string;
  caption: string;
  order: number;
}

interface ImageGalleryUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  bucketName: string;
  maxImages?: number;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
}

export const ImageGalleryUploader = ({
  images,
  onChange,
  bucketName,
  maxImages = 10,
  uploading,
  setUploading,
}: ImageGalleryUploaderProps) => {
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    const uploadedImages: ImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: `${file.name} is not an image`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 5MB`,
          variant: "destructive",
        });
        continue;
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast({
          title: "Upload failed",
          description: `Could not upload ${file.name}`,
          variant: "destructive",
        });
        continue;
      }

      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      uploadedImages.push({
        url: data.publicUrl,
        caption: "",
        order: images.length + uploadedImages.length,
      });
    }

    onChange([...images, ...uploadedImages]);
    setUploading(false);

    if (uploadedImages.length > 0) {
      toast({
        title: "Success",
        description: `${uploadedImages.length} image(s) uploaded`,
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // Reorder
    newImages.forEach((img, i) => {
      img.order = i;
    });
    onChange(newImages);
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const newImages = [...images];
    newImages[index].caption = caption;
    onChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    // Reorder
    newImages.forEach((img, i) => {
      img.order = i;
    });
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="gallery-upload" className="cursor-pointer">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Click to upload images
            </p>
            <p className="text-xs text-muted-foreground">
              Max {maxImages} images, up to 5MB each ({images.length}/{maxImages})
            </p>
          </div>
          <Input
            id="gallery-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            disabled={uploading || images.length >= maxImages}
            className="hidden"
          />
        </Label>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group border rounded-lg overflow-hidden"
            >
              <div className="aspect-video bg-muted">
                <img
                  src={image.url}
                  alt={image.caption || `Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="cursor-move"
                    onMouseDown={(e) => {
                      // Simple reorder on click - move up or down
                      e.preventDefault();
                    }}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <Input
                    type="text"
                    placeholder="Caption (optional)"
                    value={image.caption}
                    onChange={(e) => handleCaptionChange(index, e.target.value)}
                    className="flex-1 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveImage(index)}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveImage(index, Math.max(0, index - 1))}
                    disabled={index === 0}
                    className="text-xs"
                  >
                    ← Move Up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveImage(index, Math.min(images.length - 1, index + 1))}
                    disabled={index === images.length - 1}
                    className="text-xs"
                  >
                    Move Down →
                  </Button>
                </div>

                {index === 0 && (
                  <span className="text-xs text-primary font-medium">
                    Featured Image
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
