#!/usr/bin/env node
// One-off script to reset the public schema in the development database.
// WARNING: This will DROP all tables in the database. Use only in development.

import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.VITE_DB_USER}:${process.env.VITE_DB_PASSWORD}@${process.env.VITE_DB_HOST}:${process.env.VITE_DB_PORT}/${process.env.VITE_DB_NAME}`;

const pool = new Pool({ connectionString });

async function reset() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    try {
      console.log('Dropping and recreating public schema...');
      await client.query('DROP SCHEMA public CASCADE');
      await client.query('CREATE SCHEMA public');
      console.log('Schema reset complete.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to reset schema:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

reset();
