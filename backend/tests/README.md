# Test Suite Documentation

## Overview

This test suite provides comprehensive coverage for the Fuel EU Maritime Compliance Platform, including unit tests, integration tests, and edge case validation.

## Test Structure

```
tests/
├── unit/                    # Unit tests for business logic
│   └── services/           # Service layer tests
├── integration/            # Integration tests
│   └── api/               # HTTP endpoint tests
├── edge-cases/            # Edge case and boundary tests
├── helpers/               # Test utilities and helpers
├── setup.ts              # Test configuration
└── README.md             # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Edge cases only
npm run test:edge-cases
```

## Test Categories

### Unit Tests

#### RouteService Tests (`tests/unit/services/RouteService.test.ts`)
- ✅ `calculatePercentDiff` - Percentage difference calculation
- ✅ `isCompliant` - Compliance checking logic
- ✅ `compareRoutes` - Route comparison functionality

#### ComplianceService Tests (`tests/unit/services/ComplianceService.test.ts`)
- ✅ `calculateEnergyInScope` - Energy calculation (fuelConsumption × 41,000)
- ✅ `calculateComplianceBalance` - CB calculation (Target - Actual) × EnergyInScope
- ✅ Edge cases: zero values, very large numbers

#### PoolService Tests (`tests/unit/services/PoolService.test.ts`)
- ✅ Pool validation rules:
  - Sum(adjustedCB) ≥ 0
  - Deficit ship cannot exit worse
  - Surplus ship cannot go negative
- ✅ Multiple validation error handling

### Integration Tests

#### Routes API (`tests/integration/api/routes.test.ts`)
- ✅ GET /api/routes - List routes with filters
- ✅ POST /api/routes/:id/baseline - Set baseline route
- ✅ GET /api/routes/comparison - Compare routes

#### Compliance API (`tests/integration/api/compliance.test.ts`)
- ✅ GET /api/compliance/cb - Get compliance balance
- ✅ GET /api/compliance/adjusted-cb - Get all compliance balances

#### Banking API (`tests/integration/api/banking.test.ts`)
- ✅ GET /api/banking/records - Get bank records
- ✅ POST /api/banking/bank - Bank surplus CB
- ✅ POST /api/banking/apply - Apply banked CB

#### Pools API (`tests/integration/api/pools.test.ts`)
- ✅ POST /api/pools - Create pool with validation
- ✅ GET /api/pools - List pools by year

### Edge Cases

#### Banking Edge Cases (`tests/edge-cases/banking-edge-cases.test.ts`)
- ✅ Negative CB handling
- ✅ Zero CB handling
- ✅ Over-apply bank (apply more than available)
- ✅ Multiple banking operations
- ✅ Multiple apply operations

#### Pooling Edge Cases (`tests/edge-cases/pooling-edge-cases.test.ts`)
- ✅ Invalid pool: negative sum
- ✅ Invalid pool: deficit ship exits worse
- ✅ Invalid pool: surplus ship goes negative
- ✅ Multiple validation errors
- ✅ Zero values
- ✅ Large values
- ✅ Single ship pool

## Test Data

Tests use a separate test database (configured via `TEST_DATABASE_URL` environment variable). Each test suite cleans up data before and after execution.

## Coverage Goals

- **Unit Tests**: 100% coverage of business logic (services)
- **Integration Tests**: All API endpoints covered
- **Edge Cases**: All validation rules and error scenarios

## Writing New Tests

### Unit Test Example
```typescript
import { RouteService } from '../../../src/core/application/services/RouteService';

describe('RouteService', () => {
  let routeService: RouteService;

  beforeEach(() => {
    routeService = new RouteService();
  });

  it('should calculate percentage difference', () => {
    const result = routeService.calculatePercentDiff(89.0, 91.0);
    expect(result).toBeCloseTo(2.247, 2);
  });
});
```

### Integration Test Example
```typescript
import request from 'supertest';
import express from 'express';

describe('API Endpoint', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    // Setup routes
  });

  it('should return 200', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

## Notes

- Tests use `supertest` for HTTP endpoint testing
- Database is cleaned between test suites
- All tests run in isolated environments
- Coverage reports are generated in `coverage/` directory

