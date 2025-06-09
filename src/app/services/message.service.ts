import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TaskData } from './api.service';
import { ThemeService } from './theme.service';

export interface MessageTemplate {
  id: string;
  name: string;
  icon: string;
  template: (tasks: TaskData[], isDark: boolean) => string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private selectedTemplateSubject = new BehaviorSubject<string>('professional');
  selectedTemplate$ = this.selectedTemplateSubject.asObservable();

  templates: MessageTemplate[] = [
    {
      id: 'professional',
      name: 'Professional Format',
      icon: '💼',
      template: (tasks: TaskData[], isDark: boolean) => {
        const greeting = isDark ? '🌙 Evening Update' : '☀️ Daily Update';
        return `${greeting}\n\n${tasks.map(task => 
          `• ${task.title} (${task.type === 'start' ? 'Day Start' : 'Day End'})\n  Status: ${task.status}${task.clickupId ? `\n  ClickUp: ${task.clickupId}` : ''}${task.additionalNotes ? `\n  Notes: ${task.additionalNotes}` : ''}`
        ).join('\n\n')}`;
      }
    },
    {
      id: 'casual',
      name: 'Casual Summary',
      icon: '😊',
      template: (tasks: TaskData[], isDark: boolean) => {
        const greeting = isDark ? '🌟 Hey team! Here\'s what I worked on today:' : '👋 Hi everyone! Daily update:';
        return `${greeting}\n\n${tasks.map(task => 
          `🎯 ${task.title}\n⏰ ${task.type === 'start' ? 'Starting my day' : 'Ending my day'}\n📊 ${task.status}${task.additionalNotes ? `\n💭 ${task.additionalNotes}` : ''}`
        ).join('\n\n')}`;
      }
    },
    {
      id: 'bullet',
      name: 'Bullet Style',
      icon: '🔸',
      template: (tasks: TaskData[], isDark: boolean) => {
        const emoji = isDark ? '🔹' : '▫️';
        return `📝 Status Update\n\n${tasks.map(task => 
          `${emoji} ${task.title}\n   ${task.type === 'start' ? 'Day Start' : 'Day End'} | ${task.status}`
        ).join('\n')}`;
      }
    },
    {
      id: 'emoji',
      name: 'Emoji-Based',
      icon: '🎨',
      template: (tasks: TaskData[], isDark: boolean) => {
        const statusEmoji = (status: string) => {
          switch(status.toLowerCase()) {
            case 'completed': return '✅';
            case 'in progress': return '⏳';
            case 'not started': return '📋';
            default: return '📌';
          }
        };
        const themeEmoji = isDark ? '🌙✨' : '☀️🌟';
        return `${themeEmoji} Today's Progress\n\n${tasks.map(task => 
          `${statusEmoji(task.status)} ${task.title}\n🕐 ${task.type === 'start' ? 'Day Start' : 'Day End'}${task.additionalNotes ? `\n💡 ${task.additionalNotes}` : ''}`
        ).join('\n\n')}`;
      }
    }
  ];

  constructor(private themeService: ThemeService) {}

  setSelectedTemplate(templateId: string): void {
    this.selectedTemplateSubject.next(templateId);
  }

  getSelectedTemplate(): string {
    return this.selectedTemplateSubject.value;
  }

  generateMessage(tasks: TaskData[]): string {
    const selectedTemplate = this.templates.find(t => t.id === this.selectedTemplateSubject.value);
    const isDark = this.themeService.getCurrentTheme();
    return selectedTemplate ? selectedTemplate.template(tasks, isDark) : '';
  }
}