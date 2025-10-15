import { Link } from "react-router-dom";
import { Badge } from "./ui/badge";
import { RoleBadge } from "./RoleBadge";
import { User } from "lucide-react";

interface ProfileCardProps {
  handle: string;
  displayName: string;
  skills: string[];
  hireable: boolean;
  avatarUrl?: string | null;
  role?: string;
}

export const ProfileCard = ({
  handle,
  displayName,
  skills,
  hireable,
  avatarUrl,
  role = 'user',
}: ProfileCardProps) => {
  return (
    <Link to={`/${handle}`} className="block group">
      <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:shadow-glow hover:scale-105">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/20">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors">
                {displayName}
              </h3>
              <RoleBadge role={role} />
            </div>
            <p className="text-sm text-muted-foreground">@{handle}</p>
          </div>
        </div>
        
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.slice(0, 3).map((skill, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{skills.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        {hireable && (
          <Badge className="badge-hireable text-xs">
            Available for hire
          </Badge>
        )}
      </div>
    </Link>
  );
};
