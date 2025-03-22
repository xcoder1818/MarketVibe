-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view public templates" ON marketing_plan_templates;
DROP POLICY IF EXISTS "Users can view their company's private templates" ON marketing_plan_templates;
DROP POLICY IF EXISTS "Users can view templates they created" ON marketing_plan_templates;
DROP POLICY IF EXISTS "Users can create public templates if admin" ON marketing_plan_templates;
DROP POLICY IF EXISTS "Users can create private templates for their company" ON marketing_plan_templates;
DROP POLICY IF EXISTS "Users can update templates they created" ON marketing_plan_templates;
DROP POLICY IF EXISTS "Admins can update public templates" ON marketing_plan_templates;
DROP POLICY IF EXISTS "Users can update their company's private templates" ON marketing_plan_templates;
DROP POLICY IF EXISTS "Users can delete templates they created" ON marketing_plan_templates;
DROP POLICY IF EXISTS "Admins can delete public templates" ON marketing_plan_templates;
DROP POLICY IF EXISTS "Users can delete their company's private templates" ON marketing_plan_templates;
DROP POLICY IF EXISTS "Users can view activities for templates they can access" ON template_activities;
DROP POLICY IF EXISTS "Users can manage activities for templates they can manage" ON template_activities;

-- Create marketing_plan_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS marketing_plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  strategy_overview TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  fixed_activities BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create template_activities table if it doesn't exist
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

-- Enable Row Level Security if not already enabled
ALTER TABLE marketing_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_activities ENABLE ROW LEVEL SECURITY;

-- Create new policies for marketing_plan_templates
CREATE POLICY "template_select_public"
  ON marketing_plan_templates
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "template_select_private"
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

CREATE POLICY "template_select_own"
  ON marketing_plan_templates
  FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "template_insert_public"
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

CREATE POLICY "template_insert_private"
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

CREATE POLICY "template_update_own"
  ON marketing_plan_templates
  FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "template_update_public"
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

CREATE POLICY "template_update_private"
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

CREATE POLICY "template_delete_own"
  ON marketing_plan_templates
  FOR DELETE
  USING (created_by = auth.uid());

CREATE POLICY "template_delete_public"
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

CREATE POLICY "template_delete_private"
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
CREATE POLICY "activity_select"
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

CREATE POLICY "activity_manage"
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

-- Add triggers for updated_at if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_marketing_plan_templates_updated_at'
  ) THEN
    CREATE TRIGGER update_marketing_plan_templates_updated_at
      BEFORE UPDATE ON marketing_plan_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_modified_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_template_activities_updated_at'
  ) THEN
    CREATE TRIGGER update_template_activities_updated_at
      BEFORE UPDATE ON template_activities
      FOR EACH ROW
      EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_marketing_plan_templates_company ON marketing_plan_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_marketing_plan_templates_public ON marketing_plan_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_template_activities_template ON template_activities(template_id);
CREATE INDEX IF NOT EXISTS idx_template_activities_type ON template_activities(activity_type);