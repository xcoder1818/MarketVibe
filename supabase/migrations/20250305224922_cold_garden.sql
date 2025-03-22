/*
  # Fix Template Activities

  1. Changes
    - Drop existing template activities table and recreate with correct structure
    - Add missing columns and constraints
    - Update policies to fix permission issues

  2. Security
    - Enable RLS
    - Add policies for template activities management
*/

-- Drop existing template activities table and recreate
DROP TABLE IF EXISTS template_activities CASCADE;

CREATE TABLE template_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES marketing_plan_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'blog_article', 
    'full_web_page', 
    'landing_page', 
    'social_post', 
    'automated_email', 
    'email_campaign', 
    'meta_advertising', 
    'google_advertising', 
    'linkedin_advertising',
    'custom'
  )),
  duration INTEGER NOT NULL DEFAULT 7,
  order_index INTEGER NOT NULL DEFAULT 0,
  dependencies UUID[] DEFAULT ARRAY[]::UUID[],
  has_form BOOLEAN DEFAULT false,
  fixed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE template_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for template activities
CREATE POLICY "template_activities_select"
  ON template_activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM marketing_plan_templates
      WHERE marketing_plan_templates.id = template_activities.template_id
      AND (
        marketing_plan_templates.is_public = true OR
        marketing_plan_templates.created_by = auth.uid() OR
        (
          marketing_plan_templates.company_id IS NOT NULL AND
          EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_permissions.user_id = auth.uid()
            AND user_permissions.company_id = marketing_plan_templates.company_id
          )
        )
      )
    )
  );

CREATE POLICY "template_activities_insert"
  ON template_activities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM marketing_plan_templates
      WHERE marketing_plan_templates.id = template_activities.template_id
      AND (
        marketing_plan_templates.created_by = auth.uid() OR
        (
          marketing_plan_templates.company_id IS NOT NULL AND
          EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_permissions.user_id = auth.uid()
            AND user_permissions.company_id = marketing_plan_templates.company_id
            AND user_permissions.role IN ('admin', 'manager')
          )
        )
      )
    )
  );

CREATE POLICY "template_activities_update"
  ON template_activities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM marketing_plan_templates
      WHERE marketing_plan_templates.id = template_activities.template_id
      AND (
        marketing_plan_templates.created_by = auth.uid() OR
        (
          marketing_plan_templates.company_id IS NOT NULL AND
          EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_permissions.user_id = auth.uid()
            AND user_permissions.company_id = marketing_plan_templates.company_id
            AND user_permissions.role IN ('admin', 'manager')
          )
        )
      )
    )
  );

CREATE POLICY "template_activities_delete"
  ON template_activities
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM marketing_plan_templates
      WHERE marketing_plan_templates.id = template_activities.template_id
      AND (
        marketing_plan_templates.created_by = auth.uid() OR
        (
          marketing_plan_templates.company_id IS NOT NULL AND
          EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_permissions.user_id = auth.uid()
            AND user_permissions.company_id = marketing_plan_templates.company_id
            AND user_permissions.role IN ('admin', 'manager')
          )
        )
      )
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_template_activities_updated_at
  BEFORE UPDATE ON template_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Create indexes
CREATE INDEX idx_template_activities_template ON template_activities(template_id);
CREATE INDEX idx_template_activities_type ON template_activities(activity_type);
CREATE INDEX idx_template_activities_fixed ON template_activities(fixed);