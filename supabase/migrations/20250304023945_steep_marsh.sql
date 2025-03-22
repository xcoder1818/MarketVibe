/*
  # Company and permissions schema

  1. New Tables
    - `companies` - Stores company information
    - `user_permissions` - Stores user permissions for companies
    - `calendar_settings` - Stores user calendar preferences
  
  2. Changes
    - Add company_id and role to profiles
    - Add company_id and client_visible to marketing_plans
    - Add client_visible to marketing_activities
  
  3. Security
    - Enable RLS on all new tables
    - Create appropriate policies for access control
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'client', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Create calendar_settings table
CREATE TABLE IF NOT EXISTS calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visible_calendars UUID[] DEFAULT ARRAY[]::UUID[],
  default_view TEXT DEFAULT 'month' CHECK (default_view IN ('month', 'week', 'day')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Add columns to existing tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'client', 'viewer'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Add company_id to marketing_plans
ALTER TABLE marketing_plans ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE marketing_plans ADD COLUMN IF NOT EXISTS client_visible BOOLEAN DEFAULT true;

-- Add client_visible to marketing_activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketing_activities' AND column_name = 'client_visible'
  ) THEN
    ALTER TABLE marketing_activities ADD COLUMN client_visible BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for companies
CREATE POLICY "Users can view companies they have permissions for"
  ON companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.company_id = companies.id
      AND user_permissions.user_id = auth.uid()
    )
    OR
    companies.owner_id = auth.uid()
  );

CREATE POLICY "Users can create companies"
  ON companies
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Only owners can update their companies"
  ON companies
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Only owners can delete their companies"
  ON companies
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Create RLS Policies for user_permissions
CREATE POLICY "Users can view their own permissions"
  ON user_permissions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all permissions for their companies"
  ON user_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions AS up
      WHERE up.company_id = user_permissions.company_id
      AND up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- Fixed policy to avoid using NEW reference
CREATE POLICY "Admins can create permissions for their companies"
  ON user_permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions AS up
      WHERE up.company_id = user_permissions.company_id
      AND up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can update permissions for their companies"
  ON user_permissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions AS up
      WHERE up.company_id = user_permissions.company_id
      AND up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete permissions for their companies"
  ON user_permissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions AS up
      WHERE up.company_id = user_permissions.company_id
      AND up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- Create RLS Policies for calendar_settings
CREATE POLICY "Users can view their own calendar settings"
  ON calendar_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar settings"
  ON calendar_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar settings"
  ON calendar_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar settings"
  ON calendar_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- First drop the existing policy if it exists
DROP POLICY IF EXISTS "Users can view plans they own or are members of" ON marketing_plans;

-- Create new policy for marketing_plans
CREATE POLICY "Users can view plans they have company permissions for"
  ON marketing_plans
  FOR SELECT
  USING (
    -- User is the owner
    auth.uid() = owner_id 
    OR 
    -- User is a team member
    auth.uid() = ANY(team_members)
    OR
    -- User has permissions for the company and the plan is client-visible
    (
      client_visible = true
      AND
      EXISTS (
        SELECT 1 FROM user_permissions
        WHERE user_permissions.company_id = marketing_plans.company_id
        AND user_permissions.user_id = auth.uid()
      )
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON user_permissions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_calendar_settings_updated_at
BEFORE UPDATE ON calendar_settings
FOR EACH ROW EXECUTE FUNCTION update_modified_column();