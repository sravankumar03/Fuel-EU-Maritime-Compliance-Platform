import { PrismaClient } from '@prisma/client';
import { Pool, PoolMember } from '../../../core/domain/entities/Pool';
import { PoolRepository } from '../../../core/ports/PoolRepository';

export class PrismaPoolRepository implements PoolRepository {
  constructor(private prisma: PrismaClient) {}

  async create(pool: Omit<Pool, 'id' | 'createdAt' | 'members'>): Promise<Pool> {
    const created = await this.prisma.pool.create({
      data: {
        name: pool.name,
        year: pool.year,
      },
      include: { members: true },
    });

    return this.toDomain(created);
  }

  async addMembers(poolId: string, members: Omit<PoolMember, 'id' | 'poolId' | 'createdAt'>[]): Promise<PoolMember[]> {
    const created = await this.prisma.poolMember.createManyAndReturn({
      data: members.map(m => ({
        poolId,
        shipId: m.shipId,
        cbBefore: m.cbBefore,
        cbAfter: m.cbAfter,
      })),
    });

    return created.map(this.memberToDomain);
  }

  async findById(id: string): Promise<Pool | null> {
    const pool = await this.prisma.pool.findUnique({
      where: { id },
      include: { members: true },
    });

    return pool ? this.toDomain(pool) : null;
  }

  async findAllByYear(year: number): Promise<Pool[]> {
    const pools = await this.prisma.pool.findMany({
      where: { year },
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    });

    return pools.map(this.toDomain);
  }

  private toDomain(prismaPool: any): Pool {
    return {
      id: prismaPool.id,
      name: prismaPool.name || undefined,
      year: prismaPool.year,
      createdAt: prismaPool.createdAt,
      members: (prismaPool.members || []).map(this.memberToDomain),
    };
  }

  private memberToDomain(prismaMember: any): PoolMember {
    return {
      id: prismaMember.id,
      poolId: prismaMember.poolId,
      shipId: prismaMember.shipId,
      cbBefore: prismaMember.cbBefore,
      cbAfter: prismaMember.cbAfter,
      createdAt: prismaMember.createdAt,
    };
  }
}

