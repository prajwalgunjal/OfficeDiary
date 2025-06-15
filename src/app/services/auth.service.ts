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
        // Verify token is still valid (basic check)
        if (this.isTokenValid(token)) {
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        } else {
          this.clearAuthData();
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.clearAuthData();
      }
    } else {
      this.isAuthenticatedSubject.next(false);
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = this.parseJwtPayload(token);
      if (!payload || !payload.exp) {
        return false;
      }
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      return false;
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

  private createUserFromToken(token: string, email: string, firstName?: string, lastName?: string): User {
    const payload = this.parseJwtPayload(token);
    
    // Use provided names or extract from email
    const emailParts = email.split('@')[0];
    const defaultFirstName = firstName || emailParts.charAt(0).toUpperCase() + emailParts.slice(1);
    const defaultLastName = lastName || 'User';
    
    return {
      id: payload?.userID || '1',
      email: email,
      firstName: defaultFirstName,
      lastName: defaultLastName,
      fullName: `${defaultFirstName} ${defaultLastName}`,
      initials: `${defaultFirstName.charAt(0)}${defaultLastName.charAt(0)}`
    };
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<BackendAuthResponse>(`${this.baseUrl}/login`, credentials)
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
    return this.http.post<BackendAuthResponse>(`${this.baseUrl}/register`, userData)
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
              username: userData.username,
              phone: userData.phone,
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
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
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