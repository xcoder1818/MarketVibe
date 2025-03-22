/*
  # Update Marketing Plan States and Permissions

  1. Changes
    - Add new plan states
    - Add reviewer and approver fields
    - Add review and approval tracking
    - Update permissions system for plan visibility
  
  2. Security
    - Add policies for plan visibility based on state
    - Add policies for state transitions
*/

-- Update plan status enum
ALTER TABLE marketing_plans DROP CONSTRAINT IF EXISTS marketing_plans_status_check;
ALTER TABLE marketing_plans ADD CONSTRAINT marketing_plans_status_check 
  CHECK (status IN ('draft', 'internal_review', 'approval', 'approved', 'active', 'completed'));

-- Add reviewer and approver fields
ALTER TABLE marketing_plans 
  ADD COLUMN reviewer_id UUID REFERENCES auth.users(id),
  ADD COLUMN approver_id UUID REFERENCES auth.users(id),
  ADD COLUMN review_status TEXT CHECK (review_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN review_comments TEXT,
  ADD COLUMN approval_comments TEXT,
  ADD COLUMN review_date TIMESTAMPTZ,
  ADD COLUMN approval_date TIMESTAMPTZ;

-- Drop existing policies
DROP POLICY IF EXISTS "plans_select_owner" ON marketing_plans;
DROP POLICY IF EXISTS "plans_select_member" ON marketing_plans;
DROP POLICY IF EXISTS "plans_insert" ON marketing_plans;
DROP POLICY IF EXISTS "plans_update_owner" ON marketing_plans;
DROP POLICY IF EXISTS "plans_delete_owner" ON marketing_plans;

-- Create new policies for plan visibility
CREATE POLICY "view_draft_plans"
  ON marketing_plans
  FOR SELECT
  USING (
    status = 'draft' AND (
      auth.uid() = owner_id OR
      auth.uid() = ANY(team_members) OR
      EXISTS (
        SELECT 1 FROM user_permissions
        WHERE user_permissions.user_id = auth.uid()
        AND user_permissions.company_id = marketing_plans.company_id
        AND user_permissions.role = 'admin'
      )
    )
  );

CREATE POLICY "view_review_plans"
  ON marketing_plans
  FOR SELECT
  USING (
    status IN ('internal_review', 'approval') AND (
      auth.uid() = owner_id OR
      auth.uid() = reviewer_id OR
      auth.uid() = approver_id OR
      auth.uid() = ANY(team_members) OR
      EXISTS (
        SELECT 1 FROM user_permissions
        WHERE user_permissions.user_id = auth.uid()
        AND user_permissions.company_id = marketing_plans.company_id
        AND user_permissions.role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "view_public_plans"
  ON marketing_plans
  FOR SELECT
  USING (
    status IN ('approved', 'active', 'completed') AND (
      auth.uid() = owner_id OR
      auth.uid() = ANY(team_members) OR
      EXISTS (
        SELECT 1 FROM user_permissions
        WHERE user_permissions.user_id = auth.uid()
        AND user_permissions.company_id = marketing_plans.company_id
      )
    )
  );

-- Create policies for plan updates
CREATE POLICY "update_draft_plans"
  ON marketing_plans
  FOR UPDATE
  USING (
    status = 'draft' AND (
      auth.uid() = owner_id OR
      EXISTS (
        SELECT 1 FROM user_permissions
        WHERE user_permissions.user_id = auth.uid()
        AND user_permissions.company_id = marketing_plans.company_id
        AND user_permissions.role = 'admin'
      )
    )
  );

CREATE POLICY "update_review_status"
  ON marketing_plans
  FOR UPDATE
  USING (
    status = 'internal_review' AND
    auth.uid() = reviewer_id
  );

CREATE POLICY "update_approval_status"
  ON marketing_plans
  FOR UPDATE
  USING (
    status = 'approval' AND
    auth.uid() = approver_id
  );

CREATE POLICY "update_active_plans"
  ON marketing_plans
  FOR UPDATE
  USING (
    status IN ('approved', 'active') AND (
      auth.uid() = owner_id OR
      EXISTS (
        SELECT 1 FROM user_permissions
        WHERE user_permissions.user_id = auth.uid()
        AND user_permissions.company_id = marketing_plans.company_id
        AND user_permissions.role IN ('admin', 'manager')
      )
    )
  );

-- Create policy for plan creation
CREATE POLICY "create_plans"
  ON marketing_plans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.company_id = marketing_plans.company_id
      AND user_permissions.role IN ('admin', 'manager')
    )
  );

-- Create policy for plan deletion
CREATE POLICY "delete_plans"
  ON marketing_plans
  FOR DELETE
  USING (
    status = 'draft' AND (
      auth.uid() = owner_id OR
      EXISTS (
        SELECT 1 FROM user_permissions
        WHERE user_permissions.user_id = auth.uid()
        AND user_permissions.company_id = marketing_plans.company_id
        AND user_permissions.role = 'admin'
      )
    )
  );

-- Add function to validate state transitions
CREATE OR REPLACE FUNCTION check_plan_state_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow specific state transitions
  IF OLD.status = 'draft' AND NEW.status NOT IN ('draft', 'internal_review') THEN
    RAISE EXCEPTION 'Invalid state transition from draft';
  END IF;

  IF OLD.status = 'internal_review' AND NEW.status NOT IN ('internal_review', 'draft', 'approval') THEN
    RAISE EXCEPTION 'Invalid state transition from internal review';
  END IF;

  IF OLD.status = 'approval' AND NEW.status NOT IN ('approval', 'internal_review', 'approved') THEN
    RAISE EXCEPTION 'Invalid state transition from approval';
  END IF;

  IF OLD.status = 'approved' AND NEW.status NOT IN ('approved', 'active') THEN
    RAISE EXCEPTION 'Invalid state transition from approved';
  END IF;

  IF OLD.status = 'active' AND NEW.status NOT IN ('active', 'completed') THEN
    RAISE EXCEPTION 'Invalid state transition from active';
  END IF;

  IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    RAISE EXCEPTION 'Cannot transition from completed state';
  END IF;

  -- Set review/approval dates when statuses change
  IF NEW.review_status = 'approved' AND OLD.review_status != 'approved' THEN
    NEW.review_date := CURRENT_TIMESTAMP;
  END IF;

  IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
    NEW.approval_date := CURRENT_TIMESTAMP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for state transitions
DROP TRIGGER IF EXISTS check_plan_state_transition_trigger ON marketing_plans;
CREATE TRIGGER check_plan_state_transition_trigger
  BEFORE UPDATE ON marketing_plans
  FOR EACH ROW
  EXECUTE FUNCTION check_plan_state_transition();