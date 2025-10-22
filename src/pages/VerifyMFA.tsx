import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Shield, ArrowLeft } from "lucide-react";

const VerifyMFA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  useEffect(() => {
    checkLockout();
  }, []);

  const checkLockout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check failed attempts in last 15 minutes
    const { data, error } = await supabase
      .from('failed_mfa_attempts')
      .select('attempted_at')
      .eq('user_id', user.id)
      .gte('attempted_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
      .order('attempted_at', { ascending: false });

    if (!error && data && data.length >= 5) {
      const lastAttempt = new Date(data[0].attempted_at).getTime();
      const lockoutEnd = lastAttempt + 15 * 60 * 1000;
      
      if (Date.now() < lockoutEnd) {
        setLockoutUntil(lockoutEnd);
        toast({
          title: "Account locked",
          description: "Too many failed attempts. Please try again in 15 minutes.",
          variant: "destructive",
        });
      }
    }
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingMinutes = Math.ceil((lockoutUntil - Date.now()) / 60000);
      toast({
        title: "Account locked",
        description: `Please try again in ${remainingMinutes} minutes`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (useBackupCode) {
        // Verify backup code
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");

        const codeHash = btoa(code);
        const { data: backupCode, error: backupError } = await supabase
          .from('mfa_backup_codes')
          .select('*')
          .eq('user_id', user.id)
          .eq('code_hash', codeHash)
          .is('used_at', null)
          .single();

        if (backupError || !backupCode) {
          throw new Error("Invalid backup code");
        }

        // Mark backup code as used
        await supabase
          .from('mfa_backup_codes')
          .update({ used_at: new Date().toISOString() })
          .eq('id', backupCode.id);

        toast({
          title: "Success",
          description: "Backup code verified",
        });

        navigate(location.state?.from || "/");
      } else {
        // Verify TOTP code
        const factors = await supabase.auth.mfa.listFactors();
        const factorId = factors.data?.totp?.[0]?.id;

        if (!factorId) throw new Error("No MFA factor found");

        const challenge = await supabase.auth.mfa.challenge({
          factorId,
        });

        if (challenge.error) throw challenge.error;

        const { error } = await supabase.auth.mfa.verify({
          factorId,
          challengeId: challenge.data.id,
          code,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Authentication successful",
        });

        navigate(location.state?.from || "/");
      }
    } catch (error: any) {
      // Record failed attempt
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('failed_mfa_attempts').insert({
          user_id: user.id,
        });
      }

      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      if (newFailedAttempts >= 5) {
        setLockoutUntil(Date.now() + 15 * 60 * 1000);
        toast({
          title: "Account locked",
          description: "Too many failed attempts. Please try again in 15 minutes.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invalid code",
          description: `${5 - newFailedAttempts} attempts remaining`,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setCode("");
    }
  };

  const handleBackToLogin = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="glass-card rounded-2xl p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            
            <h1 className="text-3xl font-bold mb-4 text-center">
              Two-Factor Authentication
            </h1>
            
            <p className="text-muted-foreground mb-6 text-center">
              {useBackupCode 
                ? "Enter one of your backup codes"
                : "Enter the 6-digit code from your authenticator app"
              }
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mfa-code">
                  {useBackupCode ? "Backup Code" : "Verification Code"}
                </Label>
                <Input
                  id="mfa-code"
                  placeholder={useBackupCode ? "XXXXXXXX" : "000000"}
                  maxLength={useBackupCode ? 8 : 6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').toUpperCase())}
                  onKeyPress={(e) => e.key === "Enter" && handleVerify()}
                  disabled={loading || (lockoutUntil && Date.now() < lockoutUntil)}
                  className="text-center text-lg tracking-wider"
                />
              </div>

              <Button
                onClick={handleVerify}
                disabled={loading || !code || (lockoutUntil && Date.now() < lockoutUntil)}
                className="w-full"
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>

              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setCode("");
                  }}
                  className="w-full text-sm"
                >
                  {useBackupCode ? "Use authenticator app" : "Use backup code"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleBackToLogin}
                  className="w-full text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Button>
              </div>

              {failedAttempts > 0 && failedAttempts < 5 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {5 - failedAttempts} attempts remaining before lockout
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerifyMFA;
