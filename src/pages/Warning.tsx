import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWarningCheck } from "@/hooks/useWarningCheck";
import { formatDistanceToNow } from "date-fns";

const Warning = () => {
  const navigate = useNavigate();
  const { warnings, acknowledgeWarning, hasUnacknowledgedWarning } = useWarningCheck();
  const [acknowledging, setAcknowledging] = useState(false);
  const [currentWarningIndex, setCurrentWarningIndex] = useState(0);

  useEffect(() => {
    // If no warnings, redirect to home
    if (!hasUnacknowledgedWarning && warnings.length === 0) {
      navigate("/");
    }
  }, [hasUnacknowledgedWarning, warnings, navigate]);

  const handleAcknowledge = async () => {
    if (!warnings[currentWarningIndex]) return;

    setAcknowledging(true);
    const result = await acknowledgeWarning(warnings[currentWarningIndex].id);
    
    if (result.success) {
      // Move to next warning or redirect home
      if (currentWarningIndex < warnings.length - 1) {
        setCurrentWarningIndex(currentWarningIndex + 1);
      } else {
        navigate("/");
      }
    }
    setAcknowledging(false);
  };

  if (warnings.length === 0) {
    return null;
  }

  const currentWarning = warnings[currentWarningIndex];
  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low':
        return 'bg-blue-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="max-w-2xl w-full glass-card border-2 border-yellow-500/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-yellow-500" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
              Community Warning
              <Badge className={getSeverityColor(currentWarning.severity)}>
                {currentWarning.severity?.toUpperCase() || 'WARNING'}
              </Badge>
            </CardTitle>
            <CardDescription className="text-base mt-2">
              You have received a warning from our moderation team
              {warnings.length > 1 && ` (${currentWarningIndex + 1} of ${warnings.length})`}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-6 border border-border">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Reason for Warning:
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {currentWarning.reason}
            </p>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <strong>Issued:</strong> {formatDistanceToNow(new Date(currentWarning.created_at), { addSuffix: true })}
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <p className="font-semibold text-foreground">
              To continue using our platform, please acknowledge that you:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Understand the reason for this warning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Agree to follow our community guidelines</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Will not repeat the behavior that led to this warning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Understand that repeated violations may result in account suspension or ban</span>
              </li>
            </ul>
          </div>

          {currentWarning.severity === 'critical' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-500 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Critical Warning: Any further violations will result in immediate account suspension.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={handleAcknowledge}
            disabled={acknowledging}
            className="w-full"
            size="lg"
          >
            {acknowledging ? "Acknowledging..." : "I Understand and Agree to Follow the Rules"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            By clicking above, you acknowledge this warning and commit to following our community guidelines.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Warning;
