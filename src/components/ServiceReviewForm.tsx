import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ServiceReviewFormProps {
  serviceId: string;
  serviceRequestId: string;
  sellerProfileId: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
  };
  onSuccess: () => void;
}

export const ServiceReviewForm = ({
  serviceId,
  serviceRequestId,
  sellerProfileId,
  existingReview,
  onSuccess,
}: ServiceReviewFormProps) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (existingReview) {
        const { error } = await supabase
          .from("service_reviews")
          .update({
            rating,
            comment: comment.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingReview.id);

        if (error) throw error;
        toast({ title: "Review updated successfully!" });
      } else {
        const { error } = await supabase
          .from("service_reviews")
          .insert({
            service_id: serviceId,
            service_request_id: serviceRequestId,
            reviewer_id: user.id,
            seller_profile_id: sellerProfileId,
            rating,
            comment: comment.trim() || null,
          });

        if (error) throw error;
        toast({ title: "Review submitted successfully!" });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Your Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Comment (Optional)
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this service..."
          maxLength={2000}
          rows={4}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {comment.length}/2000 characters
        </p>
      </div>

      <Button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting
          ? "Submitting..."
          : existingReview
          ? "Update Review"
          : "Submit Review"}
      </Button>
    </div>
  );
};
