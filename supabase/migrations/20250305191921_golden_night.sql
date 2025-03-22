-- Add fixed_activities column to marketing_plan_templates if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketing_plan_templates' 
    AND column_name = 'fixed_activities'
  ) THEN
    ALTER TABLE marketing_plan_templates 
    ADD COLUMN fixed_activities BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add fixed column to template_activities if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'template_activities' 
    AND column_name = 'fixed'
  ) THEN
    ALTER TABLE template_activities 
    ADD COLUMN fixed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add fixed column to marketing_activities if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketing_activities' 
    AND column_name = 'fixed'
  ) THEN
    ALTER TABLE marketing_activities 
    ADD COLUMN fixed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add fixed_activities column to marketing_plans if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketing_plans' 
    AND column_name = 'fixed_activities'
  ) THEN
    ALTER TABLE marketing_plans 
    ADD COLUMN fixed_activities BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_template_activities_fixed ON template_activities(fixed);
CREATE INDEX IF NOT EXISTS idx_marketing_activities_fixed ON marketing_activities(fixed);
CREATE INDEX IF NOT EXISTS idx_marketing_plan_templates_fixed ON marketing_plan_templates(fixed_activities);
CREATE INDEX IF NOT EXISTS idx_marketing_plans_fixed ON marketing_plans(fixed_activities);