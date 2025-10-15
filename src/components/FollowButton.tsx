import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, UserMinus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FollowButtonProps {
  targetUserId: string;
  targetHandle: string;
}

export const FollowButton = ({ targetUserId, targetHandle }: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUserId && targetUserId) {
      checkFollowStatus();
    }
  }, [currentUserId, targetUserId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUserId(session?.user?.id || null);
  };

  const checkFollowStatus = async () => {
    if (!currentUserId) return;

    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow users",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    if (isFollowing) {
      // Unfollow
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to unfollow user",
          variant: "destructive"
        });
      } else {
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You unfollowed @${targetHandle}`
        });
      }
    } else {
      // Follow
      const { error } = await supabase
        .from("follows")
        .insert({
          follower_id: currentUserId,
          following_id: targetUserId
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to follow user",
          variant: "destructive"
        });
      } else {
        setIsFollowing(true);
        toast({
          title: "Following",
          description: `You are now following @${targetHandle}`
        });
      }
    }

    setLoading(false);
  };

  // Don't show button if viewing own profile
  if (currentUserId === targetUserId) {
    return null;
  }

  return (
    <Button
      onClick={handleFollow}
      disabled={loading}
      variant={isFollowing ? "outline" : "default"}
      size="sm"
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
};