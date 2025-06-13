import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { ApiService, WebhookConfigData } from '../../services/api.service';

interface WebhookUrl {
  id: string;
  name: string;
  url: string;
}

interface TaskItem {
  id: string;
  title: string;
  status: string;
  type: 'start' | 'end';
  clickupId?: string;
  additionalNotes?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  postedAt?: Date;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  showWebhookModal = false;
  showWebhookUrls = false;
  showTasksModal = false;
  showPopup = false;
  
  webhookUrls: WebhookUrl[] = [];
  newWebhook = { name: '', url: '' };
  webhookError = '';
  isSaving = false;
  
  popupType: 'success' | 'error' = 'success';
  popupMessage = '';
  
  tasksList: TaskItem[] = [];
  tasksModalTitle = '';

  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    // Initialize component
  }

  // Webhook Management
  async toggleWebhookUrls(): Promise<void> {
    this.showWebhookUrls = !this.showWebhookUrls;
    if (this.showWebhookUrls && this.webhookUrls.length === 0) {
      await this.loadWebhookUrls();
    }
  }

  async loadWebhookUrls(): Promise<void> {
    try {
      const response = await this.apiService.getWebhookUrls().toPromise();
      this.webhookUrls = response.webhooks || [];
    } catch (error) {
      console.error('Failed to load webhook URLs:', error);
      this.showPopupMessage('Failed to load webhook URLs', 'error');
    }
  }

  openWebhookModal(): void {
    this.newWebhook = { name: '', url: '' };
    this.webhookError = '';
    this.showWebhookModal = true;
  }

  closeWebhookModal(): void {
    this.showWebhookModal = false;
    this.newWebhook = { name: '', url: '' };
    this.webhookError = '';
  }

  validateWebhookUrl(): boolean {
    this.webhookError = '';

    if (!this.newWebhook.url.trim()) {
      this.webhookError = 'Webhook URL is required';
      return false;
    }

    try {
      const url = new URL(this.newWebhook.url);
      if (!url.hostname.includes('googleapis.com')) {
        this.webhookError = 'Please enter a valid Google Chat webhook URL';
        return false;
      }
    } catch (error) {
      this.webhookError = 'Please enter a valid URL';
      return false;
    }

    return true;
  }

  async addWebhookUrl(): Promise<void> {
    if (!this.validateWebhookUrl()) {
      return;
    }

    this.isSaving = true;

    const configData = {
      name: this.newWebhook.name.trim() || `Webhook ${this.webhookUrls.length + 1}`,
      url: this.newWebhook.url.trim()
    };

    try {
      await this.apiService.addWebhookUrl(configData).toPromise();
      await this.loadWebhookUrls();
      this.closeWebhookModal();
      this.showPopupMessage('Webhook URL added successfully!', 'success');
    } catch (error) {
      console.error('Failed to add webhook URL:', error);
      this.webhookError = 'Failed to add webhook URL. Please try again.';
      this.showPopupMessage('Failed to add webhook URL', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this webhook URL?')) {
      return;
    }

    try {
      await this.apiService.deleteWebhookUrl(webhookId).toPromise();
      await this.loadWebhookUrls();
      this.showPopupMessage('Webhook URL deleted successfully!', 'success');
    } catch (error) {
      console.error('Failed to delete webhook URL:', error);
      this.showPopupMessage('Failed to delete webhook URL', 'error');
    }
  }

  // Task Management
  async getScheduledTasks(): Promise<void> {
    try {
      const response = await this.apiService.getScheduledTasks().toPromise();
      this.tasksList = response.tasks || [];
      this.tasksModalTitle = '📅 Scheduled Tasks';
      this.showTasksModal = true;
    } catch (error) {
      console.error('Failed to get scheduled tasks:', error);
      this.showPopupMessage('Failed to load scheduled tasks', 'error');
    }
  }

  async getPostedTasks(): Promise<void> {
    try {
      const response = await this.apiService.getPostedTasks().toPromise();
      this.tasksList = response.tasks || [];
      this.tasksModalTitle = '📤 Posted Tasks';
      this.showTasksModal = true;
    } catch (error) {
      console.error('Failed to get posted tasks:', error);
      this.showPopupMessage('Failed to load posted tasks', 'error');
    }
  }

  closeTasksModal(): void {
    this.showTasksModal = false;
    this.tasksList = [];
    this.tasksModalTitle = '';
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  // Popup Management
  showPopupMessage(message: string, type: 'success' | 'error'): void {
    this.popupMessage = message;
    this.popupType = type;
    this.showPopup = true;

    // Auto-close popup after 3 seconds
    setTimeout(() => {
      this.closePopup();
    }, 3000);
  }

  closePopup(): void {
    this.showPopup = false;
    this.popupMessage = '';
  }

  // Account Management
  logout(): void {
    this.authService.logout();
  }
}