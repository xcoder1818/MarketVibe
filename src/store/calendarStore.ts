import { create } from 'zustand';
import { calendarService, CalendarProvider, CalendarEvent } from '../services/calendar';
import { SubTask } from '../types';

interface CalendarState {
  providers: CalendarProvider[];
  currentProvider: CalendarProvider | null;
  loading: boolean;
  error: string | null;

  // Provider management
  connectProvider: (type: 'google' | 'microsoft') => Promise<boolean>;
  disconnectProvider: (type: 'google' | 'microsoft') => Promise<boolean>;
  setCurrentProvider: (provider: CalendarProvider | null) => void;

  // Event management
  addSubTaskToCalendar: (subtask: SubTask, activityTitle: string) => Promise<boolean>;
  updateSubTaskInCalendar: (subtask: SubTask, activityTitle: string) => Promise<boolean>;
  removeSubTaskFromCalendar: (subtaskId: string) => Promise<boolean>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  providers: [],
  currentProvider: null,
  loading: false,
  error: null,

  connectProvider: async (type) => {
    try {
      set({ loading: true, error: null });
      const success = await calendarService.connectProvider(type);
      
      if (success) {
        set({
          providers: calendarService.getConnectedProviders(),
          currentProvider: calendarService.getCurrentProvider(),
          loading: false
        });
      }
      
      return success;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  disconnectProvider: async (type) => {
    try {
      set({ loading: true, error: null });
      const success = await calendarService.disconnectProvider(type);
      
      if (success) {
        set({
          providers: calendarService.getConnectedProviders(),
          currentProvider: calendarService.getCurrentProvider(),
          loading: false
        });
      }
      
      return success;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  setCurrentProvider: (provider) => {
    set({ currentProvider: provider });
  },

  addSubTaskToCalendar: async (subtask, activityTitle) => {
    try {
      set({ loading: true, error: null });
      const success = await calendarService.addSubTaskToCalendar(subtask, activityTitle);
      set({ loading: false });
      return success;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  updateSubTaskInCalendar: async (subtask, activityTitle) => {
    try {
      set({ loading: true, error: null });
      const success = await calendarService.updateSubTaskInCalendar(subtask, activityTitle);
      set({ loading: false });
      return success;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  removeSubTaskFromCalendar: async (subtaskId) => {
    try {
      set({ loading: true, error: null });
      const success = await calendarService.removeSubTaskFromCalendar(subtaskId);
      set({ loading: false });
      return success;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  }
}));

