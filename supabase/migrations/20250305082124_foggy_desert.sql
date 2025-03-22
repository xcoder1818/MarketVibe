/*
  # Add Marketing Plan Templates Support

  1. New Tables
    - `marketing_plan_templates`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `strategy_overview` (text)
      - `company_id` (uuid, nullable)
      - `is_public` (boolean)
      - `created_by` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `template_activities`
      - `id` (uuid, primary key)
      - `template_id` (uuid)
      - `title` (text)
      - `description` (text)
      - `activity_type` (text)
      - `duration` (integer)
      - `order` (integer)
      - `dependencies` (uuid[])
      - `has_form` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for viewing and managing templates
*/

-- Create marketing_plan_templates table
CREATE TABLE IF NOT EXISTS marketing_plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  strategy_overview TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create template_activities table
CREATE TABLE IF NOT EXISTS template_activities (
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
    'linkedin_advertising'
  )),
  duration INTEGER NOT NULL DEFAULT 7,
  order_index INTEGER NOT NULL DEFAULT 0,
  dependencies UUID[] DEFAULT ARRAY[]::UUID[],
  has_form BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE marketing_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for marketing_plan_templates

-- View policies
CREATE POLICY "Users can view public templates"
  ON marketing_plan_templates
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their company's private templates"
  ON marketing_plan_templates
  FOR SELECT
  USING (
    company_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.company_id = marketing_plan_templates.company_id
    )
  );

CREATE POLICY "Users can view templates they created"
  ON marketing_plan_templates
  FOR SELECT
  USING (created_by = auth.uid());

-- Insert policies
CREATE POLICY "Users can create public templates if admin"
  ON marketing_plan_templates
  FOR INSERT
  WITH CHECK (
    is_public = false OR
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.role = 'admin'
    )
  );

CREATE POLICY "Users can create private templates for their company"
  ON marketing_plan_templates
  FOR INSERT
  WITH CHECK (
    company_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.company_id = marketing_plan_templates.company_id
      AND user_permissions.role IN ('admin', 'manager')
    )
  );

-- Update policies
CREATE POLICY "Users can update templates they created"
  ON marketing_plan_templates
  FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Admins can update public templates"
  ON marketing_plan_templates
  FOR UPDATE
  USING (
    is_public = true AND
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.role = 'admin'
    )
  );

CREATE POLICY "Users can update their company's private templates"
  ON marketing_plan_templates
  FOR UPDATE
  USING (
    company_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.company_id = marketing_plan_templates.company_id
      AND user_permissions.role IN ('admin', 'manager')
    )
  );

-- Delete policies
CREATE POLICY "Users can delete templates they created"
  ON marketing_plan_templates
  FOR DELETE
  USING (created_by = auth.uid());

CREATE POLICY "Admins can delete public templates"
  ON marketing_plan_templates
  FOR DELETE
  USING (
    is_public = true AND
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.role = 'admin'
    )
  );

CREATE POLICY "Users can delete their company's private templates"
  ON marketing_plan_templates
  FOR DELETE
  USING (
    company_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.company_id = marketing_plan_templates.company_id
      AND user_permissions.role IN ('admin', 'manager')
    )
  );

-- Create policies for template_activities

-- View policies
CREATE POLICY "Users can view activities for templates they can access"
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

-- Insert/Update/Delete policies follow the same pattern as the template
CREATE POLICY "Users can manage activities for templates they can manage"
  ON template_activities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM marketing_plan_templates
      WHERE marketing_plan_templates.id = template_activities.template_id
      AND (
        marketing_plan_templates.created_by = auth.uid() OR
        (
          marketing_plan_templates.is_public = true AND
          EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_permissions.user_id = auth.uid()
            AND user_permissions.role = 'admin'
          )
        ) OR
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

-- Add triggers for updated_at
CREATE TRIGGER update_marketing_plan_templates_updated_at
  BEFORE UPDATE ON marketing_plan_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_template_activities_updated_at
  BEFORE UPDATE ON template_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Create indexes
CREATE INDEX idx_marketing_plan_templates_company ON marketing_plan_templates(company_id);
CREATE INDEX idx_marketing_plan_templates_public ON marketing_plan_templates(is_public);
CREATE INDEX idx_template_activities_template ON template_activities(template_id);
CREATE INDEX idx_template_activities_type ON template_activities(activity_type);