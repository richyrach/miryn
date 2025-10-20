import { useState, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ProjectCommentCard } from "./ProjectCommentCard";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  user_id: string;
  profiles: {
    display_name: string;
    handle: string;
    avatar_url: string | null;
    user_id: string;
  };
}

interface ProjectCommentSectionProps {
  projectId: string;
  isAdmin: boolean;
}

export const ProjectCommentSection = ({
  projectId,
  isAdmin,
}: ProjectCommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchComments();

    const channel = supabase
      .channel(`project_comments_${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_comments",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
    setIsAuthenticated(!!user);
  };

  const fetchComments = async () => {
    // Fetch comments without join
    const { data: commentsData, error: commentsError } = await supabase
      .from("project_comments")
      .select("id, content, created_at, updated_at, edited_at, user_id")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      return;
    }

    if (!commentsData || commentsData.length === 0) {
      setComments([]);
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(commentsData.map(c => c.user_id))];

    // Fetch profiles for those users
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, display_name, handle, avatar_url")
      .in("user_id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return;
    }

    // Create a map of user_id to profile
    const profileMap = new Map(
      (profilesData || []).map(p => [p.user_id, p])
    );

    // Merge comments with profile data
    const enrichedComments = commentsData.map(comment => ({
      ...comment,
      profiles: profileMap.get(comment.user_id) || {
        display_name: "Unknown User",
        handle: "unknown",
        avatar_url: null,
      },
    }));

    setComments(enrichedComments as any);
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("project_comments").insert({
        project_id: projectId,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      toast({ title: "Comment posted!" });
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

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("project_comments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", commentId);

      if (error) throw error;

      toast({ title: "Comment deleted" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (commentId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from("project_comments")
        .update({
          content: newContent,
          edited_at: new Date().toISOString(),
        })
        .eq("id", commentId);

      if (error) throw error;

      toast({ title: "Comment updated" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        <h2 className="text-xl font-bold">
          Comments ({comments.length})
        </h2>
      </div>

      {isAuthenticated ? (
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            maxLength={2000}
            rows={3}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {newComment.length}/2000 characters
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sign in to leave a comment
        </p>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <ProjectCommentCard
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))
        )}
      </div>
    </div>
  );
};
