import { describe, it, expect } from 'vitest';

import {
  isValidEmail,
  isValidPassword,
  calculatePasswordStrength,
  isValidName,
  sanitizeInput,
  isValidRole,
  formatErrorMessage,
} from '../validation';

describe('isValidEmail', () => {
  it('should return true for valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('test.user@example.com')).toBe(true);
    expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
    expect(isValidEmail('user_name@example.com')).toBe(true);
  });

  it('should return false for invalid email addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user @example.com')).toBe(false);
    expect(isValidEmail('user@example')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(isValidEmail('   ')).toBe(false);
    expect(isValidEmail('  user@example.com  ')).toBe(true); // trim
    expect(isValidEmail(null as any)).toBe(false);
    expect(isValidEmail(undefined as any)).toBe(false);
    expect(isValidEmail(123 as any)).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('should return true for passwords with 8+ characters', () => {
    expect(isValidPassword('12345678')).toBe(true);
    expect(isValidPassword('password')).toBe(true);
    expect(isValidPassword('P@ssw0rd')).toBe(true);
    expect(isValidPassword('a'.repeat(8))).toBe(true);
    expect(isValidPassword('very long password with spaces')).toBe(true);
  });

  it('should return false for passwords with less than 8 characters', () => {
    expect(isValidPassword('')).toBe(false);
    expect(isValidPassword('1234567')).toBe(false);
    expect(isValidPassword('pass')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(isValidPassword(null as any)).toBe(false);
    expect(isValidPassword(undefined as any)).toBe(false);
    expect(isValidPassword(12345678 as any)).toBe(false);
  });
});

describe('calculatePasswordStrength', () => {
  it('should return weak for empty or very short passwords', () => {
    expect(calculatePasswordStrength('')).toEqual({
      level: 'weak',
      score: 0,
      color: 'bg-gray-300',
      width: '0%',
    });
    
    expect(calculatePasswordStrength('123')).toEqual({
      level: 'weak',
      score: 1,
      color: 'bg-red-500',
      width: '25%',
    });
  });

  it('should return fair for passwords with basic requirements', () => {
    const result = calculatePasswordStrength('password');
    expect(result.level).toBe('fair');
    expect(result.width).toBe('50%');
  });

  it('should return good for passwords with mixed case and numbers', () => {
    const result = calculatePasswordStrength('Password123');
    expect(result.level).toBe('good');
    expect(result.width).toBe('75%');
  });

  it('should return strong for complex passwords', () => {
    const result = calculatePasswordStrength('P@ssw0rd123!');
    expect(result.level).toBe('strong');
    expect(result.width).toBe('100%');
  });

  it('should consider password length in scoring', () => {
    const short = calculatePasswordStrength('Pass123!');
    const long = calculatePasswordStrength('PassWord123!Extra');
    
    expect(long.score).toBeGreaterThanOrEqual(short.score);
  });

  it('should recognize special characters', () => {
    const withSpecial = calculatePasswordStrength('Password123!@#');
    const withoutSpecial = calculatePasswordStrength('Password123');
    
    expect(withSpecial.score).toBeGreaterThan(withoutSpecial.score);
  });
});

describe('isValidName', () => {
  it('should return true for valid names', () => {
    expect(isValidName('John')).toBe(true);
    expect(isValidName('Jane Doe')).toBe(true);
    expect(isValidName('Dr. Smith')).toBe(true);
    expect(isValidName('María García')).toBe(true);
  });

  it('should return false for invalid names', () => {
    expect(isValidName('')).toBe(false);
    expect(isValidName(' ')).toBe(false);
    expect(isValidName('A')).toBe(false); // Too short
    expect(isValidName('a'.repeat(101))).toBe(false); // Too long
  });

  it('should handle edge cases', () => {
    expect(isValidName(null as any)).toBe(false);
    expect(isValidName(undefined as any)).toBe(false);
    expect(isValidName(123 as any)).toBe(false);
    expect(isValidName('  John  ')).toBe(true); // Trims whitespace
  });
});

describe('sanitizeInput', () => {
  it('should escape HTML special characters', () => {
    expect(sanitizeInput('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
  });

  it('should escape ampersands', () => {
    expect(sanitizeInput('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should escape quotes', () => {
    expect(sanitizeInput('He said "Hello"')).toBe('He said &quot;Hello&quot;');
    expect(sanitizeInput("It's fine")).toBe('It&#x27;s fine');
  });

  it('should handle empty or invalid input', () => {
    expect(sanitizeInput('')).toBe('');
    expect(sanitizeInput(null as any)).toBe('');
    expect(sanitizeInput(undefined as any)).toBe('');
  });

  it('should escape slashes', () => {
    expect(sanitizeInput('path/to/file')).toBe('path&#x2F;to&#x2F;file');
  });
});

describe('isValidRole', () => {
  it('should return true for valid roles', () => {
    expect(isValidRole('student')).toBe(true);
    expect(isValidRole('supervisor')).toBe(true);
    expect(isValidRole('admin')).toBe(true);
  });

  it('should return false for invalid roles', () => {
    expect(isValidRole('user')).toBe(false);
    expect(isValidRole('STUDENT')).toBe(false); // Case sensitive
    expect(isValidRole('')).toBe(false);
    expect(isValidRole('invalid')).toBe(false);
  });
});

describe('formatErrorMessage', () => {
  it('should return user-friendly message for common errors', () => {
    expect(formatErrorMessage({ message: 'Invalid login credentials' }))
      .toBe('Email or password is incorrect');
    
    expect(formatErrorMessage({ message: 'Email not confirmed' }))
      .toBe('Please check your email to verify your account');
    
    expect(formatErrorMessage({ message: 'User already registered' }))
      .toBe('An account with this email already exists');
  });

  it('should handle string errors', () => {
    expect(formatErrorMessage('Something went wrong')).toBe('Something went wrong');
  });

  it('should handle unknown errors', () => {
    expect(formatErrorMessage({ message: 'Unknown database error' }))
      .toBe('Unknown database error');
  });

  it('should handle null/undefined errors', () => {
    expect(formatErrorMessage(null)).toBe('An unknown error occurred');
    expect(formatErrorMessage(undefined)).toBe('An unknown error occurred');
  });

  it('should handle errors without message property', () => {
    expect(formatErrorMessage({ code: 500 }))
      .toBe('An unexpected error occurred. Please try again.');
  });
});

