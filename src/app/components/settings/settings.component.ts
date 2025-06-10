import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { ApiService, WebhookConfigData } from '../../services/api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  showWebhookModal = false;
  webhookUrl = '';
  public currentWebhookUrl = '';
  webhookError = '';
  isSaving = false;

  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadWebhookConfig();
  }

  async loadWebhookConfig(): Promise<void> {
    try {
      const response = await this.apiService.getWebhookConfig().toPromise();
      this.currentWebhookUrl = response.webhookUrl || '';
    } catch (error) {
      console.error('Failed to load webhook config:', error);
    }
  }

  openWebhookModal(): void {
    this.webhookUrl = this.currentWebhookUrl;
    this.webhookError = '';
    this.showWebhookModal = true;
  }

  closeWebhookModal(): void {
    this.showWebhookModal = false;
    this.webhookUrl = '';
    this.webhookError = '';
  }

  validateWebhookUrl(): boolean {
    this.webhookError = '';

    if (!this.webhookUrl.trim()) {
      this.webhookError = 'Webhook URL is required';
      return false;
    }

    try {
      const url = new URL(this.webhookUrl);
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

  async saveWebhookConfig(): Promise<void> {
    if (!this.validateWebhookUrl()) {
      return;
    }

    this.isSaving = true;

    const configData: WebhookConfigData = {
      webhookUrl: this.webhookUrl.trim()
    };

    try {
      await this.apiService.configureWebhook(configData).toPromise();
      this.currentWebhookUrl = this.webhookUrl.trim();
      this.closeWebhookModal();
      console.log('Webhook configured successfully!');
    } catch (error) {
      console.error('Failed to configure webhook:', error);
      this.webhookError = 'Failed to save configuration. Please try again.';
    } finally {
      this.isSaving = false;
    }
  }

  logout(): void {
    this.authService.logout();
  }
}