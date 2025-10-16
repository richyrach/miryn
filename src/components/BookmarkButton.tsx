import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface BookmarkButtonProps {
  targetType: "project" | "service" | "profile";
  targetId: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

export const BookmarkButton = ({ 
  targetType, 
  targetId, 
  variant = "ghost",
  size = "sm"
}: BookmarkButtonProps) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkBookmarkStatus();
  }, [targetId]);

  const checkBookmarkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("bookmarks" as any)
      .select("id")
      .eq("user_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .maybeSingle();

    setIsBookmarked(!!data);
  };

  const toggleBookmark = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark items",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("target_type", targetType)
          .eq("target_id", targetId);

        if (error) throw error;
        setIsBookmarked(false);
        toast({ title: "Removed from bookmarks" });
      } else {
        const { error } = await supabase.from("bookmarks" as any).insert({
          user_id: user.id,
          target_type: targetType,
          target_id: targetId,
        });

        if (error) throw error;
        setIsBookmarked(true);
        toast({ title: "Added to bookmarks" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleBookmark}
      disabled={loading}
    >
      <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
      {size !== "icon" && <span className="ml-2">{isBookmarked ? "Saved" : "Save"}</span>}
    </Button>
  );
};
