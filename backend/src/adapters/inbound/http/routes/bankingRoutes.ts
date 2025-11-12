import { Router, Request, Response } from 'express';
import { BankingRepository } from '../../../../core/ports/BankingRepository';
import { ComplianceRepository } from '../../../../core/ports/ComplianceRepository';

export function createBankingRoutes(
  bankingRepository: BankingRepository,
  complianceRepository: ComplianceRepository
): Router {
  const router = Router();

  // GET /banking/records?shipId&year
  router.get('/records', async (req: Request, res: Response) => {
    try {
      const shipId = req.query.shipId as string;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;

      if (!shipId || !year) {
        return res.status(400).json({ error: 'shipId and year are required' });
      }

      const record = await bankingRepository.getBankRecord(shipId, year);
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch bank records' });
    }
  });

  // POST /banking/bank
  router.post('/bank', async (req: Request, res: Response) => {
    try {
      const { shipId, year, cbAmount, description } = req.body;

      if (!shipId || !year || cbAmount === undefined) {
        return res.status(400).json({ error: 'shipId, year, and cbAmount are required' });
      }

      // Validate that CB is positive
      const compliance = await complianceRepository.findByShipAndYear(shipId, year);
      if (!compliance) {
        return res.status(404).json({ error: 'Compliance data not found' });
      }

      if (compliance.complianceBalance <= 0) {
        return res.status(400).json({ error: 'Can only bank positive compliance balance' });
      }

      if (cbAmount > compliance.complianceBalance) {
        return res.status(400).json({ error: 'Cannot bank more than available compliance balance' });
      }

      const entry = await bankingRepository.create({
        shipId,
        year,
        cbAmount,
        entryType: 'BANK',
        description,
      });

      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: 'Failed to bank compliance balance' });
    }
  });

  // POST /banking/apply
  router.post('/apply', async (req: Request, res: Response) => {
    try {
      const { shipId, year, cbAmount, description } = req.body;

      if (!shipId || !year || cbAmount === undefined) {
        return res.status(400).json({ error: 'shipId, year, and cbAmount are required' });
      }

      // Check available balance
      const record = await bankingRepository.getBankRecord(shipId, year);
      if (record.availableBalance < cbAmount) {
        return res.status(400).json({ 
          error: `Insufficient banked balance. Available: ${record.availableBalance}, Requested: ${cbAmount}` 
        });
      }

      const entry = await bankingRepository.create({
        shipId,
        year,
        cbAmount: -Math.abs(cbAmount), // Store as negative
        entryType: 'APPLY',
        description,
      });

      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: 'Failed to apply banked compliance balance' });
    }
  });

  return router;
}

