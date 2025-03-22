import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { PlanTemplate, TemplateActivity } from '../types';

interface TemplateState {
  templates: PlanTemplate[];
  selectedTemplate: PlanTemplate | null;
  loading: boolean;
  error: string | null;

  // Template management
  fetchTemplates: (companyId?: string) => Promise<void>;
  createTemplate: (template: Omit<PlanTemplate, 'id' | 'created_at' | 'updated_at' | 'activities'>) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<PlanTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  setSelectedTemplate: (template: PlanTemplate | null) => void;

  // Template activities
  addActivity: (templateId: string, activity: Omit<TemplateActivity, 'id' | 'template_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateActivity: (templateId: string, activityId: string, updates: Partial<TemplateActivity>) => Promise<void>;
  deleteActivity: (templateId: string, activityId: string) => Promise<void>;
  reorderActivities: (templateId: string, activityIds: string[]) => Promise<void>;
  toggleActivityFixed: (templateId: string, activityId: string) => Promise<void>;
  setTemplateFixedActivities: (templateId: string, fixed: boolean) => Promise<void>;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  selectedTemplate: null,
  loading: false,
  error: null,

  fetchTemplates: async (companyId) => {
    try {
      set({ loading: true, error: null });
      
      // First fetch templates
      const { data: templates, error: templateError } = await supabase
        .from('marketing_plan_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templateError) throw templateError;

      // Then fetch activities for each template
      const templatesWithActivities = await Promise.all(
        (templates || []).map(async (template) => {
          const { data: activities, error: activitiesError } = await supabase
            .from('template_activities')
            .select('*')
            .eq('template_id', template.id)
            .order('order_index', { ascending: true });

          if (activitiesError) throw activitiesError;

          return {
            ...template,
            activities: activities || []
          };
        })
      );

      // Filter templates based on company ID and public status
      const filteredTemplates = templatesWithActivities.filter(template => 
        template.is_public || (companyId && template.company_id === companyId)
      );

      set({ templates: filteredTemplates, loading: false });
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      set({ error: error.message, loading: false });
    }
  },

  createTemplate: async (template) => {
    try {
      set({ loading: true, error: null });
      
      const newTemplate = {
        ...template,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('marketing_plan_templates')
        .insert([{
          title: newTemplate.title,
          description: newTemplate.description,
          strategy_overview: newTemplate.strategy_overview,
          company_id: newTemplate.company_id,
          is_public: newTemplate.is_public,
          fixed_activities: newTemplate.fixed_activities,
          created_by: newTemplate.created_by
        }])
        .select()
        .single();

      if (error) throw error;

      set(state => ({ 
        templates: [...state.templates, { ...data, activities: [] }],
        loading: false 
      }));
    } catch (error: any) {
      console.error('Error creating template:', error);
      set({ error: error.message, loading: false });
    }
  },

  updateTemplate: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('marketing_plan_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        templates: state.templates.map(template =>
          template.id === id
            ? { ...template, ...updates, updated_at: new Date().toISOString() }
            : template
        ),
        selectedTemplate: state.selectedTemplate?.id === id
          ? { ...state.selectedTemplate, ...updates, updated_at: new Date().toISOString() }
          : state.selectedTemplate,
        loading: false
      }));
    } catch (error: any) {
      console.error('Error updating template:', error);
      set({ error: error.message, loading: false });
    }
  },

  deleteTemplate: async (id) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('marketing_plan_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        templates: state.templates.filter(template => template.id !== id),
        selectedTemplate: state.selectedTemplate?.id === id ? null : state.selectedTemplate,
        loading: false
      }));
    } catch (error: any) {
      console.error('Error deleting template:', error);
      set({ error: error.message, loading: false });
    }
  },

  setSelectedTemplate: (template) => {
    set({ selectedTemplate: template });
  },

  addActivity: async (templateId, activity) => {
    try {
      set({ loading: true, error: null });
      
      const template = get().templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const newActivity = {
        ...activity,
        id: uuidv4(),
        template_id: templateId,
        fixed: template.fixed_activities, // Inherit fixed status from template
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('template_activities')
        .insert([newActivity])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        templates: state.templates.map(template =>
          template.id === templateId
            ? { ...template, activities: [...template.activities, data] }
            : template
        ),
        selectedTemplate: state.selectedTemplate?.id === templateId
          ? { ...state.selectedTemplate, activities: [...state.selectedTemplate.activities, data] }
          : state.selectedTemplate,
        loading: false
      }));
    } catch (error: any) {
      console.error('Error adding activity:', error);
      set({ error: error.message, loading: false });
    }
  },

  updateActivity: async (templateId, activityId, updates) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('template_activities')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', activityId)
        .eq('template_id', templateId);

      if (error) throw error;

      set(state => ({
        templates: state.templates.map(template =>
          template.id === templateId
            ? {
                ...template,
                activities: template.activities.map(activity =>
                  activity.id === activityId
                    ? { ...activity, ...updates, updated_at: new Date().toISOString() }
                    : activity
                )
              }
            : template
        ),
        selectedTemplate: state.selectedTemplate?.id === templateId
          ? {
              ...state.selectedTemplate,
              activities: state.selectedTemplate.activities.map(activity =>
                activity.id === activityId
                  ? { ...activity, ...updates, updated_at: new Date().toISOString() }
                  : activity
              )
            }
          : state.selectedTemplate,
        loading: false
      }));
    } catch (error: any) {
      console.error('Error updating activity:', error);
      set({ error: error.message, loading: false });
    }
  },

  deleteActivity: async (templateId, activityId) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('template_activities')
        .delete()
        .eq('id', activityId)
        .eq('template_id', templateId);

      if (error) throw error;

      set(state => ({
        templates: state.templates.map(template =>
          template.id === templateId
            ? {
                ...template,
                activities: template.activities.filter(activity => activity.id !== activityId)
              }
            : template
        ),
        selectedTemplate: state.selectedTemplate?.id === templateId
          ? {
              ...state.selectedTemplate,
              activities: state.selectedTemplate.activities.filter(activity => activity.id !== activityId)
            }
          : state.selectedTemplate,
        loading: false
      }));
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      set({ error: error.message, loading: false });
    }
  },

  reorderActivities: async (templateId, activityIds) => {
    try {
      set({ loading: true, error: null });
      
      // Update order_index for each activity
      const updates = activityIds.map((id, index) => ({
        id,
        order_index: index,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('template_activities')
        .upsert(updates);

      if (error) throw error;

      set(state => {
        const template = state.templates.find(t => t.id === templateId);
        if (!template) return state;

        const orderedActivities = activityIds
          .map(id => template.activities.find(a => a.id === id))
          .filter((a): a is TemplateActivity => a !== undefined)
          .map((activity, index) => ({ 
            ...activity, 
            order_index: index,
            updated_at: new Date().toISOString()
          }));

        return {
          templates: state.templates.map(t =>
            t.id === templateId
              ? { ...t, activities: orderedActivities }
              : t
          ),
          selectedTemplate: state.selectedTemplate?.id === templateId
            ? { ...state.selectedTemplate, activities: orderedActivities }
            : state.selectedTemplate,
          loading: false
        };
      });
    } catch (error: any) {
      console.error('Error reordering activities:', error);
      set({ error: error.message, loading: false });
    }
  },

  toggleActivityFixed: async (templateId, activityId) => {
    try {
      set({ loading: true, error: null });
      
      const template = get().templates.find(t => t.id === templateId);
      const activity = template?.activities.find(a => a.id === activityId);
      
      if (!template || !activity) {
        throw new Error('Template or activity not found');
      }

      const newFixedState = !activity.fixed;
      
      await get().updateActivity(templateId, activityId, { fixed: newFixedState });
      
      // If we're setting an activity as fixed, ensure the template has fixed_activities enabled
      if (newFixedState && !template.fixed_activities) {
        await get().setTemplateFixedActivities(templateId, true);
      }
      
    } catch (error: any) {
      console.error('Error toggling activity fixed state:', error);
      set({ error: error.message, loading: false });
    }
  },

  setTemplateFixedActivities: async (templateId, fixed) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('marketing_plan_templates')
        .update({ 
          fixed_activities: fixed,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      if (error) throw error;

      set(state => ({
        templates: state.templates.map(template =>
          template.id === templateId
            ? { ...template, fixed_activities: fixed }
            : template
        ),
        selectedTemplate: state.selectedTemplate?.id === templateId
          ? { ...state.selectedTemplate, fixed_activities: fixed }
          : state.selectedTemplate,
        loading: false
      }));
    } catch (error: any) {
      console.error('Error updating template fixed activities:', error);
      set({ error: error.message, loading: false });
    }
  }
}));

