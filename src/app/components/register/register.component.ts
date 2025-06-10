import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerData: RegisterRequest = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  registerError = '';
  firstNameError = '';
  lastNameError = '';
  emailError = '';
  passwordError = '';
  confirmPasswordError = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  validateForm(): boolean {
    this.firstNameError = '';
    this.lastNameError = '';
    this.emailError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
    this.registerError = '';

    let isValid = true;

    if (!this.registerData.firstName.trim()) {
      this.firstNameError = 'First name is required';
      isValid = false;
    }

    if (!this.registerData.lastName.trim()) {
      this.lastNameError = 'Last name is required';
      isValid = false;
    }

    if (!this.registerData.email) {
      this.emailError = 'Email is required';
      isValid = false;
    } else if (!this.isValidEmail(this.registerData.email)) {
      this.emailError = 'Please enter a valid email address';
      isValid = false;
    }

    if (!this.registerData.password) {
      this.passwordError = 'Password is required';
      isValid = false;
    } else if (this.registerData.password.length < 6) {
      this.passwordError = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (!this.registerData.confirmPassword) {
      this.confirmPasswordError = 'Please confirm your password';
      isValid = false;
    } else if (this.registerData.password !== this.registerData.confirmPassword) {
      this.confirmPasswordError = 'Passwords do not match';
      isValid = false;
    }

    return isValid;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async onRegister(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.registerError = '';

    try {
      const response = await this.authService.register(this.registerData).toPromise();
      console.log('Registration successful:', response);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Registration failed:', error);
      this.registerError = error.error?.message || 'Registration failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}