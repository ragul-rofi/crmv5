import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/environment.js';

const sanitizeLogInput = (input: any): string => {
  if (typeof input !== 'string') {
    input = String(input);
  }
  return input.replace(/[\r\n\t]/g, '_').replace(/[^\x20-\x7E]/g, '?');
};

// Create Winston logger
const logger = winston.createLogger({
  level: config.monitoring.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'crm-api' },
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    // Combined logs
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

// Add console transport for development
if (config.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export const safeLog = {
  info: (message: string, meta?: any) => {
    logger.info(sanitizeLogInput(message), meta);
  },
  error: (message: string, meta?: any) => {
    logger.error(sanitizeLogInput(message), meta);
  },
  warn: (message: string, meta?: any) => {
    logger.warn(sanitizeLogInput(message), meta);
  },
  debug: (message: string, meta?: any) => {
    logger.debug(sanitizeLogInput(message), meta);
  }
};