import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { ApiService, ConfigurationData, ConfigurationResponse } from '../../services/api.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Google Chat Configuration properties
  googleChatConfig: ConfigurationData | null = null;
  showGoogleChatModal = false;
  isConfiguring = false;
  isTesting = false;
  configurationMessage = '';
  configurationError = '';
  
  // Form properties
  webhookUrl = '';
  isGoogleChatActive = false;

  constructor(
    public themeService: ThemeService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    // Subscribe to Google Chat configuration changes
    this.apiService.googleChatConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        this.googleChatConfig = config;
        if (config) {
          this.webhookUrl = config.googleChatWebhookUrl;
          this.isGoogleChatActive = config.isActive;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Existing method - no changes
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  // New Google Chat configuration methods
  openGoogleChatConfig(): void {
    this.showGoogleChatModal = true;
    this.configurationMessage = '';
    this.configurationError = '';
    
    // If already configured, load existing URL
    if (this.googleChatConfig) {
      this.webhookUrl = this.googleChatConfig.googleChatWebhookUrl;
      this.isGoogleChatActive = this.googleChatConfig.isActive;
    }
  }

  closeGoogleChatModal(): void {
    this.showGoogleChatModal = false;
    this.configurationMessage = '';
    this.configurationError = '';
    this.webhookUrl = this.googleChatConfig?.googleChatWebhookUrl || '';
  }

  testGoogleChatConnection(): void {
    if (!this.webhookUrl.trim()) {
      this.configurationError = 'Please enter a webhook URL';
      return;
    }

    this.isTesting = true;
    this.configurationMessage = '';
    this.configurationError = '';

    this.apiService.testGoogleChatConnection(this.webhookUrl.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ConfigurationResponse) => {
          this.isTesting = false;
          if (response.success) {
            this.configurationMessage = 'Connection test successful! ✅';
          } else {
            this.configurationError = response.message || 'Connection test failed';
          }
        },
        error: (error) => {
          this.isTesting = false;
          this.configurationError = 'Failed to test connection. Please check your URL and try again.';
          console.error('Test connection error:', error);
        }
      });
  }

  saveGoogleChatConfiguration(): void {
    if (!this.webhookUrl.trim()) {
      this.configurationError = 'Please enter a webhook URL';
      return;
    }

    this.isConfiguring = true;
    this.configurationMessage = '';
    this.configurationError = '';

    const configData: ConfigurationData = {
      googleChatWebhookUrl: this.webhookUrl.trim(),
      isActive: this.isGoogleChatActive
    };

    const request = this.googleChatConfig 
      ? this.apiService.updateGoogleChatConfiguration(configData)
      : this.apiService.configureGoogleChat(this.webhookUrl.trim());

    request.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ConfigurationResponse) => {
          this.isConfiguring = false;
          if (response.success) {
            this.configurationMessage = this.googleChatConfig 
              ? 'Configuration updated successfully! ✅'
              : 'Google Chat configured successfully! ✅';
            
            // Refresh the configuration
            this.apiService.refreshGoogleChatConfiguration();
            
            // Close modal after a delay
            setTimeout(() => {
              this.closeGoogleChatModal();
            }, 2000);
          } else {
            this.configurationError = response.message || 'Failed to save configuration';
          }
        },
        error: (error) => {
          this.isConfiguring = false;
          this.configurationError = 'Failed to save configuration. Please try again.';
          console.error('Configuration error:', error);
        }
      });
  }

  deleteGoogleChatConfiguration(): void {
    if (!this.googleChatConfig) return;

    if (confirm('Are you sure you want to delete the Google Chat configuration?')) {
      this.isConfiguring = true;
      this.configurationMessage = '';
      this.configurationError = '';

      this.apiService.deleteGoogleChatConfiguration()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: ConfigurationResponse) => {
            this.isConfiguring = false;
            if (response.success) {
              this.configurationMessage = 'Configuration deleted successfully! ✅';
              this.webhookUrl = '';
              this.isGoogleChatActive = false;
              
              // Refresh the configuration
              this.apiService.refreshGoogleChatConfiguration();
              
              // Close modal after a delay
              setTimeout(() => {
                this.closeGoogleChatModal();
              }, 2000);
            } else {
              this.configurationError = response.message || 'Failed to delete configuration';
            }
          },
          error: (error) => {
            this.isConfiguring = false;
            this.configurationError = 'Failed to delete configuration. Please try again.';
            console.error('Delete configuration error:', error);
          }
        });
    }
  }

  isValidWebhookUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('chat.googleapis.com') && 
             urlObj.pathname.includes('/v1/spaces/') &&
             urlObj.searchParams.has('key');
    } catch {
      return false;
    }
  }
}