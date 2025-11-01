import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import session from 'express-session';
import { createServer } from 'http';
import routes from './routes/index.js';
import healthRoutes from './routes/health.routes.js';
import { forceHTTPS, securityHeaders } from './middleware/ssl.js';
import { query } from './db.js';
// import { runMigrations } from './migrate.js';
import fs from 'fs';
import { initializeSchedulers } from './utils/scheduler.js';
// import { apiLimiter } from './middleware/rateLimit.js'; // Removed - using security middleware
import { generateCSRFToken } from './middleware/csrf.js';
import { safeLog } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { sanitizeInput, apiRateLimit } from './middleware/security.js';
import { addRequestId, globalErrorHandler, notFoundHandler } from './utils/standardResponse.js';

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.PORT || '5000');

// Security middleware
app.use(forceHTTPS);
app.use(securityHeaders);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://127.0.0.1:3000'] 
    : true, // In production, you might want to specify your domain
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(sanitizeInput);

// Add request ID to all requests
app.use(addRequestId);

// Performance middleware
import { responseCompression } from './middleware/compression.js';
import { enhancedInputSanitization } from './middleware/inputSanitization.js';
app.use(responseCompression);
app.use(enhancedInputSanitization);

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Session middleware for CSRF protection
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     secure: process.env.NODE_ENV === 'production',
//     httpOnly: true,
//     maxAge: 24 * 60 * 60 * 1000 // 24 hours
//   }
// }));

// Generate CSRF tokens
// app.use(generateCSRFToken);

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Serve static files from the React app build directory
let distPath;
if (isProduction) {
  // In production on Render, the structure is:
  // dist/ (frontend build)
  // dist/server/ (backend build)
  // server is running from dist/server/
  distPath = path.join(__dirname, '..'); // This points to dist/
} else {
  // In development, frontend build goes to dist/
  distPath = path.join(__dirname, '..', 'dist');
}

console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Serving static files from:', distPath);
console.log('Current directory:', __dirname);

// Serve static files (only in production, as Vercel handles this in development)
if (isProduction) {
  app.use(express.static(distPath));
}

// Apply rate limiting to all API routes
app.use('/api', apiRateLimit);

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: (req as any).session?.csrfToken });
});

// Health check routes
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// V1 API Routes (Primary)
import v1Routes from './routes/v1/index.js';
app.use('/api/v1', v1Routes);

// Legacy routes redirect to v1 for backward compatibility
app.use('/api', (req, res, next) => {
  // Skip if already v1 or health/export routes
  if (req.path.startsWith('/v1') || req.path.startsWith('/health') || req.path.startsWith('/export')) {
    return next();
  }
  
  // Redirect legacy routes to v1
  const v1Path = `/api/v1${req.path}`;
  safeLog.info(`Redirecting legacy route ${req.originalUrl} to ${v1Path}`);
  return res.redirect(301, v1Path + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''));
});

// Keep essential non-versioned routes
app.use('/api', routes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await query('SELECT NOW()');
    
    res.status(200).json({ 
      status: 'ok', 
      message: 'Server is healthy', 
      services: { 
        database: 'connected'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'Server is not healthy', 
      services: { 
        database: 'disconnected'
      },
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await query('SELECT NOW()');
    
    res.status(200).json({ 
      status: 'ok', 
      message: 'API is healthy', 
      services: { 
        database: 'connected'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'API is not healthy', 
      services: { 
        database: 'disconnected'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
// Only serve index.html in production
if (isProduction) {
  app.get(/^((?!\/api\/).)*$/, (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    safeLog.info('Serving index.html');
    
    // Check if file exists
    if (!existsSync(indexPath)) {
      safeLog.error('index.html not found');
      return res.status(404).send('File not found');
    }
    
    res.sendFile(indexPath, (err) => {
      if (err) {
        safeLog.error('Error serving index.html:', err);
        if (!res.headersSent) {
          res.status(500).send('Internal Server Error');
        }
      }
    });
  });
}

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    await query('SELECT NOW()');
    safeLog.info('✅ Database connected successfully');
    
    // Setup database schema (only in development and if tables don't exist)
    safeLog.info('🗄️ Checking database schema...');
    
    try {
      // Check if users table exists
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        );
      `);
      
      if (!result.rows[0].exists) {
        // Only create schema if tables don't exist
        safeLog.info('Creating database schema...');
        const schemaScript = fs.readFileSync(path.resolve(__dirname, '../database/schema.sql'), 'utf-8');
        await query(schemaScript);
        safeLog.info('✅ Database schema created successfully');
      } else {
        safeLog.info('✅ Database schema already exists, skipping creation');
      }
    } catch (error) {
      safeLog.error('Error checking/creating database schema:', error);
    }
    
    // Initialize automated schedulers (deadline reminders, overdue notifications)
    safeLog.info('⏰ Initializing automated schedulers...');
    initializeSchedulers();
    safeLog.info('✅ Schedulers started successfully');
    
    // Initialize Socket.IO
    const { initializeSocket } = await import('./socket.js');
    initializeSocket(server);
    
    // Start the server with error handling
    server.listen(PORT, () => {
      safeLog.info(`🚀 Server running on port ${PORT}`);
      if (isProduction) {
        safeLog.info(`📱 Access the application at http://localhost:${PORT}`);
      }
    }).on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        safeLog.error(`❌ Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
        const newPort = PORT + 1;
        server.listen(newPort, () => {
          safeLog.info(`🚀 Server running on port ${newPort}`);
          safeLog.info(`📱 Access the application at http://localhost:${newPort}`);
        });
      } else {
        safeLog.error('❌ Server failed to start:', err);
        process.exit(1);
      }
    });
  } catch (error) {
    safeLog.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();