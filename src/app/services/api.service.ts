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

// Backend Response Model Interface for standard responses
export interface ResponseModel<T> {
  Success: boolean;
  Message: string;
  Data: T;
}

// Webhook URL with name model
export interface WebhookUrlModel {
  Name: string;
  Url: string;
}

// Backend Response for webhook operations (updated to match your new response)
export interface WebhookResponse {
  message: string;
  webhooksUrl: WebhookUrlModel[];
  employeeId: string;
}

// Response model for getting webhooks (matches your backend ResponseModel)
export interface GetWebhooksResponse {
  Success: boolean;
  Message: string;
  Data: WebhookUrlModel[];
}

// Telegram configuration interfaces
export interface TelegramConfigData {
  telegramToken: string;
  channelName: string;
}

export interface TelegramResponse {
  Success: boolean;
  Message: string;
  Data?: any;
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

  // Telegram messaging
  sendToTelegram(data: StatusUpdateData): Observable<TelegramResponse> {
    return this.http.post<TelegramResponse>(`${this.baseUrl}Task/SendToTelegram`, data, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Telegram configuration
  saveTelegramConfig(data: TelegramConfigData): Observable<TelegramResponse> {
    return this.http.post<TelegramResponse>(`${this.baseUrl}Task/SaveTelegramConfig`, data, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getTelegramConfig(): Observable<TelegramResponse> {
    return this.http.get<TelegramResponse>(`${this.baseUrl}Task/GetTelegramConfig`, {
      headers: this.authService.getAuthHeaders()
    });
  }
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

  // Webhook Management - Updated to handle name and URL
  addWebhookUrl(data: { name: string; url: string }): Observable<WebhookResponse> {
    return this.http.post<WebhookResponse>(`${this.baseUrl}Task/SaveWebhooksURL`, data, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getWebhookUrls(): Observable<GetWebhooksResponse> {
    return this.http.get<GetWebhooksResponse>(`${this.baseUrl}Task/GetWebhooks`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteWebhookUrl(webhookUrl: string): Observable<WebhookResponse> {
    return this.http.delete<WebhookResponse>(`${this.baseUrl}/Task/DeleteWebhook/${encodeURIComponent(webhookUrl)}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Task Management
  getScheduledTasks(): Observable<ResponseModel<any[]>> {
    return this.http.get<ResponseModel<any[]>>(`${this.baseUrl}/Task/GetScheduledTasks`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getPostedTasks(): Observable<ResponseModel<any[]>> {
    return this.http.get<ResponseModel<any[]>>(`${this.baseUrl}/Task/GetPostedTasks`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Legacy methods for backward compatibility
  configureWebhook(data: WebhookConfigData): Observable<WebhookResponse> {
    return this.addWebhookUrl({ name: 'Default Webhook', url: data.webhookUrl });
  }

  getWebhookConfig(): Observable<GetWebhooksResponse> {
    return this.getWebhookUrls();
  }
}