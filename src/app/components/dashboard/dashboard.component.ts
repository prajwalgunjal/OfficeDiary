import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, TaskData, StatusUpdateData, ScheduledTaskData, ScheduleTaskData } from '../../services/api.service';
import { MessageService } from '../../services/message.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  tasks: TaskData[] = [];
  livePreview = '';
  isLoading = false;
  isSendingTelegram = false;
  showScheduleModal = false;
  isScheduling = false;
  minDate = '';

  // Success/Error popup properties
  showPopup = false;
  popupType: 'success' | 'error' = 'success';
  popupMessage = '';

  scheduledTask: ScheduledTaskData = {
    title: '',
    status: 'Not Started',
    clickupId: '',
    additionalNotes: '',
    scheduledDate: '',
    scheduledTime: '',
    type: 'start'
  };

  statusOptions = ['Not Started', 'In Progress', 'Completed', 'On Hold'];

  constructor(
    private apiService: ApiService,
    public messageService: MessageService,
    public themeService: ThemeService
  ) {}

  ngOnInit() {
    this.addTask();
    this.updatePreview();
    this.setMinDate();
  }

  setMinDate(): void {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  addTask(): void {
    this.tasks.push({
      type: 'start',
      title: '',
      status: 'Not Started',
      clickupId: '',
      additionalNotes: ''
    });
    this.updatePreview();
  }

  removeTask(index: number): void {
    this.tasks.splice(index, 1);
    this.updatePreview();
  }

  updatePreview(): void {
    this.livePreview = this.messageService.generateMessage(this.tasks);
  }

  selectTemplate(templateId: string): void {
    this.messageService.setSelectedTemplate(templateId);
    this.updatePreview();
  }

  async sendToGoogleChat(): Promise<void> {
    if (this.tasks.length === 0) return;

    this.isLoading = true;
    
    const statusData: StatusUpdateData = {
      tasks: this.tasks,
      messageTemplate: this.messageService.getSelectedTemplate(),
      formattedMessage: this.livePreview
    };

    try {
      await this.apiService.sendToGoogleChat(statusData).toPromise();
      console.log('Status sent successfully to Google Chat!');
      this.showPopupMessage('Status update sent successfully to Google Chat!', 'success');
    } catch (error) {
      console.error('Failed to send status to Google Chat:', error);
      this.showPopupMessage('Failed to send status update to Google Chat. Please try again.', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async sendToTelegram(): Promise<void> {
    if (this.tasks.length === 0) return;

    this.isSendingTelegram = true;
    
    const statusData: StatusUpdateData = {
      tasks: this.tasks,
      messageTemplate: this.messageService.getSelectedTemplate(),
      formattedMessage: this.livePreview
    };

    try {
      const response = await this.apiService.sendToTelegram(statusData).toPromise();
      console.log('Status sent successfully to Telegram!', response);
      
      if (response && response.Success) {
        this.showPopupMessage(response.Message || 'Status update sent successfully to Telegram!', 'success');
      } else {
        this.showPopupMessage(response?.Message || 'Failed to send status update to Telegram.', 'error');
      }
    } catch (error: any) {
      console.error('Failed to send status to Telegram:', error);
      const errorMessage = error.error?.Message || error.error?.message || error.message || 'Failed to send status update to Telegram. Please check your Telegram configuration.';
      this.showPopupMessage(errorMessage, 'error');
    } finally {
      this.isSendingTelegram = false;
    }
  }

  toggleScheduleModal(): void {
    this.showScheduleModal = !this.showScheduleModal;
    if (this.showScheduleModal) {
      this.resetScheduledTask();
    }
  }

  closeScheduleModal(): void {
    this.showScheduleModal = false;
  }

  resetScheduledTask(): void {
    this.scheduledTask = {
      title: '',
      status: 'Not Started',
      clickupId: '',
      additionalNotes: '',
      scheduledDate: '',
      scheduledTime: '',
      type: 'start'
    };
  }

  async scheduleTask(): Promise<void> {
    if (!this.scheduledTask.title || !this.scheduledTask.scheduledDate || !this.scheduledTask.scheduledTime) {
      return;
    }

    this.isScheduling = true;

    const scheduleData: ScheduleTaskData = {
      scheduledTasks: [this.scheduledTask]
    };

    try {
      await this.apiService.scheduleTask(scheduleData).toPromise();
      console.log('Task scheduled successfully!');
      this.showPopupMessage('Task scheduled successfully!', 'success');
      this.closeScheduleModal();
    } catch (error) {
      console.error('Failed to schedule task:', error);
      this.showPopupMessage('Failed to schedule task. Please try again.', 'error');
    } finally {
      this.isScheduling = false;
    }
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
}