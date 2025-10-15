-- Extend app_role enum with new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_mod';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'junior_mod';

-- Add acknowledged_at column to user_warnings
ALTER TABLE public.user_warnings ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz NULL;

-- Create RLS policy for users to acknowledge their own warnings
CREATE POLICY "Users can acknowledge their own warnings"
ON public.user_warnings
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create feedback enums
CREATE TYPE public.feedback_type AS ENUM ('bug', 'suggestion');
CREATE TYPE public.feedback_status AS ENUM ('open', 'in_progress', 'resolved', 'dismissed');

-- Create feedback table
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type feedback_type NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  url text NULL,
  screenshot_url text NULL,
  status feedback_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for feedback
CREATE POLICY "Users can insert their own feedback"
ON public.feedback
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own feedback"
ON public.feedback
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all feedback"
ON public.feedback
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update feedback"
ON public.feedback
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete feedback"
ON public.feedback
FOR DELETE
USING (is_admin(auth.uid()));

-- Update trigger for feedback
CREATE TRIGGER update_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();