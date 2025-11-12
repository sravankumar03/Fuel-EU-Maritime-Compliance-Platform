import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from '../db/prisma';
import { PrismaRouteRepository } from '../../adapters/outbound/postgres/PrismaRouteRepository';
import { PrismaComplianceRepository } from '../../adapters/outbound/postgres/PrismaComplianceRepository';
import { PrismaBankingRepository } from '../../adapters/outbound/postgres/PrismaBankingRepository';
import { PrismaPoolRepository } from '../../adapters/outbound/postgres/PrismaPoolRepository';
import { RouteService } from '../../core/application/services/RouteService';
import { ComplianceService } from '../../core/application/services/ComplianceService';
import { PoolService } from '../../core/application/services/PoolService';
import { createRouteRoutes } from '../../adapters/inbound/http/routes/routeRoutes';
import { createComplianceRoutes } from '../../adapters/inbound/http/routes/complianceRoutes';
import { createBankingRoutes } from '../../adapters/inbound/http/routes/bankingRoutes';
import { createPoolRoutes } from '../../adapters/inbound/http/routes/poolRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize repositories
const routeRepository = new PrismaRouteRepository(prisma);
const complianceRepository = new PrismaComplianceRepository(prisma);
const bankingRepository = new PrismaBankingRepository(prisma);
const poolRepository = new PrismaPoolRepository(prisma);

// Initialize services
const routeService = new RouteService();
const complianceService = new ComplianceService();
const poolService = new PoolService();

// Register routes
app.use('/api/routes', createRouteRoutes(routeRepository, routeService));
app.use('/api/compliance', createComplianceRoutes(complianceRepository, complianceService));
app.use('/api/banking', createBankingRoutes(bankingRepository, complianceRepository));
app.use('/api/pools', createPoolRoutes(poolRepository, complianceRepository, poolService));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Fuel EU Maritime Compliance API',
    version: '1.0.0',
    endpoints: {
      routes: {
        'GET /api/routes': 'Get all routes (filters: vesselType, fuelType, year)',
        'POST /api/routes/:id/baseline': 'Set a route as baseline',
        'GET /api/routes/comparison': 'Compare routes against baseline',
      },
      compliance: {
        'GET /api/compliance/cb': 'Get compliance balance (query: shipId, year)',
        'GET /api/compliance/adjusted-cb': 'Get all compliance balances (query: year)',
      },
      banking: {
        'GET /api/banking/records': 'Get bank records (query: shipId, year)',
        'POST /api/banking/bank': 'Bank positive compliance balance',
        'POST /api/banking/apply': 'Apply banked balance to cover deficit',
      },
      pooling: {
        'GET /api/pools': 'Get all pools (query: year)',
        'POST /api/pools': 'Create a new pool',
      },
      health: {
        'GET /health': 'Health check endpoint',
      },
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚢 Fuel EU Maritime API running on http://localhost:${PORT}`);
});

