/**
 * Route Validation Utility
 * 
 * Utility to validate route organization and structure
 */

import { Router } from 'express';

interface RouteInfo {
  path: string;
  method: string;
  middleware: string[];
}

interface RouteGroup {
  name: string;
  basePath: string;
  description: string;
  routes: RouteInfo[];
}

/**
 * Extract route information from Express router
 */
export function extractRouteInfo(router: Router): RouteInfo[] {
  const routes: RouteInfo[] = [];
  
  // This is a simplified implementation
  // In a real scenario, you'd need to traverse the router stack
  const stack = (router as any).stack || [];
  
  stack.forEach((layer: any) => {
    if (layer.route) {
      const route = layer.route;
      Object.keys(route.methods).forEach(method => {
        if (route.methods[method]) {
          routes.push({
            path: route.path,
            method: method.toUpperCase(),
            middleware: route.stack.map((s: any) => s.name || 'anonymous')
          });
        }
      });
    }
  });
  
  return routes;
}

/**
 * Validate route organization
 */
export function validateRouteOrganization(router: Router): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  const routes = extractRouteInfo(router);
  
  // Check if routes exist
  if (routes.length === 0) {
    issues.push('No routes found in router');
  }
  
  // Check for common patterns
  const hasAuth = routes.some(r => r.path.includes('auth'));
  const hasUsers = routes.some(r => r.path.includes('users'));
  const hasCompanies = routes.some(r => r.path.includes('companies'));
  
  if (!hasAuth) {
    suggestions.push('Consider adding authentication routes');
  }
  
  if (!hasUsers) {
    suggestions.push('Consider adding user management routes');
  }
  
  if (!hasCompanies) {
    suggestions.push('Consider adding company management routes');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

/**
 * Generate route documentation
 */
export function generateRouteDocumentation(routeGroups: RouteGroup[]): string {
  let doc = '# API Routes Documentation\n\n';
  
  routeGroups.forEach(group => {
    doc += `## ${group.name}\n`;
    doc += `Base path: ${group.basePath}\n`;
    doc += `${group.description}\n\n`;
    
    if (group.routes.length > 0) {
      doc += '### Endpoints\n';
      group.routes.forEach(route => {
        doc += `- \`${route.method} ${route.path}\`\n`;
      });
      doc += '\n';
    }
  });
  
  return doc;
}

/**
 * Validate route security
 */
export function validateRouteSecurity(routes: RouteInfo[]): {
  secureRoutes: number;
  unsecureRoutes: number;
  issues: string[];
} {
  let secureRoutes = 0;
  let unsecureRoutes = 0;
  const issues: string[] = [];
  
  routes.forEach(route => {
    const hasAuth = route.middleware.some(m => 
      m.includes('auth') || m.includes('verify') || m.includes('token')
    );
    
    if (hasAuth) {
      secureRoutes++;
    } else {
      unsecureRoutes++;
      // Only flag non-auth routes as potentially insecure
      if (!route.path.includes('/auth/') && !route.path.includes('/health')) {
        issues.push(`Route ${route.method} ${route.path} may need authentication`);
      }
    }
  });
  
  return {
    secureRoutes,
    unsecureRoutes,
    issues
  };
}

/**
 * Route organization constants
 */
export const ROUTE_GROUPS = {
  AUTH: 'Authentication & User Management',
  BUSINESS: 'Core Business Entities',
  TASKS: 'Task & Ticket Management',
  SYSTEM: 'System Features',
  DATA: 'Data & Analytics',
  ADMIN: 'System Administration'
} as const;

export const EXPECTED_ROUTES = [
  '/auth',
  '/users',
  '/sessions',
  '/companies',
  '/contacts',
  '/follow-ups',
  '/tasks',
  '/tickets',
  '/comments',
  '/custom-fields',
  '/notifications',
  '/files',
  '/analytics',
  '/export',
  '/search',
  '/pdf',
  '/admin',
  '/monitoring',
  '/errors'
] as const;