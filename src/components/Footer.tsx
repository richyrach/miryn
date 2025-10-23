import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Links Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link to="/feedback" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Feedback
              </Link>
            </nav>
          </div>

          {/* Partnership Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Partners</h3>
            <a 
              href="https://top.gg/bot/1414363169761132676" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <span>Forminator Discord Bot</span>
              <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          {/* Copyright */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Miryn</h3>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Miryn. All rights reserved.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border/40">
          <p className="text-xs text-center text-muted-foreground">
            Built by creators, for creators. Showcase your work and connect with opportunities.
          </p>
        </div>
      </div>
    </footer>
  );
};
