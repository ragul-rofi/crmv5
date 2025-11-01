/**
 * Basic validation middleware tests
 * Note: This is a simple test file. For full testing, install Jest types with:
 * npm install --save-dev @types/jest
 */

import { validateRequest, validateQuery, validateParams, validate } from '../validation.js';
import { z } from 'zod';

// Mock response object
const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
};

// Mock next function
const mockNext = jest.fn();

describe('Validation Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRequest', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });

    test('should pass valid data', () => {
      const req = {
        body: { name: 'John Doe', email: 'john@example.com' }
      };
      const res = createMockResponse();
      
      const middleware = validateRequest(testSchema);
      middleware(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(req.body.name).toBe('John Doe');
      expect(req.body.email).toBe('john@example.com');
    });

    test('should reject invalid data', () => {
      const req = {
        body: { name: '', email: 'invalid-email' }
      };
      const res = createMockResponse();
      
      const middleware = validateRequest(testSchema);
      middleware(req, res, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation failed'
        })
      );
    });

    test('should sanitize XSS attempts', () => {
      const req = {
        body: { 
          name: '<script>alert("xss")</script>John', 
          email: 'john@example.com' 
        }
      };
      const res = createMockResponse();
      
      const middleware = validateRequest(testSchema);
      middleware(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(req.body.name).toBe('John');
    });
  });

  describe('validateQuery', () => {
    const querySchema = z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional(),
      search: z.string().optional(),
    });

    test('should pass valid query parameters', () => {
      const req = {
        query: { page: '1', search: 'test' }
      };
      const res = createMockResponse();
      
      const middleware = validateQuery(querySchema);
      middleware(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(req.query.page).toBe(1);
      expect(req.query.search).toBe('test');
    });
  });

  describe('validateParams', () => {
    const paramSchema = z.object({
      id: z.string().uuid(),
    });

    test('should pass valid UUID parameter', () => {
      const req = {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' }
      };
      const res = createMockResponse();
      
      const middleware = validateParams(paramSchema);
      middleware(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    test('should reject invalid UUID parameter', () => {
      const req = {
        params: { id: 'invalid-uuid' }
      };
      const res = createMockResponse();
      
      const middleware = validateParams(paramSchema);
      middleware(req, res, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('combined validate', () => {
    const schemas = {
      body: z.object({ name: z.string() }),
      query: z.object({ page: z.string().optional() }),
      params: z.object({ id: z.string().uuid() })
    };

    test('should validate all parts when provided', () => {
      const req = {
        body: { name: 'John' },
        query: { page: '1' },
        params: { id: '123e4567-e89b-12d3-a456-426614174000' }
      };
      const res = createMockResponse();
      
      const middleware = validate(schemas);
      middleware(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

// Simple validation check if this file is run directly
if (typeof global !== 'undefined' && !global.jest) {
  console.log('Validation middleware tests would run here with Jest');
  console.log('Install Jest to run: npm install --save-dev jest @types/jest');
}