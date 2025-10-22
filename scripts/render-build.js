#!/usr/bin/env node

// Render build script
// This script ensures that both frontend and backend are built correctly for deployment

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('Starting Render build process...');

try {
  // Install dependencies
  console.log('Installing dependencies...');
  execSync('pnpm install', { stdio: 'inherit' });

  // Build frontend
  console.log('Building frontend...');
  execSync('pnpm build', { stdio: 'inherit' });

  // Build backend
  console.log('Building backend...');
  execSync('pnpm build:server', { stdio: 'inherit' });

  console.log('Build process completed successfully!');
} catch (error) {
  console.error('Build process failed:', error.message);
  process.exit(1);
}