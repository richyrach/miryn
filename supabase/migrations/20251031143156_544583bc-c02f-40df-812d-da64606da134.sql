-- Add new fields to projects table for enhanced portfolio features
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS detailed_description TEXT;

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);

-- Add index for tags filtering
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);

-- Add comment for documentation
COMMENT ON COLUMN projects.category IS 'Project category (e.g., Web, Mobile, Design)';
COMMENT ON COLUMN projects.tags IS 'Array of tags for project discoverability';
COMMENT ON COLUMN projects.detailed_description IS 'Full project description with markdown support';