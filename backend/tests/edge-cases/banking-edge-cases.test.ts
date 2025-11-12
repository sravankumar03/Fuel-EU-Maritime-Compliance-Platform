import request from 'supertest';
import express from 'express';
import dotenv from 'dotenv';
import { prisma } from '../../src/infrastructure/db/prisma';
import { PrismaBankingRepository } from '../../src/adapters/outbound/postgres/PrismaBankingRepository';
import { PrismaComplianceRepository } from '../../src/adapters/outbound/postgres/PrismaComplianceRepository';
import { createBankingRoutes } from '../../src/adapters/inbound/http/routes/bankingRoutes';

// Load environment variables
dotenv.config();

describe('Banking - Edge Cases', () => {
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Negative CB Edge Cases', () => {
    it('should handle negative CB correctly', async () => {
      // Create compliance with negative CB (deficit)
      await prisma.shipCompliance.create({
        data: {
          shipId: 'R001',
          year: 2025,
          targetIntensity: 89.3368,
          actualIntensity: 91.0,
          energyInScope: 205000000,
          complianceBalance: -327200000, // Negative (deficit)
        },
      });

      // Should not be able to bank negative CB
      await request(app)
        .post('/api/banking/bank')
        .send({
          shipId: 'R001',
          year: 2025,
          cbAmount: 100000,
        })
        .expect(400);
    });

    it('should handle zero CB', async () => {
      // Use different shipId to avoid unique constraint violation
      await prisma.shipCompliance.create({
        data: {
          shipId: 'R002',
          year: 2025,
          targetIntensity: 89.3368,
          actualIntensity: 89.3368,
          energyInScope: 205000000,
          complianceBalance: 0,
        },
      });

      // Should not be able to bank zero CB
      await request(app)
        .post('/api/banking/bank')
        .send({
          shipId: 'R002',
          year: 2025,
          cbAmount: 100000,
        })
        .expect(400);
    });
  });

  describe('Over-apply Bank Edge Cases', () => {
    beforeEach(async () => {
      // Use upsert to avoid conflicts if record already exists
      await prisma.shipCompliance.upsert({
        where: { shipId_year: { shipId: 'R003', year: 2025 } },
        update: {
          targetIntensity: 89.3368,
          actualIntensity: 88.0,
          energyInScope: 205000000,
          complianceBalance: 274000000,
        },
        create: {
          shipId: 'R003',
          year: 2025,
          targetIntensity: 89.3368,
          actualIntensity: 88.0,
          energyInScope: 205000000,
          complianceBalance: 274000000,
        },
      });

      // Bank some CB
      await prisma.bankEntry.create({
        data: {
          shipId: 'R003',
          year: 2025,
          cbAmount: 100000,
          entryType: 'BANK',
        },
      });
    });

    it('should reject applying more than available balance', async () => {
      await request(app)
        .post('/api/banking/apply')
        .send({
          shipId: 'R003',
          year: 2025,
          cbAmount: 200000, // More than banked (100000)
        })
        .expect(400);
    });

    it('should reject applying exactly available balance + 1', async () => {
      await request(app)
        .post('/api/banking/apply')
        .send({
          shipId: 'R003',
          year: 2025,
          cbAmount: 100001, // One more than available
        })
        .expect(400);
    });

    it('should allow applying exactly available balance', async () => {
      await request(app)
        .post('/api/banking/apply')
        .send({
          shipId: 'R003',
          year: 2025,
          cbAmount: 100000, // Exactly available
        })
        .expect(201);
    });

    it('should handle multiple apply operations', async () => {
      // Apply first portion
      await request(app)
        .post('/api/banking/apply')
        .send({
          shipId: 'R003',
          year: 2025,
          cbAmount: 50000,
        })
        .expect(201);

      // Apply remaining
      await request(app)
        .post('/api/banking/apply')
        .send({
          shipId: 'R003',
          year: 2025,
          cbAmount: 50000,
        })
        .expect(201);

      // Should reject third apply
      await request(app)
        .post('/api/banking/apply')
        .send({
          shipId: 'R003',
          year: 2025,
          cbAmount: 1,
        })
        .expect(400);
    });
  });

  describe('Multiple Banking Operations', () => {
    beforeEach(async () => {
      await prisma.shipCompliance.create({
        data: {
          shipId: 'R001',
          year: 2025,
          targetIntensity: 89.3368,
          actualIntensity: 88.0,
          energyInScope: 205000000,
          complianceBalance: 274000000,
        },
      });
    });

    it('should track multiple bank operations correctly', async () => {
      // Bank multiple times
      await request(app)
        .post('/api/banking/bank')
        .send({
          shipId: 'R001',
          year: 2025,
          cbAmount: 50000,
        })
        .expect(201);

      await request(app)
        .post('/api/banking/bank')
        .send({
          shipId: 'R001',
          year: 2025,
          cbAmount: 30000,
        })
        .expect(201);

      const recordResponse = await request(app)
        .get('/api/banking/records')
        .query({ shipId: 'R001', year: 2025 })
        .expect(200);

      expect(recordResponse.body.totalBanked).toBe(80000);
      expect(recordResponse.body.availableBalance).toBe(80000);
    });
  });
});

