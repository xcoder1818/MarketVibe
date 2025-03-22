/*
  # Fix user permissions and add default data

  1. Changes
    - Add default company and user permissions
    - Ensure proper access to user data
*/

-- Create a default company if none exists
INSERT INTO companies (name, owner_id)
SELECT 'Default Company', auth.uid()
FROM auth.users
WHERE auth.uid() IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;

-- Create a default user permission for the company owner
INSERT INTO user_permissions (user_id, company_id, role)
SELECT owner_id, id, 'admin'
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM user_permissions 
  WHERE user_permissions.user_id = companies.owner_id 
  AND user_permissions.company_id = companies.id
)
ON CONFLICT DO NOTHING;

-- Add a policy to allow users to view all companies they own
DROP POLICY IF EXISTS "Users can view owned companies" ON companies;
CREATE POLICY "Users can view owned companies"
  ON companies
  FOR SELECT
  USING (owner_id = auth.uid());

-- Add a policy to allow users to view all companies they have permissions for
DROP POLICY IF EXISTS "Users can view companies with permissions" ON companies;
CREATE POLICY "Users can view companies with permissions"
  ON companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.company_id = companies.id
      AND user_permissions.user_id = auth.uid()
    )
  );

-- Ensure users can view their own permissions
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
CREATE POLICY "Users can view own permissions"
  ON user_permissions
  FOR SELECT
  USING (user_id = auth.uid());