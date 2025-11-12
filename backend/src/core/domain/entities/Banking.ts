export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  cbAmount: number;
  entryType: 'BANK' | 'APPLY';
  description?: string;
  createdAt: Date;
}

export interface BankRecord {
  shipId: string;
  year: number;
  totalBanked: number;
  totalApplied: number;
  availableBalance: number;
  entries: BankEntry[];
}

