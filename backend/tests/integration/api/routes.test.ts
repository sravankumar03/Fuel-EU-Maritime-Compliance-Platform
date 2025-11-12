import request from 'supertest';
import express from 'express';
import dotenv from 'dotenv';
import { prisma } from '../../../src/infrastructure/db/prisma';
import { PrismaRouteRepository } from '../../../src/adapters/outbound/postgres/PrismaRouteRepository';
import { RouteService } from '../../../src/core/application/services/RouteService';
import { createRouteRoutes } from '../../../src/adapters/inbound/http/routes/routeRoutes';

// Load environment variables
dotenv.config();

describe('Routes API - Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const routeRepository = new PrismaRouteRepository(prisma);
    const routeService = new RouteService();
    app.use('/api/routes', createRouteRoutes(routeRepository, routeService));
  });

  beforeEach(async () => {
    // Clear and seed test data
    await prisma.poolMember.deleteMany();
    await prisma.pool.deleteMany();
    await prisma.bankEntry.deleteMany();
    await prisma.shipCompliance.deleteMany();
    await prisma.route.deleteMany();

    // Create test routes
    await prisma.route.createMany({
      data: [
        {
          routeId: 'R001',
          vesselType: 'Container',
          fuelType: 'HFO',
          year: 2025,
          ghgIntensity: 89.0,
          fuelConsumption: 5000,
          distance: 12000,
          totalEmissions: 4500,
          isBaseline: false,
        },
        {
          routeId: 'R002',
          vesselType: 'BulkCarrier',
          fuelType: 'LNG',
          year: 2025,
          ghgIntensity: 91.0,
          fuelConsumption: 4800,
          distance: 11500,
          totalEmissions: 4200,
          isBaseline: false,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/routes', () => {
    it('should return all routes', async () => {
      const response = await request(app)
        .get('/api/routes')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('routeId');
      expect(response.body[0]).toHaveProperty('ghgIntensity');
    });

    it('should filter by vesselType', async () => {
      const response = await request(app)
        .get('/api/routes')
        .query({ vesselType: 'Container' })
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].vesselType).toBe('Container');
    });

    it('should filter by fuelType', async () => {
      const response = await request(app)
        .get('/api/routes')
        .query({ fuelType: 'LNG' })
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].fuelType).toBe('LNG');
    });

    it('should filter by year', async () => {
      const response = await request(app)
        .get('/api/routes')
        .query({ year: 2025 })
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body.every((r: any) => r.year === 2025)).toBe(true);
    });
  });

  describe('POST /api/routes/:id/baseline', () => {
    it('should set a route as baseline', async () => {
      const response = await request(app)
        .post('/api/routes/R001/baseline')
        .expect(200);

      expect(response.body.isBaseline).toBe(true);
      expect(response.body.routeId).toBe('R001');

      // Verify only one baseline exists
      const baseline = await prisma.route.findFirst({ where: { isBaseline: true } });
      expect(baseline?.routeId).toBe('R001');
    });

    it('should return 404 for non-existent route', async () => {
      await request(app)
        .post('/api/routes/INVALID/baseline')
        .expect(404);
    });
  });

  describe('GET /api/routes/comparison', () => {
    it('should return 404 when no baseline is set', async () => {
      await request(app)
        .get('/api/routes/comparison')
        .expect(404);
    });

    it('should compare routes against baseline', async () => {
      // Set baseline first
      await prisma.route.update({
        where: { routeId: 'R001' },
        data: { isBaseline: true },
      });

      const response = await request(app)
        .get('/api/routes/comparison')
        .expect(200);

      expect(response.body).toHaveProperty('baseline');
      expect(response.body).toHaveProperty('comparisons');
      expect(response.body.comparisons).toBeInstanceOf(Array);
      expect(response.body.comparisons.length).toBe(1); // R002 (excluding baseline)
      
      const comparison = response.body.comparisons[0];
      expect(comparison).toHaveProperty('routeId');
      expect(comparison).toHaveProperty('percentDiff');
      expect(comparison).toHaveProperty('compliant');
    });
  });
});

