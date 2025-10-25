import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import QRCode from "qrcode";

export const TwoFactorSettings = () => {
  const { toast } = useToast();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const factors = await supabase.auth.mfa.listFactors();
        setMfaEnabled(factors.data?.totp && factors.data.totp.length > 0);
      }
    } catch (error) {
      console.error("Error checking MFA status:", error);
    }
  };

  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const unenrollUnverifiedTotp = async () => {
    try {
      const factors = await supabase.auth.mfa.listFactors();
      const unverifiedFactors = factors.data?.totp?.filter(f => f.factor_type === 'totp' && !f.friendly_name) || [];
      
      for (const factor of unverifiedFactors) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
    } catch (error) {
      console.error("Error cleaning up unverified factors:", error);
    }
  };

  const unenrollAllTotp = async () => {
    try {
      const factors = await supabase.auth.mfa.listFactors();
      const allFactors = factors.data?.totp || [];
      
      for (const factor of allFactors) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      // Delete all backup codes
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('mfa_backup_codes').delete().eq('user_id', user.id);
      }
    } catch (error) {
      console.error("Error resetting 2FA:", error);
      throw error;
    }
  };

  const handleEnableMfa = async () => {
    setLoading(true);
    setEnrolling(true);

    try {
      // First, cleanup any unverified factors to prevent conflicts
      await unenrollUnverifiedTotp();

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) {
        // If we still get a conflict, try full cleanup and retry
        if (error.message?.includes('friendly name')) {
          await unenrollUnverifiedTotp();
          const retryResult = await supabase.auth.mfa.enroll({ factorType: 'totp' });
          if (retryResult.error) throw retryResult.error;
          if (!retryResult.data) throw new Error("Failed to enroll");
          
          // Use retry data
          setSecret(retryResult.data.totp.secret);
          const { data: { user } } = await supabase.auth.getUser();
          const userEmail = user?.email || 'user';
          const otpAuthUri = `otpauth://totp/Miryn:${userEmail}?secret=${retryResult.data.totp.secret}&issuer=Miryn`;
          const qr = await QRCode.toDataURL(otpAuthUri);
          setQrCode(qr);
          const codes = generateBackupCodes();
          setBackupCodes(codes);
          
          toast({
            title: "Scan QR code",
            description: "Use your authenticator app to scan the QR code",
          });
          setLoading(false);
          return;
        }
        throw error;
      }

      if (data) {
        setSecret(data.totp.secret);
        
        // Get user email for QR code
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email || 'user';
        
        // Create shorter URI to avoid "data too big" error
        // Format: otpauth://totp/Miryn:email?secret=SECRET&issuer=Miryn
        const otpAuthUri = `otpauth://totp/Miryn:${userEmail}?secret=${data.totp.secret}&issuer=Miryn`;
        
        // Generate QR code from the shorter URI
        const qr = await QRCode.toDataURL(otpAuthUri);
        setQrCode(qr);

        // Generate backup codes
        const codes = generateBackupCodes();
        setBackupCodes(codes);

        toast({
          title: "Scan QR code",
          description: "Use your authenticator app to scan the QR code",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setEnrolling(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get the most recently enrolled factor (last in array)
      const factors = await supabase.auth.mfa.listFactors();
      const totpFactors = factors.data?.totp || [];

      if (totpFactors.length === 0) throw new Error("No factor found");
      
      // Use the most recent factor (likely the one we just enrolled)
      const factorToVerify = totpFactors[totpFactors.length - 1];

      // Create a challenge for this specific factor
      const challenge = await supabase.auth.mfa.challenge({
        factorId: factorToVerify.id,
      });

      if (challenge.error) throw challenge.error;

      // Verify the code with the challenge
      const { error } = await supabase.auth.mfa.verify({
        factorId: factorToVerify.id,
        challengeId: challenge.data.id,
        code: verificationCode,
      });

      if (error) throw error;

      // Store backup codes in database (hashed)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        for (const code of backupCodes) {
          // In production, hash the codes before storing
          const codeHash = btoa(code); // Simple encoding for demo
          await supabase.from('mfa_backup_codes').insert({
            user_id: user.id,
            code_hash: codeHash,
          });
        }
      }

      toast({
        title: "Success!",
        description: "Two-factor authentication has been enabled",
      });

      setMfaEnabled(true);
      setEnrolling(false);
      setQrCode("");
      setSecret("");
      setVerificationCode("");
    } catch (error: any) {
      toast({
        title: "Invalid code",
        description: "Code rejected. Ensure your device time is auto-synced.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetMfa = async () => {
    if (!confirm("This will remove ALL 2FA settings and invalidate codes in your authenticator app. Continue?")) {
      return;
    }

    setLoading(true);
    try {
      await unenrollAllTotp();
      
      toast({
        title: "2FA Reset",
        description: "All authenticator entries are now invalid. Delete them from your app.",
      });

      setMfaEnabled(false);
      setEnrolling(false);
      setQrCode("");
      setSecret("");
      setVerificationCode("");
      setBackupCodes([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!confirm("Are you sure you want to disable two-factor authentication?")) {
      return;
    }

    setLoading(true);

    try {
      const factors = await supabase.auth.mfa.listFactors();
      const factorId = factors.data?.totp?.[0]?.id;

      if (!factorId) throw new Error("No factor found");

      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) throw error;

      // Delete backup codes
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('mfa_backup_codes')
          .delete()
          .eq('user_id', user.id);
      }

      toast({
        title: "Disabled",
        description: "Two-factor authentication has been disabled",
      });

      setMfaEnabled(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!enrolling && !mfaEnabled && (
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Two-factor authentication adds an extra layer of security by requiring a code from your authenticator app when you sign in.
              </p>
            </div>
            <Button onClick={handleEnableMfa} disabled={loading}>
              Enable Two-Factor Authentication
            </Button>
          </div>
        )}

        {enrolling && qrCode && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Step 1: Scan QR Code</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="flex justify-center bg-white p-4 rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Or enter this key manually: {secret}
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Save Your Backup Codes
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Store these codes in a safe place. You can use them to access your account if you lose your device.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="bg-background rounded p-2 flex items-center justify-between"
                    >
                      <code className="text-xs">{code}</code>
                      <button
                        onClick={() => copyToClipboard(code)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Step 2: Enter Verification Code</Label>
                <Input
                  id="verification-code"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleVerifyAndEnable}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verify and Enable
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await unenrollUnverifiedTotp();
                    setEnrolling(false);
                    setQrCode("");
                    setSecret("");
                    setVerificationCode("");
                    setBackupCodes([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> If codes keep failing, ensure automatic date/time is enabled on your device. Cancel will clean up this setup attempt.
                </p>
              </div>
            </div>
          </div>
        )}

        {mfaEnabled && !enrolling && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Two-Factor Authentication is Enabled
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Your account is protected with two-factor authentication
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDisableMfa}
                disabled={loading}
                className="flex-1"
              >
                Disable 2FA
              </Button>
              <Button
                variant="outline"
                onClick={handleResetMfa}
                disabled={loading}
                className="flex-1"
              >
                Reset 2FA Setup
              </Button>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Reset 2FA Setup</strong> removes all authenticator entries and backup codes. Use if you lost access to your device or need to start fresh.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
