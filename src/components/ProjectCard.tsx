import { Link } from "react-router-dom";
import { Badge } from "./ui/badge";
import { ProjectLikeButton } from "./ProjectLikeButton";
import { useTranslation } from "react-i18next";

interface ProjectCardProps {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  coverUrl?: string | null;
  stack: string[];
  ownerHandle: string;
  category?: string | null;
  tags?: string[] | null;
}

export const ProjectCard = ({
  id,
  title,
  slug,
  summary,
  coverUrl,
  stack,
  ownerHandle,
  category,
  tags,
}: ProjectCardProps) => {
  const { t } = useTranslation();
  
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
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-xl font-bold group-hover:text-primary transition-colors flex-1">
              {title}
            </h3>
            {category && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {category}
              </Badge>
            )}
          </div>
          {summary && (
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {summary}
            </p>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
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
            <p className="text-xs text-muted-foreground">{t('common.by')} @{ownerHandle}</p>
            <div onClick={(e) => e.preventDefault()} className="flex items-center gap-2">
              <ProjectLikeButton projectId={id} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
