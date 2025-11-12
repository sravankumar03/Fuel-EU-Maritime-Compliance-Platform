// Test setup file
// This runs before all tests

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Set test environment variables
process.env.NODE_ENV = 'test';

// Use TEST_DATABASE_URL if provided, otherwise use DATABASE_URL from .env
// This allows tests to run against the main database if no test database is configured
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
// If neither is set, tests will fail with a clear error message

