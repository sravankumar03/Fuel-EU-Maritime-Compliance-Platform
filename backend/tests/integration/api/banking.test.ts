import request from 'supertest';
import express from 'express';
import dotenv from 'dotenv';
import { prisma } from '../../../src/infrastructure/db/prisma';
import { PrismaBankingRepository } from '../../../src/adapters/outbound/postgres/PrismaBankingRepository';
import { PrismaComplianceRepository } from '../../../src/adapters/outbound/postgres/PrismaComplianceRepository';
import { createBankingRoutes } from '../../../src/adapters/inbound/http/routes/bankingRoutes';

// Load environment variables
dotenv.config();

describe('Banking API - Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const bankingRepository = new PrismaBankingRepository(prisma);
    const complianceRepository = new PrismaComplianceRepository(prisma);
    app.use('/api/banking', createBankingRoutes(bankingRepository, complianceRepository));
  });

  beforeEach(async () => {
    await prisma.bankEntry.deleteMany();
    await prisma.shipCompliance.deleteMany();

    // Create compliance with positive CB (surplus)
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

  describe('GET /api/banking/records', () => {
    it('should return bank record with zero balance initially', async () => {
      const response = await request(app)
        .get('/api/banking/records')
        .query({ shipId: 'R001', year: 2025 })
        .expect(200);

      expect(response.body).toHaveProperty('shipId', 'R001');
      expect(response.body).toHaveProperty('totalBanked', 0);
      expect(response.body).toHaveProperty('totalApplied', 0);
      expect(response.body).toHaveProperty('availableBalance', 0);
      expect(response.body).toHaveProperty('entries');
    });
  });

  describe('POST /api/banking/bank - BankSurplus', () => {
    it('should bank positive compliance balance', async () => {
      const response = await request(app)
        .post('/api/banking/bank')
        .send({
          shipId: 'R001',
          year: 2025,
          cbAmount: 100000,
          description: 'Test banking',
        })
        .expect(201);

      expect(response.body).toHaveProperty('entryType', 'BANK');
      expect(response.body).toHaveProperty('cbAmount', 100000);
      expect(response.body).toHaveProperty('shipId', 'R001');

      // Verify bank record
      const recordResponse = await request(app)
        .get('/api/banking/records')
        .query({ shipId: 'R001', year: 2025 })
        .expect(200);

      expect(recordResponse.body.totalBanked).toBe(100000);
      expect(recordResponse.body.availableBalance).toBe(100000);
    });

    it('should reject banking negative CB', async () => {
      // Create compliance with negative CB
      await prisma.shipCompliance.update({
        where: { shipId_year: { shipId: 'R001', year: 2025 } },
        data: { complianceBalance: -100000 },
      });

      await request(app)
        .post('/api/banking/bank')
        .send({
          shipId: 'R001',
          year: 2025,
          cbAmount: 50000,
        })
        .expect(400);
    });

    it('should reject banking more than available CB', async () => {
      await request(app)
        .post('/api/banking/bank')
        .send({
          shipId: 'R001',
          year: 2025,
          cbAmount: 1000000000, // More than available
        })
        .expect(400);
    });

    it('should return 404 when compliance data not found', async () => {
      await request(app)
        .post('/api/banking/bank')
        .send({
          shipId: 'INVALID',
          year: 2025,
          cbAmount: 100000,
        })
        .expect(404);
    });
  });

  describe('POST /api/banking/apply - ApplyBanked', () => {
    beforeEach(async () => {
      // Bank some CB first
      await prisma.bankEntry.create({
        data: {
          shipId: 'R001',
          year: 2025,
          cbAmount: 200000,
          entryType: 'BANK',
        },
      });
    });

    it('should apply banked balance', async () => {
      const response = await request(app)
        .post('/api/banking/apply')
        .send({
          shipId: 'R001',
          year: 2025,
          cbAmount: 100000,
          description: 'Test apply',
        })
        .expect(201);

      expect(response.body).toHaveProperty('entryType', 'APPLY');
      expect(response.body).toHaveProperty('cbAmount');
      expect(Math.abs(response.body.cbAmount)).toBe(100000);

      // Verify bank record
      const recordResponse = await request(app)
        .get('/api/banking/records')
        .query({ shipId: 'R001', year: 2025 })
        .expect(200);

      expect(recordResponse.body.totalBanked).toBe(200000);
      expect(recordResponse.body.totalApplied).toBe(100000);
      expect(recordResponse.body.availableBalance).toBe(100000);
    });

    it('should reject applying more than available balance', async () => {
      await request(app)
        .post('/api/banking/apply')
        .send({
          shipId: 'R001',
          year: 2025,
          cbAmount: 300000, // More than banked (200000)
        })
        .expect(400);
    });

    it('should handle edge case: apply all available balance', async () => {
      await request(app)
        .post('/api/banking/apply')
        .send({
          shipId: 'R001',
          year: 2025,
          cbAmount: 200000, // All available
        })
        .expect(201);

      const recordResponse = await request(app)
        .get('/api/banking/records')
        .query({ shipId: 'R001', year: 2025 })
        .expect(200);

      expect(recordResponse.body.availableBalance).toBe(0);
    });
  });
});

