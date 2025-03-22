// Update MarketingPlan type to include new fields
export interface MarketingPlan {
  id: string;
  title: string;
  description: string;
  strategy_overview?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  company_id: string;
  status: 'draft' | 'internal_review' | 'approval' | 'approved' | 'active' | 'completed';
  team_members: string[];
  client_visible: boolean;
  reviewer_id?: string;
  approver_id?: string;
  review_status?: 'pending' | 'approved' | 'rejected';
  approval_status?: 'pending' | 'approved' | 'rejected';
  review_comments?: string;
  approval_comments?: string;
  review_date?: string;
  approval_date?: string;
  review_progress?: number;
  approval_progress?: number;
  last_activity_at: string;
  last_reviewed_by?: string;
  last_reviewed_at?: string;
  template_id?: string;
  fixed_activities?: boolean;
}

// Add new types for review/approval
export interface ReviewAction {
  status: 'approved' | 'rejected';
  comments?: string;
}

export interface ApprovalAction {
  status: 'approved' | 'rejected';
  comments?: string;
}

// Add new types for templates
export interface PlanTemplate {
  id: string;
  title: string;
  description: string;
  strategy_overview?: string;
  company_id?: string;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  activities: TemplateActivity[];
  fixed_activities?: boolean;
}

export interface TemplateActivity {
  id: string;
  template_id: string;
  title: string;
  description: string;
  activity_type: ActivityType;
  duration: number;
  order_index: number;
  dependencies: string[];
  has_form: boolean;
  created_at: string;
  updated_at: string;
  fixed?: boolean;
}

// Add new types for ideation
export interface IdeaComment {
  id: string;
  idea_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface IdeaAttachment {
  id: string;
  idea_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export interface IdeaReference {
  id: string;
  idea_id: string;
  title: string;
  url: string;
  description?: string;
  created_at: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  type: 'blog' | 'social' | 'website' | 'email' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'in_review' | 'approved' | 'in_plan';
  created_by: string;
  company_id: string;
  plan_id?: string;
  created_at: string;
  updated_at: string;
  comments: IdeaComment[];
  attachments: IdeaAttachment[];
  references: IdeaReference[];
  tags: string[];
  ai_generated?: boolean;
  ai_suggestions?: {
    outline?: string;
    keywords?: string[];
    related_ideas?: Partial<Idea>[];
    last_generated?: string;
  };
}

export type ActivityType = 
  | 'blog_article'
  | 'full_web_page'
  | 'landing_page'
  | 'social_post'
  | 'automated_email'
  | 'email_campaign'
  | 'meta_advertising'
  | 'google_advertising'
  | 'linkedin_advertising'
  | 'custom';

export interface ActivityTypeInfo {
  id: ActivityType;
  name: string;
  description: string;
  icon: string;
  color: string;
  logo: string;
  defaultSubtasks: SubTask[];
  includesForm: boolean;
}

export interface SubTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  start_date?: string;
  due_date?: string;
  duration?: number;
  assigned_to?: string;
  dependencies?: string[];
  fixed?: boolean;
  task_duration_hours?: number;
  task_duration_minutes?: number;
  calendar_synced?: boolean;
  calendar_event_id?: string;
  calendar_provider?: 'google' | 'microsoft';
}

export interface MarketingActivity {
  id: string;
  plan_id: string;
  title: string;
  description: string;
  activity_type: ActivityType;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  publish_date: string;
  start_date: string;
  end_date: string;
  assigned_to: string;
  dependencies: string[];
  has_form: boolean;
  budget?: number;
  subtasks: SubTask[];
  is_template: boolean;
  client_visible: boolean;
  created_at: string;
  updated_at: string;
  fixed?: boolean;
}

export interface MarketingTask {
  id: string;
  plan_id: string;
  title: string;
  description?: string;
  due_date: string;
  status: 'todo' | 'in_progress' | 'completed';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  plan_id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'admin' | 'manager' | 'client' | 'viewer';
  company_id?: string;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  company_id: string;
  role: 'admin' | 'manager' | 'client' | 'viewer';
  created_at: string;
  updated_at: string;
}