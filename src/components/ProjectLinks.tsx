import { ExternalLink, Github, Globe, Smartphone, FileText, PlayCircle } from "lucide-react";
import { Button } from "./ui/button";

interface ProjectLink {
  label: string;
  url: string;
  type?: string;
}

interface ProjectLinksProps {
  links?: ProjectLink[];
}

const iconMap: Record<string, typeof ExternalLink> = {
  github: Github,
  website: Globe,
  demo: PlayCircle,
  app: Smartphone,
  case_study: FileText,
  external: ExternalLink,
};

export const ProjectLinks = ({ links = [] }: ProjectLinksProps) => {
  if (!links || links.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {links.map((link, index) => {
        const IconComponent = link.type ? iconMap[link.type] || ExternalLink : ExternalLink;
        
        return (
          <Button
            key={index}
            variant="outline"
            asChild
            className="gap-2"
          >
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              <IconComponent className="w-4 h-4" />
              {link.label}
            </a>
          </Button>
        );
      })}
    </div>
  );
};
