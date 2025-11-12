import { ComplianceBalance } from '../domain/entities/Compliance';

export interface ComplianceRepository {
  findByShipAndYear(shipId: string, year: number): Promise<ComplianceBalance | null>;
  createOrUpdate(compliance: ComplianceBalance): Promise<ComplianceBalance>;
  findAllByYear(year: number): Promise<ComplianceBalance[]>;
}

