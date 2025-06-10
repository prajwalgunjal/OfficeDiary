import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginData: LoginRequest = {
    email: '',
    password: ''
  };

  isLoading = false;
  showPassword = false;
  loginError = '';
  emailError = '';
  passwordError = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  validateForm(): boolean {
    this.emailError = '';
    this.passwordError = '';
    this.loginError = '';

    let isValid = true;

    if (!this.loginData.email) {
      this.emailError = 'Email is required';
      isValid = false;
    } else if (!this.isValidEmail(this.loginData.email)) {
      this.emailError = 'Please enter a valid email address';
      isValid = false;
    }

    if (!this.loginData.password) {
      this.passwordError = 'Password is required';
      isValid = false;
    } else if (this.loginData.password.length < 6) {
      this.passwordError = 'Password must be at least 6 characters';
      isValid = false;
    }

    return isValid;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async onLogin(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.loginError = '';

    try {
      const response = await this.authService.login(this.loginData).toPromise();
      console.log('Login successful:', response);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Login failed:', error);
      this.loginError = error.error?.message || 'Login failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}