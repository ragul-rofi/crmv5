#!/usr/bin/env node

// Pre-build script for Vercel deployment
// This script creates a frontend-only package.json for Vercel deployment

import fs from 'fs';

console.log('Running Vercel pre-build script...');

try {
  // Read the original package.json
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json not found');
  }
  
  const originalPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Create a copy for Vercel with only frontend dependencies
  const vercelPackage = { ...originalPackage };
  
  // Define backend dependencies to exclude
  const backendDeps = [
    'bcrypt', 'pg', 'express', 'jsonwebtoken', 'cors', 'node-cron', 
    'express-rate-limit', 'dotenv'
  ];
  
  // Define backend devDependencies to exclude
  const backendDevDeps = [
    '@types/express', '@types/node-cron', '@types/supertest', 
    'concurrently', 'supertest', 'tsx'
  ];
  
  console.log('Excluding backend dependencies:', backendDeps.join(', '));
  console.log('Excluding backend devDependencies:', backendDevDeps.join(', '));
  
  // Remove backend dependencies
  backendDeps.forEach(dep => {
    if (vercelPackage.dependencies && vercelPackage.dependencies[dep]) {
      delete vercelPackage.dependencies[dep];
      console.log(`Excluded ${dep} from dependencies`);
    }
  });
  
  // Remove backend devDependencies
  backendDevDeps.forEach(dep => {
    if (vercelPackage.devDependencies && vercelPackage.devDependencies[dep]) {
      delete vercelPackage.devDependencies[dep];
      console.log(`Excluded ${dep} from devDependencies`);
    }
  });
  
  // Write the Vercel-specific package.json
  fs.writeFileSync('package.vercel.json', JSON.stringify(vercelPackage, null, 2));
  
  // For Vercel, we'll use package.json as is, but let's make sure we have the right install command
  console.log('Created package.vercel.json for Vercel deployment');
  console.log('Pre-build script completed successfully!');
} catch (error) {
  console.error('Pre-build script failed:', error.message);
  process.exit(1);
}