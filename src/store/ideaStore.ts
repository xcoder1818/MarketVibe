import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { Idea, IdeaComment, IdeaAttachment, IdeaReference } from '../types';

interface IdeaState {
  ideas: Idea[];
  selectedIdea: Idea | null;
  loading: boolean;
  error: string | null;

  // Ideas
  fetchIdeas: (companyId: string) => Promise<void>;
  createIdea: (idea: Omit<Idea, 'id' | 'created_at' | 'updated_at' | 'comments' | 'attachments' | 'references'>) => Promise<void>;
  updateIdea: (id: string, updates: Partial<Idea>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  addToMarketingPlan: (ideaId: string, planId: string) => Promise<void>;

  // Comments
  addComment: (ideaId: string, content: string, userId: string) => Promise<void>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;

  // Attachments
  addAttachment: (ideaId: string, file: File) => Promise<void>;
  deleteAttachment: (attachmentId: string) => Promise<void>;

  // References
  addReference: (ideaId: string, reference: Omit<IdeaReference, 'id' | 'idea_id' | 'created_at'>) => Promise<void>;
  deleteReference: (referenceId: string) => Promise<void>;

  // Tags
  addTag: (ideaId: string, tag: string) => Promise<void>;
  removeTag: (ideaId: string, tag: string) => Promise<void>;
}

export const useIdeaStore = create<IdeaState>((set, get) => ({
  ideas: [],
  selectedIdea: null,
  loading: false,
  error: null,

  fetchIdeas: async (companyId) => {
    try {
      set({ loading: true });
      
      // Mock data for now
      const mockIdeas: Idea[] = [
        {
          id: 'idea1',
          title: 'Blog Post: Future of AI',
          description: 'Explore the impact of AI on business operations',
          type: 'blog',
          priority: 'high',
          status: 'draft',
          created_by: 'user123',
          company_id: companyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          comments: [],
          attachments: [],
          references: [],
          tags: ['ai', 'technology', 'future']
        }
      ];
      
      set({ ideas: mockIdeas, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createIdea: async (idea) => {
    try {
      set({ loading: true });
      
      const newIdea: Idea = {
        ...idea,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        comments: [],
        attachments: [],
        references: [],
        tags: []
      };
      
      set(state => ({ 
        ideas: [...state.ideas, newIdea],
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateIdea: async (id, updates) => {
    try {
      set({ loading: true });
      
      set(state => ({
        ideas: state.ideas.map(idea => 
          idea.id === id 
            ? { ...idea, ...updates, updated_at: new Date().toISOString() }
            : idea
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteIdea: async (id) => {
    try {
      set({ loading: true });
      
      set(state => ({
        ideas: state.ideas.filter(idea => idea.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addToMarketingPlan: async (ideaId, planId) => {
    try {
      set({ loading: true });
      
      // Update idea status and add plan reference
      set(state => ({
        ideas: state.ideas.map(idea =>
          idea.id === ideaId
            ? { ...idea, status: 'in_plan', plan_id: planId }
            : idea
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addComment: async (ideaId, content, userId) => {
    try {
      const newComment: IdeaComment = {
        id: uuidv4(),
        idea_id: ideaId,
        user_id: userId,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      set(state => ({
        ideas: state.ideas.map(idea =>
          idea.id === ideaId
            ? { ...idea, comments: [...idea.comments, newComment] }
            : idea
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateComment: async (commentId, content) => {
    try {
      set(state => ({
        ideas: state.ideas.map(idea => ({
          ...idea,
          comments: idea.comments.map(comment =>
            comment.id === commentId
              ? { ...comment, content, updated_at: new Date().toISOString() }
              : comment
          )
        }))
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteComment: async (commentId) => {
    try {
      set(state => ({
        ideas: state.ideas.map(idea => ({
          ...idea,
          comments: idea.comments.filter(comment => comment.id !== commentId)
        }))
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addAttachment: async (ideaId, file) => {
    try {
      const newAttachment: IdeaAttachment = {
        id: uuidv4(),
        idea_id: ideaId,
        file_name: file.name,
        file_url: URL.createObjectURL(file),
        file_type: file.type,
        created_at: new Date().toISOString()
      };
      
      set(state => ({
        ideas: state.ideas.map(idea =>
          idea.id === ideaId
            ? { ...idea, attachments: [...idea.attachments, newAttachment] }
            : idea
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteAttachment: async (attachmentId) => {
    try {
      set(state => ({
        ideas: state.ideas.map(idea => ({
          ...idea,
          attachments: idea.attachments.filter(att => att.id !== attachmentId)
        }))
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addReference: async (ideaId, reference) => {
    try {
      const newReference: IdeaReference = {
        id: uuidv4(),
        idea_id: ideaId,
        ...reference,
        created_at: new Date().toISOString()
      };
      
      set(state => ({
        ideas: state.ideas.map(idea =>
          idea.id === ideaId
            ? { ...idea, references: [...idea.references, newReference] }
            : idea
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteReference: async (referenceId) => {
    try {
      set(state => ({
        ideas: state.ideas.map(idea => ({
          ...idea,
          references: idea.references.filter(ref => ref.id !== referenceId)
        }))
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addTag: async (ideaId, tag) => {
    try {
      set(state => ({
        ideas: state.ideas.map(idea =>
          idea.id === ideaId && !idea.tags.includes(tag)
            ? { ...idea, tags: [...idea.tags, tag] }
            : idea
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  removeTag: async (ideaId, tag) => {
    try {
      set(state => ({
        ideas: state.ideas.map(idea =>
          idea.id === ideaId
            ? { ...idea, tags: idea.tags.filter(t => t !== tag) }
            : idea
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  }
}));