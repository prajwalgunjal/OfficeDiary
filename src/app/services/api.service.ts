import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface TaskData {
  type: 'start' | 'end';
  title: string;
  status: string;
  clickupId: string;
  additionalNotes: string;
}

export interface ScheduledTaskData {
  title: string;
  status: string;
  clickupId: string;
  additionalNotes: string;
  scheduledDate: string;
  scheduledTime: string;
  type: 'start' | 'end';
}

export interface StatusUpdateData {
  tasks: TaskData[];
  messageTemplate: string;
  formattedMessage: string;
}

export interface ScheduleTaskData {
  scheduledTasks: ScheduledTaskData[];
}

export interface ConfigurationData {
  googleChatWebhookUrl: string;
  userId?: string;
  isActive: boolean;
}

export interface ConfigurationResponse {
  success: boolean;
  message: string;
  data?: ConfigurationData;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api'; // Replace with your backend URL
  
  // Subject to track Google Chat configuration status
  private googleChatConfigSubject = new BehaviorSubject<ConfigurationData | null>(null);
  public googleChatConfig$ = this.googleChatConfigSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load existing configuration on service initialization
    this.loadGoogleChatConfiguration();
  }

  sendToGoogleChat(data: StatusUpdateData): Observable<any> {
    return this.http.post(`${this.baseUrl}/send-to-chat`, data);
  }

  saveStatusUpdate(data: StatusUpdateData): Observable<any> {
    return this.http.post(`${this.baseUrl}/status-updates`, data);
  }

  scheduleTask(data: ScheduleTaskData): Observable<any> {
    return this.http.post(`${this.baseUrl}/schedule-task`, data);
  }

  // New methods for Google Chat configuration
  configureGoogleChat(webhookUrl: string): Observable<ConfigurationResponse> {
    const configData: ConfigurationData = {
      googleChatWebhookUrl: webhookUrl,
      isActive: true
    };
    
    return this.http.post<ConfigurationResponse>(`${this.baseUrl}/configure-google-chat`, configData);
  }

  getGoogleChatConfiguration(): Observable<ConfigurationResponse> {
    return this.http.get<ConfigurationResponse>(`${this.baseUrl}/google-chat-config`);
  }

  updateGoogleChatConfiguration(configData: ConfigurationData): Observable<ConfigurationResponse> {
    return this.http.put<ConfigurationResponse>(`${this.baseUrl}/google-chat-config`, configData);
  }
  deleteGoogleChatConfiguration(): Observable<ConfigurationResponse> {
    return this.http.delete<ConfigurationResponse>(`${this.baseUrl}/google-chat-config`);
  }
  testGoogleChatConnection(webhookUrl: string): Observable<ConfigurationResponse> {
    return this.http.post<ConfigurationResponse>(`${this.baseUrl}/test-google-chat`, { webhookUrl });
  }
  // Method to load and update the configuration subject
  private loadGoogleChatConfiguration(): void {
    this.getGoogleChatConfiguration().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.googleChatConfigSubject.next(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading Google Chat configuration:', error);
        this.googleChatConfigSubject.next(null);
      }
    });
  }
  // Method to refresh configuration after updates
  refreshGoogleChatConfiguration(): void {
    this.loadGoogleChatConfiguration();
  }
  // Method to get current configuration synchronously
  getCurrentGoogleChatConfig(): ConfigurationData | null {
    return this.googleChatConfigSubject.value;
  }
}