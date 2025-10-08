/**
 * Validation utilities for form inputs and business logic
 */

/**
 * Validates if an email address is in a valid format
 * @param email - The email address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Basic email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates if a password meets minimum requirements
 * @param password - The password to validate
 * @returns true if valid (8+ characters), false otherwise
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  return password.length >= 8;
}

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  level: PasswordStrength;
  score: number;
  color: string;
  width: string;
}

/**
 * Calculates password strength based on various criteria
 * @param password - The password to analyze
 * @returns PasswordStrengthResult object with level, score, color, and width
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length === 0) {
    return { level: 'weak', score: 0, color: 'bg-gray-300', width: '0%' };
  }
  
  if (password.length < 8) {
    return { level: 'weak', score: 1, color: 'bg-red-500', width: '25%' };
  }
  
  let score = 0;
  
  // Length score
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character variety score
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  // Determine strength level
  if (score <= 2) {
    return { level: 'fair', score, color: 'bg-orange-500', width: '50%' };
  } else if (score <= 3) {
    return { level: 'good', score, color: 'bg-yellow-500', width: '75%' };
  } else {
    return { level: 'strong', score, color: 'bg-green-500', width: '100%' };
  }
}

/**
 * Validates if a name is acceptable (not empty, reasonable length)
 * @param name - The name to validate
 * @returns true if valid, false otherwise
 */
export function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

/**
 * Sanitizes a string to prevent XSS attacks
 * @param input - The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates if a role is a valid user role
 * @param role - The role to validate
 * @returns true if valid role, false otherwise
 */
export function isValidRole(role: string): boolean {
  const validRoles = ['student', 'supervisor', 'admin'];
  return validRoles.includes(role);
}

/**
 * Formats an error message for user display
 * @param error - The error object or message
 * @returns User-friendly error message
 */
export function formatErrorMessage(error: any): string {
  if (!error) {
    return 'An unknown error occurred';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error.message) {
    // Map common error messages to user-friendly text
    const errorMap: { [key: string]: string } = {
      'Invalid login credentials': 'Email or password is incorrect',
      'Email not confirmed': 'Please check your email to verify your account',
      'User already registered': 'An account with this email already exists',
    };
    
    return errorMap[error.message] || error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

