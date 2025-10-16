-- Create service_reviews table
CREATE TABLE public.service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT CHECK (char_length(comment) <= 2000),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_request_id)
);

-- Enable RLS
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view reviews"
  ON public.service_reviews FOR SELECT
  USING (true);

CREATE POLICY "Customers can create reviews for completed requests"
  ON public.service_reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM service_requests
      WHERE id = service_request_id
        AND requester_id = auth.uid()
        AND status = 'completed'
    )
  );

CREATE POLICY "Reviewers can update their own reviews"
  ON public.service_reviews FOR UPDATE
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Admins can delete reviews"
  ON public.service_reviews FOR DELETE
  USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER handle_service_reviews_updated_at BEFORE UPDATE ON public.service_reviews
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_reviews;

-- Create project_comments table
CREATE TABLE public.project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_project_comments_project_id ON public.project_comments(project_id);
CREATE INDEX idx_project_comments_user_id ON public.project_comments(user_id);
CREATE INDEX idx_project_comments_created_at ON public.project_comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view non-deleted comments"
  ON public.project_comments FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create comments"
  ON public.project_comments FOR INSERT
  WITH CHECK (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can update their own comments"
  ON public.project_comments FOR UPDATE
  USING (user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can soft delete any comment"
  ON public.project_comments FOR UPDATE
  USING (is_admin(auth.uid()));

-- Trigger
CREATE TRIGGER handle_project_comments_updated_at BEFORE UPDATE ON public.project_comments
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Enable realtime for live comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_comments;