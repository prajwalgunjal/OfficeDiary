import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';

// Interface for your backend's actual response
interface BackendAuthResponse {
  data: string; // JWT token
  message: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'https://localhost:44329/api/Employee'; // Replace with your backend URL
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        this.logout();
      }
    }
  }

  private parseJwtPayload(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  }

  private createUserFromToken(token: string, email: string): User {
    const payload = this.parseJwtPayload(token);
    
    // Extract name parts from email or use defaults
    const emailParts = email.split('@')[0];
    const firstName = emailParts.charAt(0).toUpperCase() + emailParts.slice(1);
    const lastName = 'User'; // Default since we don't have last name
    
    return {
      id: payload?.userID || '1',
      email: email,
      firstName: firstName,
      lastName: lastName,
      fullName: `${firstName} ${lastName}`,
      initials: `${firstName.charAt(0)}${lastName.charAt(0)}`
    };
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<BackendAuthResponse>(`${this.baseUrl}/Login`, credentials)
      .pipe(
        map(response => {
          console.log('Backend response:', response);
          
          if (response.success && response.data) {
            // Extract token from data field
            const token = response.data;
            
            // Create user object from token and email
            const user = this.createUserFromToken(token, credentials.email);
            
            // Set authentication data
            this.setAuthData(token, user);
            
            // Return in expected format
            return {
              token: token,
              user: user,
              message: response.message
            } as AuthResponse;
          } else {
            throw new Error(response.message || 'Login failed');
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<BackendAuthResponse>(`${this.baseUrl}/RegisterEmployee`, userData)
      .pipe(
        map(response => {
          console.log('Backend response:', response);
          
          if (response.success && response.data) {
            // Extract token from data field
            const token = response.data;
            
            // Create user object from registration data
            const user: User = {
              id: '1', // Will be updated from token if available
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              fullName: `${userData.firstName} ${userData.lastName}`,
              initials: `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`
            };
            
            // Set authentication data
            this.setAuthData(token, user);
            
            // Return in expected format
            return {
              token: token,
              user: user,
              message: response.message
            } as AuthResponse;
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        }),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private setAuthData(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }
}