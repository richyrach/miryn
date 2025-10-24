-- Add image gallery support to projects and services tables

-- Projects: Add gallery_images (array of image objects with url, caption, order)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- Services: Update images field to use proper gallery structure
-- Note: The images field already exists, this is just a comment for clarity
COMMENT ON COLUMN services.images IS 'Array of image objects: [{url: string, caption: string, order: number}]';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_gallery_images ON projects USING GIN (gallery_images);
CREATE INDEX IF NOT EXISTS idx_services_images ON services USING GIN (images);