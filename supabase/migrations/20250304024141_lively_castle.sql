/*
  # Fix infinite recursion in policies

  1. Changes
    - Drop problematic policies that cause infinite recursion
    - Create new policies with proper logic that avoids recursion
*/

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view companies they have permissions for" ON companies;
DROP POLICY IF EXISTS "Admins can view all permissions for their companies" ON user_permissions;
DROP POLICY IF EXISTS "Admins can create permissions for their companies" ON user_permissions;
DROP POLICY IF EXISTS "Admins can update permissions for their companies" ON user_permissions;
DROP POLICY IF EXISTS "Admins can delete permissions for their companies" ON user_permissions;
DROP POLICY IF EXISTS "Users can view plans they have company permissions for" ON marketing_plans;

-- Create fixed policies for companies
CREATE POLICY "Users can view companies they own"
  ON companies
  FOR SELECT
  USING (companies.owner_id = auth.uid());

CREATE POLICY "Users can view companies with direct permissions"
  ON companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.company_id = companies.id
      AND user_permissions.user_id = auth.uid()
    )
  );

-- Create fixed policies for user_permissions
CREATE POLICY "Company owners can manage all permissions"
  ON user_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = user_permissions.company_id
      AND companies.owner_id = auth.uid()
    )
  );

-- Create fixed policy for marketing_plans
CREATE POLICY "Users can view plans they own or are members of"
  ON marketing_plans
  FOR SELECT
  USING (
    -- User is the owner
    auth.uid() = owner_id 
    OR 
    -- User is a team member
    auth.uid() = ANY(team_members)
  );

CREATE POLICY "Users can view plans with company permissions"
  ON marketing_plans
  FOR SELECT
  USING (
    client_visible = true
    AND
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.company_id = marketing_plans.company_id
      AND user_permissions.user_id = auth.uid()
    )
  );