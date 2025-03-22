import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface NotificationPreference {
  id: string;
  user_id: string;
  type: 'activity_assigned' | 'subtask_assigned' | 'comment_mention' | 'channel_message' | 'direct_message' | 'task_due';
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  email_digest_enabled?: boolean;
  email_digest_frequency?: 'daily' | 'weekly';
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  type: 'activity_assigned' | 'subtask_assigned' | 'comment_mention' | 'channel_message' | 'direct_message' | 'task_due';
  title: string;
  content: string;
  link?: string;
  read: boolean;
  created_at: string;
}

interface NotificationState {
  preferences: NotificationPreference[];
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Preferences
  fetchPreferences: () => Promise<void>;
  updatePreference: (type: NotificationPreference['type'], updates: Partial<NotificationPreference>) => Promise<void>;
  
  // Notifications
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Real-time updates
  subscribeToNotifications: (userId: string) => void;
  unsubscribeFromNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  preferences: [],
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchPreferences: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ preferences: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updatePreference: async (type, updates) => {
    try {
      set({ loading: true });
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('type', type);

      if (error) throw error;

      set(state => ({
        preferences: state.preferences.map(pref =>
          pref.type === type ? { ...pref, ...updates } : pref
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchNotifications: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const notifications = data || [];
      const unreadCount = notifications.filter(n => !n.read).length;
      
      set({ 
        notifications, 
        unreadCount,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  markAllAsRead: async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);

      if (error) throw error;

      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      set(state => ({
        notifications: state.notifications.filter(n => n.id !== notificationId),
        unreadCount: state.notifications.find(n => n.id === notificationId)?.read
          ? state.unreadCount
          : Math.max(0, state.unreadCount - 1)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  clearAllNotifications: async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .not('id', 'is', null);

      if (error) throw error;

      set({ notifications: [], unreadCount: 0 });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  subscribeToNotifications: (userId) => {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          set(state => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1
          }));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },

  unsubscribeFromNotifications: () => {
    supabase.removeChannel('notifications');
  }
}));