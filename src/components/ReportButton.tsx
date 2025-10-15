import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ReportTarget = "user" | "project" | "service" | "message";

interface ReportButtonProps {
  targetType: ReportTarget;
  targetId: string;
  size?: "sm" | "default" | "lg";
  variant?: "ghost" | "outline" | "default" | "destructive" | "secondary";
}

export const ReportButton = ({ targetType, targetId, size = "sm", variant = "outline" }: ReportButtonProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const reason = (form.get("reason") as string)?.trim();
    const details = (form.get("details") as string)?.trim();

    if (!reason) {
      toast({ title: "Reason is required", variant: "destructive" });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Sign in required", description: "Please sign in to report", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from("reports").insert({
        reporter_id: session.user.id,
        target_type: targetType,
        target_id: targetId,
        reason,
        details: details || null,
      });

      if (error) throw error;
      toast({ title: "Report submitted", description: "Thanks for helping keep the community safe." });
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Could not submit report", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} className="gap-2">
          <Flag className="w-4 h-4" /> Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {targetType}</DialogTitle>
          <DialogDescription>
            Tell us what’s wrong. Reports are reviewed by moderators.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason*</Label>
            <Textarea id="reason" name="reason" required placeholder="Spam, harassment, inappropriate content, etc." className="mt-1" />
          </div>
          <div>
            <Label htmlFor="details">Details (optional)</Label>
            <Textarea id="details" name="details" placeholder="Add links or more context to help us review faster" className="mt-1" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Report"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
