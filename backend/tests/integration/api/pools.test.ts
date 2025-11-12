import request from 'supertest';
import express from 'express';
import dotenv from 'dotenv';
import { prisma } from '../../../src/infrastructure/db/prisma';
import { PrismaPoolRepository } from '../../../src/adapters/outbound/postgres/PrismaPoolRepository';
import { PrismaComplianceRepository } from '../../../src/adapters/outbound/postgres/PrismaComplianceRepository';
import { PoolService } from '../../../src/core/application/services/PoolService';
import { createPoolRoutes } from '../../../src/adapters/inbound/http/routes/poolRoutes';

// Load environment variables
dotenv.config();

describe('Pools API - Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const poolRepository = new PrismaPoolRepository(prisma);
    const complianceRepository = new PrismaComplianceRepository(prisma);
    const poolService = new PoolService();
    app.use('/api/pools', createPoolRoutes(poolRepository, complianceRepository, poolService));
  });

  beforeEach(async () => {
    await prisma.poolMember.deleteMany();
    await prisma.pool.deleteMany();
    await prisma.shipCompliance.deleteMany();

    // Create test compliance data
    await prisma.shipCompliance.createMany({
      data: [
        {
          shipId: 'R001',
          year: 2025,
          targetIntensity: 89.3368,
          actualIntensity: 88.0,
          energyInScope: 205000000,
          complianceBalance: 274000000, // Positive (surplus)
        },
        {
          shipId: 'R002',
          year: 2025,
          targetIntensity: 89.3368,
          actualIntensity: 91.0,
          energyInScope: 196800000,
          complianceBalance: -327200000, // Negative (deficit)
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/pools - CreatePool', () => {
    it('should create a valid pool', async () => {
      const response = await request(app)
        .post('/api/pools')
        .send({
          name: 'Test Pool 2025',
          year: 2025,
          members: [
            { shipId: 'R001', adjustedCB: 200000 },
            { shipId: 'R002', adjustedCB: -150000 },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test Pool 2025');
      expect(response.body).toHaveProperty('year', 2025);
      expect(response.body).toHaveProperty('members');
      expect(response.body.members).toHaveLength(2);
      expect(response.body).toHaveProperty('cbBefore');
      expect(response.body).toHaveProperty('cbAfter');
    });

    it('should reject pool with negative sum', async () => {
      const response = await request(app)
        .post('/api/pools')
        .send({
          year: 2025,
          members: [
            { shipId: 'R001', adjustedCB: 100000 },
            { shipId: 'R002', adjustedCB: -200000 }, // Sum = -100000
          ],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Pool validation failed');
    });

    it('should reject if deficit ship exits worse', async () => {
      const response = await request(app)
        .post('/api/pools')
        .send({
          year: 2025,
          members: [
            { shipId: 'R002', adjustedCB: -400000 }, // Was -327200000, now worse
          ],
        })
        .expect(400);

      expect(response.body).toHaveProperty('details');
      expect(response.body.details.some((d: string) => d.includes('Deficit ship cannot exit worse'))).toBe(true);
    });

    it('should reject if surplus ship goes negative', async () => {
      const response = await request(app)
        .post('/api/pools')
        .send({
          year: 2025,
          members: [
            { shipId: 'R001', adjustedCB: -100000 }, // Was +274000000, now negative
          ],
        })
        .expect(400);

      expect(response.body).toHaveProperty('details');
      expect(response.body.details.some((d: string) => d.includes('Surplus ship cannot go negative'))).toBe(true);
    });

    it('should return 404 when compliance data not found', async () => {
      await request(app)
        .post('/api/pools')
        .send({
          year: 2025,
          members: [
            { shipId: 'INVALID', adjustedCB: 100000 },
          ],
        })
        .expect(404);
    });

    it('should return 400 when members array is empty', async () => {
      await request(app)
        .post('/api/pools')
        .send({
          year: 2025,
          members: [],
        })
        .expect(400);
    });
  });

  describe('GET /api/pools', () => {
    beforeEach(async () => {
      // Ensure compliance data exists (created in outer beforeEach)
      // Create a test pool
      const pool = await prisma.pool.create({
        data: {
          name: 'Test Pool',
          year: 2025,
        },
      });

      // Verify pool was created
      expect(pool).toBeDefined();
      expect(pool.id).toBeDefined();

      // Create members with the pool ID
      const members = await prisma.poolMember.createMany({
        data: [
          {
            poolId: pool.id,
            shipId: 'R001',
            cbBefore: 274000000,
            cbAfter: 200000,
          },
        ],
      });

      expect(members.count).toBe(1);
    });

    it('should return pools for a year', async () => {
      // Verify pool exists before querying
      const poolsBefore = await prisma.pool.findMany({ where: { year: 2025 } });
      expect(poolsBefore.length).toBeGreaterThan(0);

      const response = await request(app)
        .get('/api/pools')
        .query({ year: 2025 })
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      
      // Find the pool we created
      const testPool = response.body.find((p: any) => p.name === 'Test Pool');
      expect(testPool).toBeDefined();
      expect(testPool).toHaveProperty('members');
      expect(testPool.members.length).toBeGreaterThan(0);
    });

    it('should return 400 when year is missing', async () => {
      await request(app)
        .get('/api/pools')
        .expect(400);
    });
  });
});

