import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

const seedData = [
  { 
    routeId: "R001", 
    vesselType: "Container", 
    fuelType: "HFO", 
    year: 2024, 
    ghgIntensity: 91.0, 
    fuelConsumption: 5000, 
    distance: 12000, 
    totalEmissions: 4500 
  },
  { 
    routeId: "R002", 
    vesselType: "BulkCarrier", 
    fuelType: "LNG", 
    year: 2024, 
    ghgIntensity: 88.0, 
    fuelConsumption: 4800, 
    distance: 11500, 
    totalEmissions: 4200 
  },
  { 
    routeId: "R003", 
    vesselType: "Tanker", 
    fuelType: "MGO", 
    year: 2024, 
    ghgIntensity: 93.5, 
    fuelConsumption: 5100, 
    distance: 12500, 
    totalEmissions: 4700 
  },
  { 
    routeId: "R004", 
    vesselType: "RoRo", 
    fuelType: "HFO", 
    year: 2025, 
    ghgIntensity: 89.2, 
    fuelConsumption: 4900, 
    distance: 11800, 
    totalEmissions: 4300 
  },
  { 
    routeId: "R005", 
    vesselType: "Container", 
    fuelType: "LNG", 
    year: 2025, 
    ghgIntensity: 90.5, 
    fuelConsumption: 4950, 
    distance: 11900, 
    totalEmissions: 4400 
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (if tables exist)
  try {
    await prisma.poolMember.deleteMany();
    await prisma.pool.deleteMany();
    await prisma.bankEntry.deleteMany();
    await prisma.shipCompliance.deleteMany();
    await prisma.route.deleteMany();
  } catch (error: any) {
    // If tables don't exist, that's okay - migrations haven't been run yet
    if (error.code === 'P2021') {
      console.error('❌ Database tables do not exist. Please run migrations first:');
      console.error('   npm run prisma:migrate');
      throw new Error('Database schema not found. Run migrations first.');
    }
    throw error;
  }

  // Seed routes
  for (const route of seedData) {
    await prisma.route.create({
      data: {
        routeId: route.routeId,
        vesselType: route.vesselType,
        fuelType: route.fuelType,
        year: route.year,
        ghgIntensity: route.ghgIntensity,
        fuelConsumption: route.fuelConsumption,
        distance: route.distance,
        totalEmissions: route.totalEmissions,
        isBaseline: false,
      },
    });
  }

  // Create sample compliance data for ships (using routeId as shipId for demo)
  const targetIntensity = 89.3368;
  for (const route of seedData) {
    const energyInScope = route.fuelConsumption * 41000;
    const complianceBalance = (targetIntensity - route.ghgIntensity) * energyInScope;

    await prisma.shipCompliance.create({
      data: {
        shipId: route.routeId,
        year: route.year,
        targetIntensity,
        actualIntensity: route.ghgIntensity,
        energyInScope,
        complianceBalance,
      },
    });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

