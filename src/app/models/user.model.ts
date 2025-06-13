export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  phone?: string;
  fullName: string;
  initials: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}