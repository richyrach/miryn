-- Reports and moderation + chat trigger fix

-- 1) Enums for reports
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_target') THEN
    CREATE TYPE public.report_target AS ENUM ('user','project','service','message');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE public.report_status AS ENUM ('open','reviewing','resolved','dismissed');
  END IF;
END $$;

-- 2) Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reporter_id uuid NOT NULL,
  target_type public.report_target NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status public.report_status NOT NULL DEFAULT 'open'
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS: reporters can create
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reports' AND policyname='Users can create reports'
  ) THEN
    CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT WITH CHECK (reporter_id = auth.uid());
  END IF;
END $$;

-- RLS: admins can view
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reports' AND policyname='Admins can view reports'
  ) THEN
    CREATE POLICY "Admins can view reports" ON public.reports
    FOR SELECT USING (is_admin(auth.uid()));
  END IF;
END $$;

-- RLS: admins can update
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reports' AND policyname='Admins can update reports'
  ) THEN
    CREATE POLICY "Admins can update reports" ON public.reports
    FOR UPDATE USING (is_admin(auth.uid()));
  END IF;
END $$;

-- RLS: admins can delete
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reports' AND policyname='Admins can delete reports'
  ) THEN
    CREATE POLICY "Admins can delete reports" ON public.reports
    FOR DELETE USING (is_admin(auth.uid()));
  END IF;
END $$;

-- Updated at trigger
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname='update_reports_updated_at'
  ) THEN
    CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports (reporter_id);

-- 3) Admin moderation policies for projects/services
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='projects' AND policyname='Admins can update any project'
  ) THEN
    CREATE POLICY "Admins can update any project" ON public.projects
    FOR UPDATE USING (is_admin(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='projects' AND policyname='Admins can delete any project'
  ) THEN
    CREATE POLICY "Admins can delete any project" ON public.projects
    FOR DELETE USING (is_admin(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='services' AND policyname='Admins can update any service'
  ) THEN
    CREATE POLICY "Admins can update any service" ON public.services
    FOR UPDATE USING (is_admin(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='services' AND policyname='Admins can delete any service'
  ) THEN
    CREATE POLICY "Admins can delete any service" ON public.services
    FOR DELETE USING (is_admin(auth.uid()));
  END IF;
END $$;

-- 4) Fix chat participant trigger: AFTER INSERT instead of BEFORE
DROP TRIGGER IF EXISTS on_conversation_created ON public.conversations;
CREATE TRIGGER on_conversation_created
AFTER INSERT ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.add_creator_as_participant();