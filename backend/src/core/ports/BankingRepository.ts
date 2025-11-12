import { BankEntry, BankRecord } from '../domain/entities/Banking';

export interface BankingRepository {
  create(entry: Omit<BankEntry, 'id' | 'createdAt'>): Promise<BankEntry>;
  findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]>;
  getBankRecord(shipId: string, year: number): Promise<BankRecord>;
}

