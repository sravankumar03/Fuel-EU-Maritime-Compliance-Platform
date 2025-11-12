import { PrismaClient } from '@prisma/client';
import { BankEntry, BankRecord } from '../../../core/domain/entities/Banking';
import { BankingRepository } from '../../../core/ports/BankingRepository';

export class PrismaBankingRepository implements BankingRepository {
  constructor(private prisma: PrismaClient) {}

  async create(entry: Omit<BankEntry, 'id' | 'createdAt'>): Promise<BankEntry> {
    const created = await this.prisma.bankEntry.create({
      data: {
        shipId: entry.shipId,
        year: entry.year,
        cbAmount: entry.cbAmount,
        entryType: entry.entryType,
        description: entry.description,
      },
    });

    return this.toDomain(created);
  }

  async findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]> {
    const entries = await this.prisma.bankEntry.findMany({
      where: { shipId, year },
      orderBy: { createdAt: 'desc' },
    });

    return entries.map(this.toDomain);
  }

  async getBankRecord(shipId: string, year: number): Promise<BankRecord> {
    const entries = await this.findByShipAndYear(shipId, year);

    const totalBanked = entries
      .filter(e => e.entryType === 'BANK')
      .reduce((sum, e) => sum + e.cbAmount, 0);

    const totalApplied = entries
      .filter(e => e.entryType === 'APPLY')
      .reduce((sum, e) => sum + Math.abs(e.cbAmount), 0);

    const availableBalance = totalBanked - totalApplied;

    return {
      shipId,
      year,
      totalBanked,
      totalApplied,
      availableBalance,
      entries,
    };
  }

  private toDomain(prismaEntry: any): BankEntry {
    return {
      id: prismaEntry.id,
      shipId: prismaEntry.shipId,
      year: prismaEntry.year,
      cbAmount: prismaEntry.cbAmount,
      entryType: prismaEntry.entryType as 'BANK' | 'APPLY',
      description: prismaEntry.description || undefined,
      createdAt: prismaEntry.createdAt,
    };
  }
}

