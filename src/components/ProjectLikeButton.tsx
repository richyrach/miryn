import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ProjectLikeButtonProps {
  projectId: string;
  onLikeChange?: (liked: boolean, newCount: number) => void;
}

export const ProjectLikeButton = ({ projectId, onLikeChange }: ProjectLikeButtonProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchLikeStatus();
    }
  }, [projectId, currentUserId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUserId(session?.user?.id || null);
  };

  const fetchLikeStatus = async () => {
    // Get like count
    const { data: reactions } = await supabase
      .from("project_reactions")
      .select("id")
      .eq("project_id", projectId);

    setLikeCount(reactions?.length || 0);

    // Check if current user liked
    if (currentUserId) {
      const { data: userReaction } = await supabase
        .from("project_reactions")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", currentUserId)
        .maybeSingle();

      setLiked(!!userReaction);
    }
  };

  const handleLike = async () => {
    if (!currentUserId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like projects",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    if (liked) {
      // Unlike
      const { error } = await supabase
        .from("project_reactions")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", currentUserId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to unlike project",
          variant: "destructive"
        });
      } else {
        const newCount = likeCount - 1;
        setLiked(false);
        setLikeCount(newCount);
        onLikeChange?.(false, newCount);
      }
    } else {
      // Like
      const { error } = await supabase
        .from("project_reactions")
        .insert({
          project_id: projectId,
          user_id: currentUserId,
          reaction_type: 'like'
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to like project",
          variant: "destructive"
        });
      } else {
        const newCount = likeCount + 1;
        setLiked(true);
        setLikeCount(newCount);
        onLikeChange?.(true, newCount);
      }
    }

    setLoading(false);
  };

  return (
    <Button
      onClick={handleLike}
      disabled={loading}
      variant={liked ? "default" : "outline"}
      size="sm"
      className="gap-2"
    >
      <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
      {likeCount > 0 && <span>{likeCount}</span>}
    </Button>
  );
};