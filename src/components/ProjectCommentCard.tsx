import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { VerifiedCheckmark } from "./VerifiedCheckmark";
import { useUserRoles } from "@/hooks/useUserRoles";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProjectCommentCardProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    edited_at: string | null;
    user_id: string;
    profiles: {
      display_name: string;
      handle: string;
      avatar_url: string | null;
      user_id: string;
    };
  };
  currentUserId: string | null;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string, newContent: string) => void;
}

export const ProjectCommentCard = ({
  comment,
  currentUserId,
  isAdmin,
  onDelete,
  onEdit,
}: ProjectCommentCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const { roles } = useUserRoles(comment.profiles.user_id);

  const isOwner = currentUserId === comment.user_id;

  const handleSaveEdit = () => {
    if (editedContent.trim() && editedContent !== comment.content) {
      onEdit(comment.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div className="glass-card rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={comment.profiles.avatar_url || ""} />
            <AvatarFallback>
              {comment.profiles.display_name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{comment.profiles.display_name}</p>
              <VerifiedCheckmark roles={roles} size="sm" />
            </div>
            <p className="text-sm text-muted-foreground">
              @{comment.profiles.handle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && !isEditing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}

          {(isOwner || isAdmin) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this comment? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(comment.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            maxLength={2000}
            rows={3}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveEdit}>
              <Check className="w-4 h-4 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground">{comment.content}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {formatDistanceToNow(new Date(comment.created_at), {
            addSuffix: true,
          })}
        </span>
        {comment.edited_at && <span>• edited</span>}
      </div>
    </div>
  );
};
