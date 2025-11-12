import { PrismaClient } from '@prisma/client';
import { ComplianceBalance } from '../../../core/domain/entities/Compliance';
import { ComplianceRepository } from '../../../core/ports/ComplianceRepository';

export class PrismaComplianceRepository implements ComplianceRepository {
  constructor(private prisma: PrismaClient) {}

  async findByShipAndYear(shipId: string, year: number): Promise<ComplianceBalance | null> {
    const compliance = await this.prisma.shipCompliance.findUnique({
      where: { shipId_year: { shipId, year } },
    });

    return compliance ? this.toDomain(compliance) : null;
  }

  async createOrUpdate(compliance: ComplianceBalance): Promise<ComplianceBalance> {
    const result = await this.prisma.shipCompliance.upsert({
      where: { shipId_year: { shipId: compliance.shipId, year: compliance.year } },
      update: {
        targetIntensity: compliance.targetIntensity,
        actualIntensity: compliance.actualIntensity,
        energyInScope: compliance.energyInScope,
        complianceBalance: compliance.complianceBalance,
      },
      create: {
        shipId: compliance.shipId,
        year: compliance.year,
        targetIntensity: compliance.targetIntensity,
        actualIntensity: compliance.actualIntensity,
        energyInScope: compliance.energyInScope,
        complianceBalance: compliance.complianceBalance,
      },
    });

    return this.toDomain(result);
  }

  async findAllByYear(year: number): Promise<ComplianceBalance[]> {
    const compliances = await this.prisma.shipCompliance.findMany({
      where: { year },
    });

    return compliances.map(this.toDomain);
  }

  private toDomain(prismaCompliance: any): ComplianceBalance {
    return {
      shipId: prismaCompliance.shipId,
      year: prismaCompliance.year,
      targetIntensity: prismaCompliance.targetIntensity,
      actualIntensity: prismaCompliance.actualIntensity,
      energyInScope: prismaCompliance.energyInScope,
      complianceBalance: prismaCompliance.complianceBalance,
    };
  }
}

