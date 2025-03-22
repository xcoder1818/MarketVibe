/*
  # Add Marketing Activities

  1. New Tables
    - `marketing_activities`
      - `id` (uuid, primary key)
      - `plan_id` (uuid, references marketing_plans)
      - `title` (text)
      - `description` (text)
      - `activity_type` (text)
      - `status` (text)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `assigned_to` (uuid, references auth.users)
      - `dependencies` (uuid[])
      - `has_form` (boolean)
      - `budget` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on the new table
    - Add policies for authenticated users to manage their own data
*/

-- Create marketing_activities table
CREATE TABLE IF NOT EXISTS marketing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES marketing_plans(id) ON DELETE CASCADE,
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
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'cancelled')) DEFAULT 'not_started',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dependencies UUID[] DEFAULT ARRAY[]::UUID[],
  has_form BOOLEAN DEFAULT false,
  budget NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE marketing_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for marketing_activities
CREATE POLICY "Users can view activities for plans they have access to"
  ON marketing_activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = marketing_activities.plan_id
      AND (
        marketing_plans.owner_id = auth.uid() OR
        auth.uid() = ANY(marketing_plans.team_members)
      )
    )
  );

CREATE POLICY "Users can insert activities for plans they have access to"
  ON marketing_activities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = marketing_activities.plan_id
      AND (
        marketing_plans.owner_id = auth.uid() OR
        auth.uid() = ANY(marketing_plans.team_members)
      )
    )
  );

CREATE POLICY "Users can update activities for plans they have access to"
  ON marketing_activities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = marketing_activities.plan_id
      AND (
        marketing_plans.owner_id = auth.uid() OR
        auth.uid() = ANY(marketing_plans.team_members)
      )
    )
  );

CREATE POLICY "Users can delete activities for plans they have access to"
  ON marketing_activities
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = marketing_activities.plan_id
      AND (
        marketing_plans.owner_id = auth.uid() OR
        auth.uid() = ANY(marketing_plans.team_members)
      )
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_marketing_activities_updated_at
BEFORE UPDATE ON marketing_activities
FOR EACH ROW EXECUTE FUNCTION update_modified_column();