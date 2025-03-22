/*
  # Initial Schema for Marketing Plan Manager

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `avatar_url` (text)
      - `created_at` (timestamptz)
    - `marketing_plans`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `owner_id` (uuid, references auth.users)
      - `status` (text)
      - `team_members` (uuid[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `marketing_tasks`
      - `id` (uuid, primary key)
      - `plan_id` (uuid, references marketing_plans)
      - `title` (text)
      - `description` (text)
      - `due_date` (timestamptz)
      - `status` (text)
      - `assigned_to` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `calendar_events`
      - `id` (uuid, primary key)
      - `plan_id` (uuid, references marketing_plans)
      - `task_id` (uuid, references marketing_tasks)
      - `title` (text)
      - `description` (text)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `documents`
      - `id` (uuid, primary key)
      - `plan_id` (uuid, references marketing_plans)
      - `title` (text)
      - `content` (text)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create marketing_plans table
CREATE TABLE IF NOT EXISTS marketing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'archived')) DEFAULT 'draft',
  team_members UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create marketing_tasks table
CREATE TABLE IF NOT EXISTS marketing_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES marketing_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'completed')) DEFAULT 'todo',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES marketing_plans(id) ON DELETE CASCADE,
  task_id UUID REFERENCES marketing_tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES marketing_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Marketing Plans policies
CREATE POLICY "Users can view plans they own or are members of"
  ON marketing_plans
  FOR SELECT
  USING (
    auth.uid() = owner_id OR 
    auth.uid() = ANY(team_members)
  );

CREATE POLICY "Users can insert their own plans"
  ON marketing_plans
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update plans they own"
  ON marketing_plans
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete plans they own"
  ON marketing_plans
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Marketing Tasks policies
CREATE POLICY "Users can view tasks for plans they have access to"
  ON marketing_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = marketing_tasks.plan_id
      AND (
        marketing_plans.owner_id = auth.uid() OR
        auth.uid() = ANY(marketing_plans.team_members)
      )
    )
  );

CREATE POLICY "Users can insert tasks for plans they have access to"
  ON marketing_tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = marketing_tasks.plan_id
      AND (
        marketing_plans.owner_id = auth.uid() OR
        auth.uid() = ANY(marketing_plans.team_members)
      )
    )
  );

CREATE POLICY "Users can update tasks for plans they have access to"
  ON marketing_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = marketing_tasks.plan_id
      AND (
        marketing_plans.owner_id = auth.uid() OR
        auth.uid() = ANY(marketing_plans.team_members)
      )
    )
  );

CREATE POLICY "Users can delete tasks for plans they have access to"
  ON marketing_tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = marketing_tasks.plan_id
      AND (
        marketing_plans.owner_id = auth.uid() OR
        auth.uid() = ANY(marketing_plans.team_members)
      )
    )
  );

-- Calendar Events policies
CREATE POLICY "Users can view events for plans they have access to"
  ON calendar_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = calendar_events.plan_id
      AND (
        marketing_plans.owner_id = auth.uid() OR
        auth.uid() = ANY(marketing_plans.team_members)
      )
    )
  );

CREATE POLICY "Users can insert events for plans they have access to"
  ON calendar_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = calendar_events.plan_id
      AND (
        marketing_plans.owner_id = auth.uid() OR
        auth.uid() = ANY(marketing_plans.team_members)
      )
    )
  );

CREATE POLICY "Users can update events for plans they have access to"
  ON calendar_events
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = calendar_events.plan_id
      AND (
        marketing_plans.owner_id = auth.uid() OR
        auth.uid() = ANY(marketing_plans.team_members)
      )
    )
  );

CREATE POLICY "Users can delete events for plans they have access to"
  ON calendar_events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = calendar_events.plan_id
      AND (
        marketing_plans.owner_id = auth.uid() OR
        auth.uid() = ANY(marketing_plans.team_members)
      )
    )
  );

-- Documents policies
CREATE POLICY "Users can view documents for plans they have access to"
  ON documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = documents.plan_id
      AND (
        marketing_plans.owner_id = auth.uid() OR
        auth.uid() = ANY(marketing_plans.team_members)
      )
    )
  );

CREATE POLICY "Users can insert documents for plans they have access to"
  ON documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = documents.plan_id
      AND (
        marketing_plans.owner_id = auth.uid() OR
        auth.uid() = ANY(marketing_plans.team_members)
      )
    )
  );

CREATE POLICY "Users can update documents they created or for plans they own"
  ON documents
  FOR UPDATE
  USING (
    documents.created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = documents.plan_id
      AND marketing_plans.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents they created or for plans they own"
  ON documents
  FOR DELETE
  USING (
    documents.created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM marketing_plans
      WHERE marketing_plans.id = documents.plan_id
      AND marketing_plans.owner_id = auth.uid()
    )
  );

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_marketing_plans_updated_at
BEFORE UPDATE ON marketing_plans
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_marketing_tasks_updated_at
BEFORE UPDATE ON marketing_tasks
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON calendar_events
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_modified_column();