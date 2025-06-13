import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

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

export interface WebhookConfigData {
  webhookUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://localhost:44329/api/'; // Replace with your backend URL

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  sendToGoogleChat(data: StatusUpdateData): Observable<any> {
    return this.http.post(`${this.baseUrl}Task/SendToGoogleChat`, data, {
      headers: this.authService.getAuthHeaders()
    });
  }

  saveStatusUpdate(data: StatusUpdateData): Observable<any> {
    return this.http.post(`${this.baseUrl}/status-updates`, data, {
      headers: this.authService.getAuthHeaders()
    });
  }

  scheduleTask(data: ScheduleTaskData): Observable<any> {
    return this.http.post(`${this.baseUrl}/schedule-task`, data, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Webhook Management
  addWebhookUrl(data: { name: string; url: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/Task/SaveWebhooksURL`, data, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getWebhookUrls(): Observable<any> {
    return this.http.get(`${this.baseUrl}/webhooks`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteWebhookUrl(webhookId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/webhooks/${webhookId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Task Management
  getScheduledTasks(): Observable<any> {
    return this.http.get(`${this.baseUrl}/scheduled-tasks`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getPostedTasks(): Observable<any> {
    return this.http.get(`${this.baseUrl}/posted-tasks`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Legacy methods for backward compatibility
  configureWebhook(data: WebhookConfigData): Observable<any> {
    return this.addWebhookUrl({ name: 'Default Webhook', url: data.webhookUrl });
  }

  getWebhookConfig(): Observable<any> {
    return this.getWebhookUrls();
  }
}