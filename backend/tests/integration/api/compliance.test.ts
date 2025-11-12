import request from 'supertest';
import express from 'express';
import dotenv from 'dotenv';
import { prisma } from '../../../src/infrastructure/db/prisma';
import { PrismaComplianceRepository } from '../../../src/adapters/outbound/postgres/PrismaComplianceRepository';
import { ComplianceService } from '../../../src/core/application/services/ComplianceService';
import { createComplianceRoutes } from '../../../src/adapters/inbound/http/routes/complianceRoutes';

// Load environment variables
dotenv.config();

describe('Compliance API - Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const complianceRepository = new PrismaComplianceRepository(prisma);
    const complianceService = new ComplianceService();
    app.use('/api/compliance', createComplianceRoutes(complianceRepository, complianceService));
  });

  beforeEach(async () => {
    // Clean up all compliance data
    await prisma.shipCompliance.deleteMany();

    // Create test compliance data
    await prisma.shipCompliance.create({
      data: {
        shipId: 'R001',
        year: 2025,
        targetIntensity: 89.3368,
        actualIntensity: 88.0,
        energyInScope: 205000000,
        complianceBalance: 274000000, // Positive (surplus)
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/compliance/cb', () => {
    it('should return compliance balance for ship and year', async () => {
      const response = await request(app)
        .get('/api/compliance/cb')
        .query({ shipId: 'R001', year: 2025 })
        .expect(200);

      expect(response.body).toHaveProperty('shipId', 'R001');
      expect(response.body).toHaveProperty('year', 2025);
      expect(response.body).toHaveProperty('complianceBalance');
      expect(response.body.complianceBalance).toBeGreaterThan(0);
    });

    it('should return 400 when shipId is missing', async () => {
      await request(app)
        .get('/api/compliance/cb')
        .query({ year: 2025 })
        .expect(400);
    });

    it('should return 400 when year is missing', async () => {
      await request(app)
        .get('/api/compliance/cb')
        .query({ shipId: 'R001' })
        .expect(400);
    });

    it('should return 404 when compliance data not found', async () => {
      await request(app)
        .get('/api/compliance/cb')
        .query({ shipId: 'INVALID', year: 2025 })
        .expect(404);
    });
  });

  describe('GET /api/compliance/adjusted-cb', () => {
    it('should return all compliance balances for a year', async () => {
      // Add another ship
      await prisma.shipCompliance.create({
        data: {
          shipId: 'R002',
          year: 2025,
          targetIntensity: 89.3368,
          actualIntensity: 91.0,
          energyInScope: 196800000,
          complianceBalance: -327200000, // Negative (deficit)
        },
      });

      const response = await request(app)
        .get('/api/compliance/adjusted-cb')
        .query({ year: 2025 })
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
    });

    it('should return 400 when year is missing', async () => {
      await request(app)
        .get('/api/compliance/adjusted-cb')
        .expect(400);
    });
  });
});

