import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { MarketingPlan, MarketingTask, Document, MarketingActivity, SubTask, ReviewAction, ApprovalAction } from '../types';
import { getActivityTypeInfo } from '../utils/activityTypes';

interface MarketingPlanState {
  plans: MarketingPlan[];
  currentPlan: MarketingPlan | null;
  tasks: MarketingTask[];
  documents: Document[];
  activities: MarketingActivity[];
  activityTemplates: MarketingActivity[];
  visibleCalendars: string[];
  loading: boolean;
  error: string | null;
  
  // Plans
  fetchPlans: (companyId?: string) => Promise<void>;
  createPlan: (plan: Omit<MarketingPlan, 'id' | 'created_at' | 'updated_at' | 'last_activity_at'>, templateId?: string) => Promise<MarketingPlan | null>;
  updatePlan: (id: string, updates: Partial<MarketingPlan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  
  // Plan Review/Approval
  sendToReview: (planId: string, reviewerId: string) => Promise<void>;
  reviewPlan: (planId: string, action: ReviewAction) => Promise<void>;
  sendToApproval: (planId: string, approverId: string) => Promise<void>;
  approvePlan: (planId: string, action: ApprovalAction) => Promise<void>;
  activatePlan: (planId: string) => Promise<void>;
  completePlan: (planId: string) => Promise<void>;
  
  // Tasks
  fetchTasks: (planId: string) => Promise<void>;
  createTask: (task: Omit<MarketingTask, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<MarketingTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Documents
  fetchDocuments: (planId: string) => Promise<void>;
  createDocument: (document: Omit<Document, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  
  // Activities
  fetchActivities: (planId: string) => Promise<void>;
  fetchActivityTemplates: () => Promise<void>;
  createActivity: (activity: Omit<MarketingActivity, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  createActivityFromType: (activityType: string, planId: string) => Promise<void>;
  createActivityTemplate: (activity: Omit<MarketingActivity, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateActivity: (id: string, updates: Partial<MarketingActivity>) => Promise<void>;
  updateSubtask: (activityId: string, subtaskId: string, updates: Partial<SubTask>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  
  // Calendar
  toggleCalendarVisibility: (planId: string) => void;
  isCalendarVisible: (planId: string) => boolean;
  
  // Dependencies
  checkActivityDependencies: (activityId: string) => boolean;
  checkSubtaskDependencies: (activityId: string, subtaskId: string) => boolean;
}

export const useMarketingPlanStore = create<MarketingPlanState>((set, get) => ({
  plans: [],
  currentPlan: null,
  tasks: [],
  documents: [],
  activities: [],
  activityTemplates: [],
  visibleCalendars: [],
  loading: false,
  error: null,

  // Add new methods for plan state transitions
  sendToReview: async (planId: string, reviewerId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('marketing_plans')
        .update({
          status: 'internal_review',
          reviewer_id: reviewerId,
          review_status: 'pending',
          review_progress: 0
        })
        .eq('id', planId);

      if (error) throw error;

      set(state => ({
        plans: state.plans.map(plan =>
          plan.id === planId
            ? {
                ...plan,
                status: 'internal_review',
                reviewer_id: reviewerId,
                review_status: 'pending',
                review_progress: 0
              }
            : plan
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  reviewPlan: async (planId: string, action: ReviewAction) => {
    try {
      set({ loading: true, error: null });
      
      const updates = {
        review_status: action.status,
        review_comments: action.comments,
        review_date: new Date().toISOString(),
        status: action.status === 'approved' ? 'internal_review' : 'draft',
        review_progress: action.status === 'approved' ? 100 : 0
      };

      const { error } = await supabase
        .from('marketing_plans')
        .update(updates)
        .eq('id', planId);

      if (error) throw error;

      set(state => ({
        plans: state.plans.map(plan =>
          plan.id === planId
            ? { ...plan, ...updates }
            : plan
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  sendToApproval: async (planId: string, approverId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('marketing_plans')
        .update({
          status: 'approval',
          approver_id: approverId,
          approval_status: 'pending',
          approval_progress: 0
        })
        .eq('id', planId);

      if (error) throw error;

      set(state => ({
        plans: state.plans.map(plan =>
          plan.id === planId
            ? {
                ...plan,
                status: 'approval',
                approver_id: approverId,
                approval_status: 'pending',
                approval_progress: 0
              }
            : plan
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  approvePlan: async (planId: string, action: ApprovalAction) => {
    try {
      set({ loading: true, error: null });
      
      const updates = {
        approval_status: action.status,
        approval_comments: action.comments,
        approval_date: new Date().toISOString(),
        status: action.status === 'approved' ? 'approved' : 'internal_review',
        approval_progress: action.status === 'approved' ? 100 : 0
      };

      const { error } = await supabase
        .from('marketing_plans')
        .update(updates)
        .eq('id', planId);

      if (error) throw error;

      set(state => ({
        plans: state.plans.map(plan =>
          plan.id === planId
            ? { ...plan, ...updates }
            : plan
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  activatePlan: async (planId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('marketing_plans')
        .update({ status: 'active' })
        .eq('id', planId);

      if (error) throw error;

      set(state => ({
        plans: state.plans.map(plan =>
          plan.id === planId
            ? { ...plan, status: 'active' }
            : plan
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  completePlan: async (planId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('marketing_plans')
        .update({ status: 'completed' })
        .eq('id', planId);

      if (error) throw error;

      set(state => ({
        plans: state.plans.map(plan =>
          plan.id === planId
            ? { ...plan, status: 'completed' }
            : plan
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchPlans: async (companyId) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock data
      const mockPlans: MarketingPlan[] = [
        {
          id: 'plan1',
          title: 'Q1 Marketing Strategy',
          description: 'Comprehensive marketing strategy for Q1 2025',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_id: 'user123',
          company_id: 'company1',
          status: 'active',
          team_members: ['user123', 'user456'],
          client_visible: true,
          last_activity_at: new Date().toISOString()
        },
        {
          id: 'plan2',
          title: 'Product Launch Campaign',
          description: 'Marketing campaign for new product launch',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_id: 'user123',
          company_id: 'company1',
          status: 'draft',
          team_members: ['user123'],
          client_visible: true,
          last_activity_at: new Date().toISOString()
        }
      ];
      
      // Filter plans by company if specified
      const filteredPlans = companyId 
        ? mockPlans.filter(plan => plan.company_id === companyId)
        : mockPlans;
      
      set({ plans: filteredPlans, loading: false });
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      set({ error: error.message, loading: false });
    }
  },

  createPlan: async (plan, templateId) => {
    try {
      set({ loading: true, error: null });
      
      // Create new plan
      const newPlan: MarketingPlan = {
        ...plan,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      };
      
      // If using a template, copy its activities
      if (templateId) {
        const template = get().templates.find(t => t.id === templateId);
        if (template) {
          // Create activities from template, but without the fixed flag
          const activities = template.activities.map(activity => ({
            ...activity,
            id: uuidv4(),
            plan_id: newPlan.id,
            fixed: false, // Remove fixed flag when creating from template
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          
          // Add activities to the store
          set(state => ({
            activities: [...state.activities, ...activities]
          }));
        }
      }
      
      set(state => ({ 
        plans: [...state.plans, newPlan],
        loading: false 
      }));

      return newPlan;
    } catch (error: any) {
      console.error("Error creating plan:", error);
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updatePlan: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set(state => ({
        plans: state.plans.map(plan => 
          plan.id === id 
            ? { 
                ...plan, 
                ...updates, 
                updated_at: new Date().toISOString(),
                last_activity_at: new Date().toISOString()
              }
            : plan
        ),
        loading: false
      }));
    } catch (error: any) {
      console.error("Error updating plan:", error);
      set({ error: error.message, loading: false });
    }
  },

  deletePlan: async (id) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set(state => ({
        plans: state.plans.filter(plan => plan.id !== id),
        loading: false
      }));
    } catch (error: any) {
      console.error("Error deleting plan:", error);
      set({ error: error.message, loading: false });
    }
  },

  fetchTasks: async (planId) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock data
      const mockTasks: MarketingTask[] = [
        {
          id: 'task1',
          plan_id: planId,
          title: 'Research competitors',
          description: 'Analyze top 5 competitors marketing strategies',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'in_progress',
          assigned_to: 'user123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'task2',
          plan_id: planId,
          title: 'Create content calendar',
          description: 'Plan content for next 3 months',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'todo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      set({ tasks: mockTasks, loading: false });
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      set({ error: error.message, loading: false });
    }
  },

  createTask: async (task) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newTask: MarketingTask = {
        ...task,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      set(state => ({ 
        tasks: [...state.tasks, newTask],
        loading: false 
      }));
    } catch (error: any) {
      console.error("Error creating task:", error);
      set({ error: error.message, loading: false });
    }
  },

  updateTask: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === id 
            ? { 
                ...task, 
                ...updates, 
                updated_at: new Date().toISOString() 
              }
            : task
        ),
        loading: false
      }));
    } catch (error: any) {
      console.error("Error updating task:", error);
      set({ error: error.message, loading: false });
    }
  },

  deleteTask: async (id) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        loading: false
      }));
    } catch (error: any) {
      console.error("Error deleting task:", error);
      set({ error: error.message, loading: false });
    }
  },

  fetchDocuments: async (planId) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock data
      const mockDocuments: Document[] = [
        {
          id: 'doc1',
          plan_id: planId,
          title: 'Marketing Strategy Overview',
          content: '# Marketing Strategy\n\nThis document outlines our marketing strategy...',
          created_by: 'user123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'doc2',
          plan_id: planId,
          title: 'Content Guidelines',
          content: '# Content Guidelines\n\nFollow these guidelines when creating content...',
          created_by: 'user456',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      set({ documents: mockDocuments, loading: false });
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      set({ error: error.message, loading: false });
    }
  },

  createDocument: async (document) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newDocument: Document = {
        ...document,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      set(state => ({ 
        documents: [...state.documents, newDocument],
        loading: false 
      }));
    } catch (error: any) {
      console.error("Error creating document:", error);
      set({ error: error.message, loading: false });
    }
  },

  updateDocument: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set(state => ({
        documents: state.documents.map(doc => 
          doc.id === id 
            ? { 
                ...doc, 
                ...updates, 
                updated_at: new Date().toISOString() 
              }
            : doc
        ),
        loading: false
      }));
    } catch (error: any) {
      console.error("Error updating document:", error);
      set({ error: error.message, loading: false });
    }
  },

  deleteDocument: async (id) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set(state => ({
        documents: state.documents.filter(doc => doc.id !== id),
        loading: false
      }));
    } catch (error: any) {
      console.error("Error deleting document:", error);
      set({ error: error.message, loading: false });
    }
  },

  fetchActivities: async (planId) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock data
      const mockActivities: MarketingActivity[] = [
        {
          id: '1',
          plan_id: planId,
          title: 'Blog Post: Industry Trends',
          description: 'Write a blog post about current industry trends',
          activity_type: 'blog_article',
          status: 'in_progress',
          publish_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          assigned_to: 'user123',
          dependencies: [],
          has_form: false,
          subtasks: [
            { 
              id: '1-1', 
              title: 'Research topic', 
              status: 'completed',
              start_date: new Date().toISOString(),
              due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              duration: 2
            }
          ],
          is_template: false,
          client_visible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      set({ activities: mockActivities, loading: false });
    } catch (error: any) {
      console.error("Error fetching activities:", error);
      set({ error: error.message, loading: false });
    }
  },

  fetchActivityTemplates: async () => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock data
      const mockTemplates: MarketingActivity[] = [
        {
          id: 'template-1',
          plan_id: 'template',
          title: 'Blog Post Template',
          description: 'Standard blog post template with research, writing, and publishing steps',
          activity_type: 'blog_article',
          status: 'not_started',
          publish_date: new Date().toISOString(),
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          assigned_to: '',
          dependencies: [],
          has_form: false,
          subtasks: [
            { 
              id: 't1-1', 
              title: 'Research topic', 
              status: 'todo',
              start_date: new Date().toISOString(),
              due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              duration: 2
            }
          ],
          is_template: true,
          client_visible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      set({ activityTemplates: mockTemplates, loading: false });
    } catch (error: any) {
      console.error("Error fetching activity templates:", error);
      set({ error: error.message, loading: false });
    }
  },

  createActivity: async (activity) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newActivity: MarketingActivity = {
        ...activity,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      set(state => ({ 
        activities: [...state.activities, newActivity],
        loading: false 
      }));
    } catch (error: any) {
      console.error("Error creating activity:", error);
      set({ error: error.message, loading: false });
    }
  },

  createActivityFromType: async (activityType, planId) => {
    try {
      set({ loading: true, error: null });
      
      // Get activity type info
      const typeInfo = getActivityTypeInfo(activityType);
      
      // Create new activity
      const newActivity: MarketingActivity = {
        id: uuidv4(),
        plan_id: planId,
        title: `New ${typeInfo.name}`,
        description: typeInfo.description,
        activity_type: activityType,
        status: 'not_started',
        publish_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_to: '',
        dependencies: [],
        has_form: typeInfo.includesForm,
        subtasks: typeInfo.defaultSubtasks,
        is_template: false,
        client_visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      set(state => ({ 
        activities: [...state.activities, newActivity],
        loading: false 
      }));
    } catch (error: any) {
      console.error("Error creating activity from type:", error);
      set({ error: error.message, loading: false });
    }
  },

  createActivityTemplate: async (activity) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newTemplate: MarketingActivity = {
        ...activity,
        id: uuidv4(),
        is_template: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      set(state => ({ 
        activityTemplates: [...state.activityTemplates, newTemplate],
        loading: false 
      }));
    } catch (error: any) {
      console.error("Error creating activity template:", error);
      set({ error: error.message, loading: false });
    }
  },

  updateActivity: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set(state => ({
        activities: state.activities.map(activity => 
          activity.id === id 
            ? { 
                ...activity, 
                ...updates, 
                updated_at: new Date().toISOString() 
              }
            : activity
        ),
        loading: false
      }));
    } catch (error: any) {
      console.error("Error updating activity:", error);
      set({ error: error.message, loading: false });
    }
  },

  updateSubtask: async (activityId, subtaskId, updates) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set(state => ({
        activities: state.activities.map(activity => 
          activity.id === activityId
            ? {
                ...activity,
                subtasks: activity.subtasks.map(subtask =>
                  subtask.id === subtaskId
                    ? { ...subtask, ...updates }
                    : subtask
                ),
                updated_at: new Date().toISOString()
              }
            : activity
        ),
        loading: false
      }));
    } catch (error: any) {
      console.error("Error updating subtask:", error);
      set({ error: error.message, loading: false });
    }
  },

  deleteActivity: async (id) => {
    try {
      set({ loading: true, error: null });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set(state => ({
        activities: state.activities.filter(activity => activity.id !== id),
        loading: false
      }));
    } catch (error: any) {
      console.error("Error deleting activity:", error);
      set({ error: error.message, loading: false });
    }
  },

  toggleCalendarVisibility: (planId) => {
    set(state => ({
      visibleCalendars: state.visibleCalendars.includes(planId)
        ? state.visibleCalendars.filter(id => id !== planId)
        : [...state.visibleCalendars, planId]
    }));
  },

  isCalendarVisible: (planId) => {
    return get().visibleCalendars.includes(planId);
  },

  checkActivityDependencies: (activityId) => {
    const { activities } = get();
    const activity = activities.find(a => a.id === activityId);
    
    if (!activity) return true;
    
    // Check if all dependencies are completed
    return activity.dependencies.every(depId => {
      const dependency = activities.find(a => a.id === depId);
      return dependency && dependency.status === 'completed';
    });
  },

  checkSubtaskDependencies: (activityId, subtaskId) => {
    const { activities } = get();
    const activity = activities.find(a => a.id === activityId);
    
    if (!activity) return true;
    
    const subtask = activity.subtasks.find(s => s.id === subtaskId);
    if (!subtask || !subtask.dependencies) return true;
    
    // Check if all dependencies are completed
    return subtask.dependencies.every(depId => {
      const dependency = activity.subtasks.find(s => s.id === depId);
      return dependency && dependency.status === 'completed';
    });
  }
}));

