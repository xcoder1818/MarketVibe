/*
  # Fix infinite recursion in policies

  1. Changes
    - Drop all problematic policies that cause infinite recursion
    - Create new policies with proper logic that avoids recursion
    - Simplify policy structure to prevent circular dependencies
*/

-- Drop all potentially problematic policies to ensure a clean slate
DROP POLICY IF EXISTS "Users can view companies they have permissions for" ON companies;
DROP POLICY IF EXISTS "Users can view companies they own" ON companies;
DROP POLICY IF EXISTS "Users can view companies with direct permissions" ON companies;

DROP POLICY IF EXISTS "Admins can view all permissions for their companies" ON user_permissions;
DROP POLICY IF EXISTS "Admins can create permissions for their companies" ON user_permissions;
DROP POLICY IF EXISTS "Admins can update permissions for their companies" ON user_permissions;
DROP POLICY IF EXISTS "Admins can delete permissions for their companies" ON user_permissions;
DROP POLICY IF EXISTS "Company owners can manage all permissions" ON user_permissions;

DROP POLICY IF EXISTS "Users can view plans they have company permissions for" ON marketing_plans;
DROP POLICY IF EXISTS "Users can view plans they own or are members of" ON marketing_plans;
DROP POLICY IF EXISTS "Users can view plans with company permissions" ON marketing_plans;

-- Create simple, non-recursive policies for companies
CREATE POLICY "Users can view owned companies"
  ON companies
  FOR SELECT
  USING (owner_id = auth.uid());

-- Create simple, non-recursive policies for user_permissions
CREATE POLICY "Users can view own permissions"
  ON user_permissions
  FOR SELECT
  USING (user_id = auth.uid());

-- Create simple policy for company owners to manage permissions
CREATE POLICY "Company owners can manage permissions"
  ON user_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = user_permissions.company_id
      AND companies.owner_id = auth.uid()
    )
  );

-- Create simple policies for marketing_plans
CREATE POLICY "Users can view owned plans"
  ON marketing_plans
  FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can view team plans"
  ON marketing_plans
  FOR SELECT
  USING (auth.uid() = ANY(team_members));

-- Add other necessary policies without recursion
CREATE POLICY "Users can insert companies"
  ON companies
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update owned companies"
  ON companies
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete owned companies"
  ON companies
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Add simple insert/update/delete policies for marketing_plans
CREATE POLICY "Users can insert plans"
  ON marketing_plans
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update owned plans"
  ON marketing_plans
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete owned plans"
  ON marketing_plans
  FOR DELETE
  USING (auth.uid() = owner_id);