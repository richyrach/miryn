import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

export const ConsentManager = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("site_consent_v1");
    if (!accepted) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          We use cookies and limited data to improve your experience. By clicking Accept, you agree to our
          <Link to="/privacy" className="text-primary hover:underline ml-1">Privacy Policy</Link>.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setVisible(false)}>Not now</Button>
          <Button onClick={() => { localStorage.setItem("site_consent_v1", "accepted"); setVisible(false); }}>Accept</Button>
        </div>
      </div>
    </div>
  );
};
