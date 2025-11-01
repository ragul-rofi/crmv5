export const securityConfig = {
  // CSRF Protection
  csrf: {
    enabled: process.env.NODE_ENV === 'production',
    cookieName: '_csrf',
    headerName: 'x-csrf-token'
  },
  
  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'change-this-in-production',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // SSL/TLS Configuration
  ssl: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
    ca: process.env.DB_SSL_CA
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    authMax: 5 // limit auth attempts to 5 per windowMs
  },
  
  // File Upload Security
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
  }
};