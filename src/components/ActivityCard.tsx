import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card } from "./ui/card";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Rocket, Briefcase, UserPlus, Heart, Star } from "lucide-react";

interface ActivityCardProps {
  activity: {
    id: string;
    activity_type: string;
    target_type: string | null;
    target_id: string | null;
    created_at: string;
    profiles: {
      display_name: string;
      handle: string;
      avatar_url: string | null;
    };
  };
}

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const navigate = useNavigate();

  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case "project_published":
        return <Rocket className="w-5 h-5 text-primary" />;
      case "service_created":
        return <Briefcase className="w-5 h-5 text-primary" />;
      case "followed_user":
        return <UserPlus className="w-5 h-5 text-primary" />;
      case "project_liked":
        return <Heart className="w-5 h-5 text-primary" />;
      case "service_reviewed":
        return <Star className="w-5 h-5 text-primary" />;
      default:
        return null;
    }
  };

  const getActivityText = () => {
    switch (activity.activity_type) {
      case "project_published":
        return "published a new project";
      case "service_created":
        return "created a new service";
      case "followed_user":
        return "followed a user";
      case "project_liked":
        return "liked a project";
      case "service_reviewed":
        return "reviewed a service";
      default:
        return "performed an action";
    }
  };

  const handleClick = () => {
    if (activity.target_type === "project" && activity.target_id) {
      navigate(`/project/${activity.target_id}`);
    } else if (activity.target_type === "service" && activity.target_id) {
      navigate(`/service/${activity.target_id}`);
    } else if (activity.target_type === "profile" && activity.target_id) {
      // Would need to fetch handle first, simplified for now
      navigate(`/profile/${activity.profiles.handle}`);
    }
  };

  return (
    <Card
      className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarImage src={activity.profiles.avatar_url || ""} />
          <AvatarFallback>{activity.profiles.display_name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {getActivityIcon()}
            <p className="text-sm">
              <span className="font-semibold">{activity.profiles.display_name}</span>{" "}
              {getActivityText()}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Card>
  );
};
