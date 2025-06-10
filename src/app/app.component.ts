import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'StatusSync';
  public authService: AuthService;

  constructor(
    public themeService: ThemeService,
    authService: AuthService
  ) {
    this.authService = authService;
  }

  ngOnInit() {
    this.themeService.initializeTheme();
  }
}