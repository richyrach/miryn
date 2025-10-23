import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

export const ConsentManager = () => {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always true, can't be disabled
    analytics: true,
    advertising: true,
  });

  useEffect(() => {
    const consent = localStorage.getItem("site_consent_v2");
    if (!consent) {
      setVisible(true);
    } else {
      const saved = JSON.parse(consent);
      setPreferences(saved);
    }
  }, []);

  const savePreferences = (prefs = preferences) => {
    localStorage.setItem("site_consent_v2", JSON.stringify(prefs));
    setVisible(false);
    setShowPreferences(false);
  };

  const acceptAll = () => {
    const allAccepted = { essential: true, analytics: true, advertising: true };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  };

  const rejectOptional = () => {
    const essentialOnly = { essential: true, analytics: false, advertising: false };
    setPreferences(essentialOnly);
    savePreferences(essentialOnly);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {!showPreferences ? (
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                We use cookies to enhance your experience, analyze site traffic, and serve personalized ads through Google AdSense.
              </p>
              <p className="text-xs text-muted-foreground">
                By clicking "Accept All", you consent to our use of cookies. Read our{" "}
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and{" "}
                <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={rejectOptional}>
                Reject Optional
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPreferences(true)}>
                Manage Preferences
              </Button>
              <Button size="sm" onClick={acceptAll}>
                Accept All
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Cookie Preferences</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPreferences(false)}>
                Back
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div className="flex-1">
                  <Label htmlFor="essential" className="text-sm font-medium">
                    Essential Cookies
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Required for authentication, security, and core functionality
                  </p>
                </div>
                <Switch id="essential" checked={true} disabled />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div className="flex-1">
                  <Label htmlFor="analytics" className="text-sm font-medium cursor-pointer">
                    Analytics Cookies
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Help us understand how you use the site to improve your experience
                  </p>
                </div>
                <Switch 
                  id="analytics" 
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, analytics: checked })}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <Label htmlFor="advertising" className="text-sm font-medium cursor-pointer">
                    Advertising Cookies
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Used by Google AdSense to show personalized ads based on your interests
                  </p>
                </div>
                <Switch 
                  id="advertising" 
                  checked={preferences.advertising}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, advertising: checked })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={rejectOptional} className="flex-1">
                Reject Optional
              </Button>
              <Button size="sm" onClick={() => savePreferences()} className="flex-1">
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
