-- Add service contact and payment fields

-- 1. Add contact methods and payment options to services
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS contact_methods jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS accepted_payment_methods jsonb DEFAULT '[]'::jsonb;

-- 2. Add selected contact/payment info to service_requests
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS selected_contact_method text,
ADD COLUMN IF NOT EXISTS contact_info text,
ADD COLUMN IF NOT EXISTS selected_payment_method text;

-- 3. Update notification function to link to /service-requests
CREATE OR REPLACE FUNCTION public.notify_new_service_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  seller_user_id UUID;
  requester_handle TEXT;
  service_title TEXT;
BEGIN
  -- Get seller's user_id
  SELECT user_id INTO seller_user_id
  FROM profiles
  WHERE id = NEW.seller_profile_id;
  
  -- Get requester's handle
  SELECT handle INTO requester_handle
  FROM profiles
  WHERE user_id = NEW.requester_id;
  
  -- Get service title
  SELECT title INTO service_title
  FROM services
  WHERE id = NEW.service_id;
  
  -- Create notification for seller
  IF seller_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      seller_user_id,
      'order',
      'New Service Request',
      '@' || COALESCE(requester_handle, 'Someone') || ' requested: ' || COALESCE(service_title, 'your service'),
      '/service-requests'
    );
  END IF;
  
  RETURN NEW;
END;
$$;