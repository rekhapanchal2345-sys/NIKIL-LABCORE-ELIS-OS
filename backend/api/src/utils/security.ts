import * as crypto from 'crypto';

/**
 * Security Configuration and Utilities
 * HIPAA/GDPR compliant security measures
 */

export const securityConfig = {
  // Password policies
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90, // days - force password change
    preventReuse: 5, // prevent reusing last N passwords
  },

  // Session management
  session: {
    timeoutMinutes: 30,
    maxConcurrentSessions: 3,
    absoluteTimeoutHours: 8,
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // limit each IP to 100 requests per windowMs
    loginAttempts: 5, // max failed login attempts
    lockoutDuration: 15 * 60 * 1000, // 15 minutes lockout
  },

  // Data encryption
  encryption: {
    algorithm: 'aes-256-gcm',
    keyRotationDays: 90,
  },

  // Audit logging
  audit: {
    enabled: true,
    retentionDays: 365, // keep audit logs for 1 year minimum
    logLevel: 'INFO', // INFO, WARNING, ERROR
  },

  // Access control
  access: {
    twoFactorAuth: false, // can be enabled for enhanced security
    ipWhitelist: [] as string[], // specific IPs that can access the system
    ipBlacklist: [] as string[], // blocked IPs
    geoBlocking: false, // block access from certain countries
  },

  // File upload security
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    scanForViruses: false, // requires antivirus integration
  },

  // API security
  api: {
    enableCORS: true,
    allowedOrigins: [], // configure specific origins
    enableCSRF: true,
    enableXSSProtection: true,
    enableContentTypeProtection: true,
  },
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < securityConfig.password.minLength) {
    errors.push(`Password must be at least ${securityConfig.password.minLength} characters long`);
  }

  if (securityConfig.password.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (securityConfig.password.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (securityConfig.password.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (securityConfig.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return input;

  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers like onclick=
};

/**
 * Validate file upload
 */
export const validateFileUpload = (file: {
  size: number;
  mimetype: string;
}): { valid: boolean; error?: string } => {
  if (file.size > securityConfig.fileUpload.maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${securityConfig.fileUpload.maxSize / 1024 / 1024}MB`,
    };
  }

  if (!securityConfig.fileUpload.allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} is not allowed`,
    };
  }

  return { valid: true };
};

/**
 * Check if IP is allowed to access the system
 */
export const isIPAllowed = (ip: string): boolean => {
  // Check blacklist first
  if (securityConfig.access.ipBlacklist.includes(ip)) {
    return false;
  }

  // If whitelist is configured, only allow whitelisted IPs
  if (securityConfig.access.ipWhitelist.length > 0) {
    return securityConfig.access.ipWhitelist.includes(ip);
  }

  // If no whitelist, allow all (except blacklisted)
  return true;
};

/**
 * Generate secure random password
 */
export const generateSecurePassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + special;
  let password = '';

  // Ensure at least one character from each category
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += special[crypto.randomInt(special.length)];

  // Fill the rest with random characters
  for (let i = password.length; i < securityConfig.password.minLength; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle the password using Fisher-Yates
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }
  return passwordArray.join('');
};

/**
 * Mask sensitive data for logging
 */
export const maskSensitiveData = (data: string, maskChar: string = '*'): string => {
  if (!data || data.length <= 4) {
    return maskChar.repeat(data?.length || 0);
  }

  const visibleChars = 4;
  const maskedChars = data.length - visibleChars;
  return data.substring(0, visibleChars) + maskChar.repeat(maskedChars);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
export const isValidPhone = (phone: string): boolean => {
  // Allow various phone number formats
  const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;
  return phoneRegex.test(phone);
};

/**
 * Security headers configuration
 */
export const getSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };
};