import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { RoleBadge } from "./RoleBadge";
import { VerifiedCheckmark } from "./VerifiedCheckmark";

interface ProfileCardProps {
  handle: string;
  display_name: string;
  avatar_url?: string | null;
  skills?: string[] | null;
  hireable?: boolean;
  roles?: string[];
}

export const ProfileCard = ({
  handle,
  display_name,
  avatar_url,
  skills,
  hireable,
  roles = [],
}: ProfileCardProps) => {
  // Filter out 'user' role
  const displayRoles = roles.filter(r => r !== 'user');
  
  return (
    <Link to={`/${handle}`} className="block group">
      <div className="glass-card rounded-2xl p-6 hover:shadow-glow transition-all duration-300 hover:scale-105">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-16 h-16 ring-2 ring-primary/20">
            <AvatarImage src={avatar_url || undefined} alt={display_name} />
            <AvatarFallback>
              <User className="w-8 h-8" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate">
                {display_name}
              </h3>
              <VerifiedCheckmark roles={roles} size="sm" />
            </div>
            <p className="text-sm text-muted-foreground truncate">@{handle}</p>
            {displayRoles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {displayRoles.slice(0, 3).map((r, i) => (
                  <RoleBadge key={i} role={r} />
                ))}
                {displayRoles.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{displayRoles.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        
        {skills && skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.slice(0, 3).map((skill, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {skills.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{skills.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        {hireable && (
          <Badge className="badge-hireable">Available for hire</Badge>
        )}
      </div>
    </Link>
  );
};
