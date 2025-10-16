import { Link } from "react-router-dom";
import { Badge } from "./ui/badge";
import { ProjectLikeButton } from "./ProjectLikeButton";

interface ProjectCardProps {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  coverUrl?: string | null;
  stack: string[];
  ownerHandle: string;
}

export const ProjectCard = ({
  id,
  title,
  slug,
  summary,
  coverUrl,
  stack,
  ownerHandle,
}: ProjectCardProps) => {
  return (
    <Link to={`/${ownerHandle}/${slug}`} className="block group">
      <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-glow hover:scale-105">
        <div className="aspect-video bg-muted relative overflow-hidden">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <span className="text-4xl font-bold text-primary/20">{title[0]}</span>
            </div>
          )}
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {summary && (
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {summary}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {stack.slice(0, 3).map((tech, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
            {stack.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{stack.length - 3}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">by @{ownerHandle}</p>
            <div onClick={(e) => e.preventDefault()} className="flex items-center gap-2">
              <ProjectLikeButton projectId={id} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
