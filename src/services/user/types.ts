
// User profile types
export interface UserProfileRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UserProfileData {
  id: string;
  name: string;
  email?: string;  // Make email optional to match database schema
  phone?: string;
  address?: string;
  role?: string;
  company_name?: string;
  nif?: string;
  city?: string;
  postal_code?: string;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  company_name?: string;
  city?: string;
  postal_code?: string;
}

export interface FiscalData {
  nif?: string;
  company_name?: string;
  address?: string;
  phone_invoice?: string;
  city?: string;
  postal_code?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

export interface ServiceResult<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

// Add missing type
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

// Add missing type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
