/*
  # Add UI Fields for Plan States

  1. Changes
    - Add strategy overview field
    - Add UI-specific fields for plan management
    - Add fields for tracking review/approval progress
*/

-- Add UI-specific fields to marketing_plans
ALTER TABLE marketing_plans 
  ADD COLUMN strategy_overview TEXT,
  ADD COLUMN review_progress INTEGER DEFAULT 0,
  ADD COLUMN approval_progress INTEGER DEFAULT 0,
  ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN last_reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN last_reviewed_at TIMESTAMPTZ;

-- Add function to update last activity timestamp
CREATE OR REPLACE FUNCTION update_plan_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for last activity
CREATE TRIGGER update_plan_last_activity_trigger
  BEFORE UPDATE ON marketing_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_last_activity();

-- Add index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_marketing_plans_status ON marketing_plans(status);

-- Add index for company filtering
CREATE INDEX IF NOT EXISTS idx_marketing_plans_company ON marketing_plans(company_id);

-- Add index for reviewer/approver lookup
CREATE INDEX IF NOT EXISTS idx_marketing_plans_reviewers ON marketing_plans(reviewer_id, approver_id);