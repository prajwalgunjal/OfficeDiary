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
    username: '',
    phone: '',
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
  usernameError = '';
  phoneError = '';
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
    this.usernameError = '';
    this.phoneError = '';
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

    if (!this.registerData.username.trim()) {
      this.usernameError = 'Username is required';
      isValid = false;
    } else if (this.registerData.username.length < 3) {
      this.usernameError = 'Username must be at least 3 characters';
      isValid = false;
    }

    if (!this.registerData.phone.trim()) {
      this.phoneError = 'Phone number is required';
      isValid = false;
    } else if (!this.isValidPhone(this.registerData.phone)) {
      this.phoneError = 'Please enter a valid phone number';
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

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
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
      // Redirect to login page after successful registration
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Registration failed:', error);
      this.registerError = error.error?.message || 'Registration failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}