import { Pool, PoolMember, PoolCreationRequest } from '../domain/entities/Pool';

export interface PoolRepository {
  create(pool: Omit<Pool, 'id' | 'createdAt' | 'members'>): Promise<Pool>;
  addMembers(poolId: string, members: Omit<PoolMember, 'id' | 'poolId' | 'createdAt'>[]): Promise<PoolMember[]>;
  findById(id: string): Promise<Pool | null>;
  findAllByYear(year: number): Promise<Pool[]>;
}

