import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { ApiService, WebhookConfigData, ResponseModel, WebhookResponse, WebhookUrlModel, GetWebhooksResponse, TelegramConfigData, TelegramResponse } from '../../services/api.service';

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
  showTelegramModal = false;
  showTelegramConfig = false;
  
  webhookUrls: WebhookUrlModel[] = []; // Array of webhook objects with name and URL
  newWebhook = { name: '', url: '' };
  webhookError = '';
  isSaving = false;
  
  // Telegram configuration
  telegramConfig: TelegramConfigData = { telegramToken: '', channelName: '' };
  newTelegramConfig: TelegramConfigData = { telegramToken: '', channelName: '' };
  telegramError = '';
  isSavingTelegram = false;
  hasTelegramConfig = false;
  
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

  // async loadWebhookUrls(): Promise<void> {
  //   try {
  //     const response = await this.apiService.getWebhookUrls().toPromise();
  //     console.log('Webhook response:', response);
      
  //     if (response && response.Success && response.Data) {
  //       // Handle the Data array from your backend ResponseModel
  //       this.webhookUrls = Array.isArray(response.Data) ? response.Data : [];
  //       console.log('Loaded webhook URLs:', this.webhookUrls);
  //       this.showPopupMessage(`${this.webhookUrls.length} webhook URL(s) loaded successfully!`, 'success');
  //     } else {
  //       this.webhookUrls = [];
  //       this.showPopupMessage(response?.Message || 'No webhook URLs found', 'success');
  //     }
  //   } catch (error: any) {
  //     console.error('Failed to load webhook URLs:', error);
  //     this.webhookUrls = [];
  //     const errorMessage = error.error?.Message || error.error?.message || error.message || 'Failed to load webhook URLs';
  //     this.showPopupMessage(errorMessage, 'error');
  //   }
  // }
// Updated TypeScript method
async loadWebhookUrls(): Promise<void> {
  try {
    const response: any = await this.apiService.getWebhookUrls().toPromise();
    console.log('Raw response:', response);
    
    if (response?.webhooksUrl && Array.isArray(response.webhooksUrl)) {
      // Transform lowercase API response to uppercase model
      this.webhookUrls = response.webhooksUrl.map((webhook: any) => ({
        Name: webhook.name,  // Transform name -> Name
        Url: webhook.url     // Transform url -> Url
      }));
      
      console.log('Transformed webhooks:', this.webhookUrls);
      this.showPopupMessage(`${this.webhookUrls.length} webhook URL(s) loaded successfully!`, 'success');
    } else {
      this.webhookUrls = [];
      this.showPopupMessage('No webhook URLs found', 'success');
    }
  } catch (error: any) {
    console.error('Error loading webhooks:', error);
    this.webhookUrls = [];
    this.showPopupMessage('Error loading webhooks', 'error');
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

    if (!this.newWebhook.name.trim()) {
      this.webhookError = 'Webhook name is required';
      return false;
    }

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
      name: this.newWebhook.name.trim(),
      url: this.newWebhook.url.trim()
    };

    try {
      const response = await this.apiService.addWebhookUrl(configData).toPromise();
      console.log('Add webhook response:', response);
      
      if (response && response.message) {
        // Reload the webhook URLs to get the updated list
        await this.loadWebhookUrls();
        this.closeWebhookModal();
        this.showPopupMessage(response.message, 'success');
      } else {
        this.webhookError = 'Failed to add webhook URL';
        this.showPopupMessage('Failed to add webhook URL', 'error');
      }
    } catch (error: any) {
      console.error('Failed to add webhook URL:', error);
      const errorMessage = error.error?.message || error.message || 'Failed to add webhook URL. Please try again.';
      this.webhookError = errorMessage;
      this.showPopupMessage(errorMessage, 'error');
    } finally {
      this.isSaving = false;
    }
  }

  async deleteWebhook(webhookUrl: string, webhookName: string): Promise<void> {
    if (!confirm(`Are you sure you want to delete the webhook "${webhookName}"?`)) {
      return;
    }

    try {
      const response = await this.apiService.deleteWebhookUrl(webhookUrl).toPromise();
      console.log('Delete webhook response:', response);
      
      if (response && response.message) {
        // Reload the webhook URLs to get the updated list
        await this.loadWebhookUrls();
        this.showPopupMessage(response.message, 'success');
      } else {
        this.showPopupMessage('Failed to delete webhook URL', 'error');
      }
    } catch (error: any) {
      console.error('Failed to delete webhook URL:', error);
      const errorMessage = error.error?.message || error.message || 'Failed to delete webhook URL';
      this.showPopupMessage(errorMessage, 'error');
    }
  }

  // Telegram Configuration
  async toggleTelegramConfig(): Promise<void> {
    this.showTelegramConfig = !this.showTelegramConfig;
    if (this.showTelegramConfig && !this.hasTelegramConfig) {
      await this.loadTelegramConfig();
    }
  }

  async loadTelegramConfig(): Promise<void> {
    try {
      const response = await this.apiService.getTelegramConfig().toPromise();
      console.log('Telegram config response:', response);
      
      if (response && response.Success && response.Data) {
        this.telegramConfig = response.Data;
        this.hasTelegramConfig = true;
        this.showPopupMessage('Telegram configuration loaded successfully!', 'success');
      } else {
        this.telegramConfig = { telegramToken: '', channelName: '' };
        this.hasTelegramConfig = false;
        this.showPopupMessage(response?.Message || 'No Telegram configuration found', 'success');
      }
    } catch (error: any) {
      console.error('Failed to load Telegram config:', error);
      this.telegramConfig = { telegramToken: '', channelName: '' };
      this.hasTelegramConfig = false;
      const errorMessage = error.error?.Message || error.error?.message || error.message || 'Failed to load Telegram configuration';
      this.showPopupMessage(errorMessage, 'error');
    }
  }

  openTelegramModal(): void {
    this.newTelegramConfig = { ...this.telegramConfig };
    this.telegramError = '';
    this.showTelegramModal = true;
  }

  closeTelegramModal(): void {
    this.showTelegramModal = false;
    this.newTelegramConfig = { telegramToken: '', channelName: '' };
    this.telegramError = '';
  }

  validateTelegramConfig(): boolean {
    this.telegramError = '';

    if (!this.newTelegramConfig.telegramToken.trim()) {
      this.telegramError = 'Telegram bot token is required';
      return false;
    }

    if (!this.newTelegramConfig.channelName.trim()) {
      this.telegramError = 'Channel name is required';
      return false;
    }

    // Basic validation for Telegram bot token format
    if (!this.newTelegramConfig.telegramToken.includes(':')) {
      this.telegramError = 'Please enter a valid Telegram bot token (format: 123456789:ABC-DEF...)';
      return false;
    }

    return true;
  }

  async saveTelegramConfig(): Promise<void> {
    if (!this.validateTelegramConfig()) {
      return;
    }

    this.isSavingTelegram = true;

    const configData = {
      telegramToken: this.newTelegramConfig.telegramToken.trim(),
      channelName: this.newTelegramConfig.channelName.trim()
    };

    try {
      const response = await this.apiService.saveTelegramConfig(configData).toPromise();
      console.log('Save Telegram config response:', response);
      
      if (response && response.Success) {
        this.telegramConfig = { ...configData };
        this.hasTelegramConfig = true;
        this.closeTelegramModal();
        this.showPopupMessage(response.Message || 'Telegram configuration saved successfully!', 'success');
      } else {
        this.telegramError = response?.Message || 'Failed to save Telegram configuration';
        this.showPopupMessage(response?.Message || 'Failed to save Telegram configuration', 'error');
      }
    } catch (error: any) {
      console.error('Failed to save Telegram config:', error);
      const errorMessage = error.error?.Message || error.error?.message || error.message || 'Failed to save Telegram configuration. Please try again.';
      this.telegramError = errorMessage;
      this.showPopupMessage(errorMessage, 'error');
    } finally {
      this.isSavingTelegram = false;
    }
  }

  // Task Management
  async getScheduledTasks(): Promise<void> {
    try {
      const response = await this.apiService.getScheduledTasks().toPromise();
      console.log('Scheduled tasks response:', response);
      
      if (response && response.Success) {
        this.tasksList = Array.isArray(response.Data) ? response.Data : [];
        this.tasksModalTitle = `📅 Scheduled Tasks (${this.tasksList.length})`;
        this.showTasksModal = true;
        this.showPopupMessage(`${this.tasksList.length} scheduled task(s) loaded successfully!`, 'success');
      } else {
        this.tasksList = [];
        this.tasksModalTitle = '📅 Scheduled Tasks (0)';
        this.showTasksModal = true;
        this.showPopupMessage(response?.Message || 'No scheduled tasks found', 'success');
      }
    } catch (error: any) {
      console.error('Failed to get scheduled tasks:', error);
      this.tasksList = [];
      const errorMessage = error.error?.Message || error.message || 'Failed to load scheduled tasks';
      this.showPopupMessage(errorMessage, 'error');
    }
  }

  async getPostedTasks(): Promise<void> {
    try {
      const response = await this.apiService.getPostedTasks().toPromise();
      console.log('Posted tasks response:', response);
      
      if (response && response.Success) {
        this.tasksList = Array.isArray(response.Data) ? response.Data : [];
        this.tasksModalTitle = `📤 Posted Tasks (${this.tasksList.length})`;
        this.showTasksModal = true;
        this.showPopupMessage(`${this.tasksList.length} posted task(s) loaded successfully!`, 'success');
      } else {
        this.tasksList = [];
        this.tasksModalTitle = '📤 Posted Tasks (0)';
        this.showTasksModal = true;
        this.showPopupMessage(response?.Message || 'No posted tasks found', 'success');
      }
    } catch (error: any) {
      console.error('Failed to get posted tasks:', error);
      this.tasksList = [];
      const errorMessage = error.error?.Message || error.message || 'Failed to load posted tasks';
      this.showPopupMessage(errorMessage, 'error');
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

    // Auto-close popup after 4 seconds for better UX
    setTimeout(() => {
      this.closePopup();
    }, 4000);
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