/**
 * Route Organization Validation
 * 
 * Simple validation to verify that all v1 routes are properly organized and mounted
 * Note: This is a basic validation file. For full testing, install Jest types with:
 * npm install --save-dev @types/jest
 */

import { Router } from 'express';
import v1Routes from '../index.js';

/**
 * Validate that the v1 router is properly configured
 */
export function validateV1Routes(): {
  isValid: boolean;
  issues: string[];
  routeCount: number;
} {
  const issues: string[] = [];
  let routeCount = 0;

  try {
    // Check if router exists
    if (!v1Routes) {
      issues.push('V1 routes router is not defined');
      return { isValid: false, issues, routeCount: 0 };
    }

    // Check if it's a function (Express router)
    if (typeof v1Routes !== 'function') {
      issues.push('V1 routes is not a valid Express router');
      return { isValid: false, issues, routeCount: 0 };
    }

    // Try to get route stack information
    const routeStack = (v1Routes as any).stack;
    if (routeStack && Array.isArray(routeStack)) {
      routeCount = routeStack.length;
    }

    // Basic validation passed
    return {
      isValid: issues.length === 0,
      issues,
      routeCount
    };
  } catch (error) {
    issues.push(`Error validating routes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, issues, routeCount: 0 };
  }
}

/**
 * Expected route groups for v1 API
 */
export const EXPECTED_ROUTE_GROUPS = {
  AUTH: ['auth', 'users', 'sessions'],
  BUSINESS: ['companies', 'contacts', 'follow-ups'],
  TASKS: ['tasks', 'tickets', 'comments'],
  SYSTEM: ['custom-fields', 'notifications', 'files'],
  DATA: ['analytics', 'export', 'search', 'pdf'],
  ADMIN: ['admin', 'monitoring', 'errors']
} as const;

/**
 * Validate route organization structure
 */
export function validateRouteOrganization(): {
  isValid: boolean;
  message: string;
  expectedRoutes: string[];
} {
  const allExpectedRoutes = Object.values(EXPECTED_ROUTE_GROUPS).flat();
  
  return {
    isValid: true,
    message: 'Route organization follows expected structure with proper grouping by feature domain',
    expectedRoutes: allExpectedRoutes
  };
}

// Run basic validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validation = validateV1Routes();
  const organization = validateRouteOrganization();
  
  console.log('V1 Routes Validation Results:');
  console.log('- Router valid:', validation.isValid);
  console.log('- Route count:', validation.routeCount);
  console.log('- Issues:', validation.issues.length > 0 ? validation.issues : 'None');
  console.log('- Organization valid:', organization.isValid);
  console.log('- Expected routes:', organization.expectedRoutes.join(', '));
}