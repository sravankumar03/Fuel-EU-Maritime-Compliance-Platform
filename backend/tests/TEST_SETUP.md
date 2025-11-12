# Test Setup Guide

## Database Configuration

Tests require a PostgreSQL database connection. There are two options:

### Option 1: Use Main Database (Recommended for Development)

Tests will use the same database as your development environment. Make sure your `backend/.env` file has:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/fueleu_maritime?schema=public"
```

**Note:** Tests will clean up data between runs, but be cautious if you have important data.

### Option 2: Use Separate Test Database (Recommended for CI/CD)

Create a separate test database:

```sql
CREATE DATABASE fueleu_maritime_test;
```

Set the test database URL:

**Windows (PowerShell):**
```powershell
$env:TEST_DATABASE_URL="postgresql://username:password@localhost:5432/fueleu_maritime_test?schema=public"
npm test
```

**Linux/Mac:**
```bash
export TEST_DATABASE_URL="postgresql://username:password@localhost:5432/fueleu_maritime_test?schema=public"
npm test
```

Or create a `.env.test` file in the `backend` directory (not tracked by git).

## Running Tests

### First Time Setup

1. **Ensure database is set up:**
   ```bash
   cd backend
   npm run prisma:generate
   npm run prisma:migrate
   ```

2. **Verify database connection:**
   - Check that `backend/.env` has correct `DATABASE_URL`
   - Test connection: `npm run dev` (should start without errors)

3. **Run tests:**
   ```bash
   npm test
   ```

### Test Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests only (no database needed)
npm run test:integration   # Integration tests (requires database)
npm run test:edge-cases    # Edge case tests (requires database)
npm run test:data          # Data/migration tests (requires database)

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Troubleshooting

### Error: "Authentication failed against database server"

**Solution:** Check your `DATABASE_URL` in `backend/.env`:
- Verify username and password are correct
- Ensure database exists
- Check PostgreSQL is running

### Error: "Table does not exist"

**Solution:** Run migrations:
```bash
npm run prisma:migrate
```

### Error: "Cannot find module 'dotenv'"

**Solution:** Install dependencies:
```bash
npm install
```

### Tests Failing Due to Data Conflicts

**Solution:** Tests clean up data automatically, but if you see conflicts:
1. Manually clean the database
2. Or use a separate test database (Option 2 above)

## Test Structure

- **Unit Tests** (`tests/unit/`): No database required, test business logic only
- **Integration Tests** (`tests/integration/`): Require database, test API endpoints
- **Edge Cases** (`tests/edge-cases/`): Require database, test validation and error scenarios
- **Data Tests** (`tests/data/`): Require database, test migrations and schema

## Best Practices

1. **Development:** Use main database with automatic cleanup
2. **CI/CD:** Use separate test database
3. **Before committing:** Run all tests to ensure nothing breaks
4. **Coverage:** Aim for >80% coverage on business logic

