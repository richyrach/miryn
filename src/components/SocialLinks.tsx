import { Button } from "./ui/button";
import { 
  Instagram, 
  Youtube, 
  MessageSquare, 
  Github, 
  Twitter, 
  Linkedin, 
  Music, 
  Tv,
  ExternalLink,
  Link as LinkIcon
} from "lucide-react";

interface SocialLink {
  platform: string;
  url: string;
}

interface CustomLink {
  name: string;
  url: string;
  logo_url?: string;
}

interface SocialLinksProps {
  socialLinks: SocialLink[];
  customLinks: CustomLink[];
}

const iconMap: Record<string, any> = {
  instagram: Instagram,
  youtube: Youtube,
  discord: MessageSquare,
  github: Github,
  twitter: Twitter,
  linkedin: Linkedin,
  tiktok: Music,
  twitch: Tv,
};

export const SocialLinks = ({ socialLinks, customLinks }: SocialLinksProps) => {
  if (!socialLinks?.length && !customLinks?.length) return null;

  return (
    <div className="space-y-4">
      {/* Social Media Links */}
      {socialLinks && socialLinks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Connect</h3>
          <div className="flex flex-wrap gap-2">
            {socialLinks.map((link, index) => {
              const Icon = iconMap[link.platform] || LinkIcon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <Icon className="w-4 h-4" />
                    {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                  </a>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Links */}
      {customLinks && customLinks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Links</h3>
          <div className="space-y-2">
            {customLinks.map((link, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-between"
                asChild
              >
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <div className="flex items-center gap-3">
                    {link.logo_url ? (
                      <img src={link.logo_url} alt={link.name} className="w-5 h-5 rounded" />
                    ) : (
                      <LinkIcon className="w-5 h-5" />
                    )}
                    <span>{link.name}</span>
                  </div>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
