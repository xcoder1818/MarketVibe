/*
  # Fix Recursive Policies

  1. Changes
     - Drop all problematic policies that cause infinite recursion
     - Create simplified non-recursive policies for companies, user_permissions, and marketing_plans
     - Add default data for testing
*/

-- Drop all potentially problematic policies to ensure a clean slate
DROP POLICY IF EXISTS "Users can view companies they have permissions for" ON companies;
DROP POLICY IF EXISTS "Users can view companies they own" ON companies;
DROP POLICY IF EXISTS "Users can view companies with direct permissions" ON companies;
DROP POLICY IF EXISTS "Users can view owned companies" ON companies;
DROP POLICY IF EXISTS "Users can view companies with permissions" ON companies;

DROP POLICY IF EXISTS "Admins can view all permissions for their companies" ON user_permissions;
DROP POLICY IF EXISTS "Admins can create permissions for their companies" ON user_permissions;
DROP POLICY IF EXISTS "Admins can update permissions for their companies" ON user_permissions;
DROP POLICY IF EXISTS "Admins can delete permissions for their companies" ON user_permissions;
DROP POLICY IF EXISTS "Company owners can manage all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;

DROP POLICY IF EXISTS "Users can view plans they have company permissions for" ON marketing_plans;
DROP POLICY IF EXISTS "Users can view plans they own or are members of" ON marketing_plans;
DROP POLICY IF EXISTS "Users can view plans with company permissions" ON marketing_plans;
DROP POLICY IF EXISTS "Users can view owned plans" ON marketing_plans;
DROP POLICY IF EXISTS "Users can view team plans" ON marketing_plans;

-- Create simple, non-recursive policies for companies
CREATE POLICY "companies_select_owner"
  ON companies
  FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "companies_insert"
  ON companies
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "companies_update"
  ON companies
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "companies_delete"
  ON companies
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Create simple, non-recursive policies for user_permissions
CREATE POLICY "permissions_select_user"
  ON user_permissions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "permissions_select_company_owner"
  ON user_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = user_permissions.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "permissions_insert_company_owner"
  ON user_permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = user_permissions.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "permissions_update_company_owner"
  ON user_permissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = user_permissions.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "permissions_delete_company_owner"
  ON user_permissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = user_permissions.company_id
      AND companies.owner_id = auth.uid()
    )
  );

-- Create simple policies for marketing_plans
CREATE POLICY "plans_select_owner"
  ON marketing_plans
  FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "plans_select_member"
  ON marketing_plans
  FOR SELECT
  USING (auth.uid() = ANY(team_members));

CREATE POLICY "plans_insert"
  ON marketing_plans
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "plans_update_owner"
  ON marketing_plans
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "plans_delete_owner"
  ON marketing_plans
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Create a default company for testing if none exists
DO $$
DECLARE
  user_id uuid;
  company_id uuid;
BEGIN
  -- Get the first user ID (for testing purposes)
  SELECT id INTO user_id FROM auth.users LIMIT 1;
  
  IF user_id IS NOT NULL THEN
    -- Check if the user already has a company
    SELECT id INTO company_id FROM companies WHERE owner_id = user_id LIMIT 1;
    
    -- If no company exists, create one
    IF company_id IS NULL THEN
      INSERT INTO companies (name, owner_id)
      VALUES ('Default Company', user_id)
      RETURNING id INTO company_id;
      
      -- Create admin permission for the owner
      INSERT INTO user_permissions (user_id, company_id, role)
      VALUES (user_id, company_id, 'admin');
      
      -- Create a sample marketing plan
      INSERT INTO marketing_plans (
        title, 
        description, 
        owner_id, 
        company_id, 
        status, 
        team_members, 
        client_visible
      )
      VALUES (
        'Sample Marketing Plan', 
        'This is a sample marketing plan created automatically', 
        user_id, 
        company_id, 
        'draft', 
        ARRAY[user_id], 
        true
      );
    END IF;
  END IF;
END
$$;