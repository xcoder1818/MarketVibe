import { SubTask } from '../types';

export interface CalendarProvider {
  type: 'google' | 'microsoft';
  name: string;
  icon: string;
  connected: boolean;
  email?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  duration?: number; // in minutes
  allDay?: boolean;
  location?: string;
  attendees?: string[];
  reminders?: number[]; // Minutes before event
}

class CalendarService {
  private providers: CalendarProvider[] = [];
  private currentProvider: CalendarProvider | null = null;

  constructor() {
    // Initialize with supported providers
    this.providers = [
      {
        type: 'google',
        name: 'Google Calendar',
        icon: 'https://www.google.com/calendar/images/favicon_v2014_1.ico',
        connected: false
      },
      {
        type: 'microsoft',
        name: 'Microsoft Calendar',
        icon: 'https://www.microsoft.com/favicon.ico',
        connected: false
      }
    ];

    // Try to restore previous connection
    this.restoreConnection();
  }

  private async restoreConnection() {
    // Check localStorage for previous connection
    const savedProvider = localStorage.getItem('calendar_provider');
    const savedEmail = localStorage.getItem('calendar_email');
    
    if (savedProvider && savedEmail) {
      const provider = this.providers.find(p => p.type === savedProvider);
      if (provider) {
        provider.connected = true;
        provider.email = savedEmail;
        this.currentProvider = provider;
      }
    }
  }

  async connectProvider(type: 'google' | 'microsoft'): Promise<boolean> {
    try {
      switch (type) {
        case 'google':
          // Initialize Google Calendar API
          const googleAuth = await this.initializeGoogleCalendar();
          if (googleAuth) {
            this.providers = this.providers.map(p =>
              p.type === 'google' ? { ...p, connected: true, email: googleAuth.email } : p
            );
            this.currentProvider = this.providers.find(p => p.type === 'google') || null;
            
            // Save connection info
            localStorage.setItem('calendar_provider', 'google');
            localStorage.setItem('calendar_email', googleAuth.email);
            
            return true;
          }
          break;

        case 'microsoft':
          // Initialize Microsoft Calendar API
          const msAuth = await this.initializeMicrosoftCalendar();
          if (msAuth) {
            this.providers = this.providers.map(p =>
              p.type === 'microsoft' ? { ...p, connected: true, email: msAuth.email } : p
            );
            this.currentProvider = this.providers.find(p => p.type === 'microsoft') || null;
            
            // Save connection info
            localStorage.setItem('calendar_provider', 'microsoft');
            localStorage.setItem('calendar_email', msAuth.email);
            
            return true;
          }
          break;
      }
      return false;
    } catch (error) {
      console.error(`Error connecting to ${type} calendar:`, error);
      return false;
    }
  }

  async disconnectProvider(type: 'google' | 'microsoft'): Promise<boolean> {
    try {
      switch (type) {
        case 'google':
          await this.disconnectGoogleCalendar();
          break;
        case 'microsoft':
          await this.disconnectMicrosoftCalendar();
          break;
      }

      this.providers = this.providers.map(p =>
        p.type === type ? { ...p, connected: false, email: undefined } : p
      );

      if (this.currentProvider?.type === type) {
        this.currentProvider = null;
      }

      // Clear saved connection info
      localStorage.removeItem('calendar_provider');
      localStorage.removeItem('calendar_email');

      return true;
    } catch (error) {
      console.error(`Error disconnecting ${type} calendar:`, error);
      return false;
    }
  }

  async addSubTaskToCalendar(subtask: SubTask, activityTitle: string): Promise<boolean> {
    if (!this.currentProvider || !subtask.start_date || !subtask.due_date) {
      return false;
    }

    try {
      // Calculate event duration from task_duration_minutes
      const duration = (subtask.task_duration_hours || 0) * 60 + (subtask.task_duration_minutes || 0);
      
      // Find available slot within the window
      const startDate = new Date(subtask.start_date);
      const endDate = new Date(subtask.due_date);
      
      // Get available slots
      const availableSlot = await this.findAvailableSlot(startDate, endDate, duration);
      if (!availableSlot) {
        throw new Error('No available time slots found within the task window');
      }

      const event: CalendarEvent = {
        id: subtask.id,
        title: `[${activityTitle}] ${subtask.title}`,
        description: subtask.description,
        startDate: availableSlot.start.toISOString(),
        endDate: availableSlot.end.toISOString(),
        duration,
        reminders: [60, 1440] // 1 hour and 1 day before
      };

      let success = false;
      switch (this.currentProvider.type) {
        case 'google':
          success = await this.addToGoogleCalendar(event);
          break;
        case 'microsoft':
          success = await this.addToMicrosoftCalendar(event);
          break;
      }

      if (success) {
        // Update subtask with calendar info
        subtask.calendar_synced = true;
        subtask.calendar_event_id = event.id;
        subtask.calendar_provider = this.currentProvider.type;
      }

      return success;
    } catch (error) {
      console.error('Error adding subtask to calendar:', error);
      return false;
    }
  }

  private async findAvailableSlot(
    startWindow: Date,
    endWindow: Date,
    durationMinutes: number
  ): Promise<{ start: Date; end: Date } | null> {
    try {
      // Get busy times from calendar
      const busyTimes = await this.getBusyTimes(startWindow, endWindow);
      
      // Start checking from the beginning of the window
      let currentSlot = new Date(startWindow);
      const slotEnd = new Date(currentSlot.getTime() + durationMinutes * 60000);
      
      // Only look during work hours (9 AM - 5 PM)
      while (currentSlot < endWindow) {
        const hour = currentSlot.getHours();
        
        // If outside work hours, move to next day at 9 AM
        if (hour < 9 || hour >= 17) {
          currentSlot.setDate(currentSlot.getDate() + 1);
          currentSlot.setHours(9, 0, 0, 0);
          continue;
        }
        
        // Check if current slot overlaps with any busy time
        const isSlotAvailable = !busyTimes.some(busy => 
          (currentSlot >= busy.start && currentSlot < busy.end) ||
          (slotEnd > busy.start && slotEnd <= busy.end)
        );
        
        if (isSlotAvailable) {
          return {
            start: currentSlot,
            end: slotEnd
          };
        }
        
        // Move to next slot (try every 30 minutes)
        currentSlot.setMinutes(currentSlot.getMinutes() + 30);
      }
      
      return null;
    } catch (error) {
      console.error('Error finding available slot:', error);
      return null;
    }
  }

  private async getBusyTimes(start: Date, end: Date): Promise<Array<{ start: Date; end: Date }>> {
    // This would call the respective calendar API to get busy times
    // For now, return mock data
    return [
      {
        start: new Date(start.getTime() + 2 * 60 * 60000),
        end: new Date(start.getTime() + 3 * 60 * 60000)
      }
    ];
  }

  async updateSubTaskInCalendar(subtask: SubTask, activityTitle: string): Promise<boolean> {
    if (!this.currentProvider || !subtask.start_date || !subtask.due_date) {
      return false;
    }

    try {
      const event: CalendarEvent = {
        id: subtask.id,
        title: `[${activityTitle}] ${subtask.title}`,
        description: subtask.description,
        startDate: subtask.start_date,
        endDate: subtask.due_date,
        reminders: [60, 1440] // 1 hour and 1 day before
      };

      switch (this.currentProvider.type) {
        case 'google':
          return await this.updateInGoogleCalendar(event);
        case 'microsoft':
          return await this.updateInMicrosoftCalendar(event);
      }
    } catch (error) {
      console.error('Error updating subtask in calendar:', error);
      return false;
    }
  }

  async removeSubTaskFromCalendar(subtaskId: string): Promise<boolean> {
    if (!this.currentProvider) return false;

    try {
      switch (this.currentProvider.type) {
        case 'google':
          return await this.removeFromGoogleCalendar(subtaskId);
        case 'microsoft':
          return await this.removeFromMicrosoftCalendar(subtaskId);
      }
    } catch (error) {
      console.error('Error removing subtask from calendar:', error);
      return false;
    }
  }

  getConnectedProviders(): CalendarProvider[] {
    return this.providers.filter(p => p.connected);
  }

  getCurrentProvider(): CalendarProvider | null {
    return this.currentProvider;
  }

  // Private methods for provider-specific implementations
  private async initializeGoogleCalendar() {
    // Initialize Google Calendar API
    // This would use the Google Calendar API client library
    return { email: 'user@gmail.com' }; // Mock response
  }

  private async initializeMicrosoftCalendar() {
    // Initialize Microsoft Calendar API
    // This would use the Microsoft Graph API client library
    return { email: 'user@outlook.com' }; // Mock response
  }

  private async disconnectGoogleCalendar() {
    // Implement Google Calendar disconnect logic
    return true;
  }

  private async disconnectMicrosoftCalendar() {
    // Implement Microsoft Calendar disconnect logic
    return true;
  }

  private async addToGoogleCalendar(event: CalendarEvent): Promise<boolean> {
    // Implement Google Calendar event creation
    console.log('Adding to Google Calendar:', event);
    return true;
  }

  private async addToMicrosoftCalendar(event: CalendarEvent): Promise<boolean> {
    // Implement Microsoft Calendar event creation
    console.log('Adding to Microsoft Calendar:', event);
    return true;
  }

  private async updateInGoogleCalendar(event: CalendarEvent): Promise<boolean> {
    // Implement Google Calendar event update
    console.log('Updating in Google Calendar:', event);
    return true;
  }

  private async updateInMicrosoftCalendar(event: CalendarEvent): Promise<boolean> {
    // Implement Microsoft Calendar event update
    console.log('Updating in Microsoft Calendar:', event);
    return true;
  }

  private async removeFromGoogleCalendar(eventId: string): Promise<boolean> {
    // Implement Google Calendar event removal
    console.log('Removing from Google Calendar:', eventId);
    return true;
  }

  private async removeFromMicrosoftCalendar(eventId: string): Promise<boolean> {
    // Implement Microsoft Calendar event removal
    console.log('Removing from Microsoft Calendar:', eventId);
    return true;
  }
}

export const calendarService = new CalendarService();