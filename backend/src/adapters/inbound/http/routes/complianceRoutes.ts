import { Router, Request, Response } from 'express';
import { ComplianceRepository } from '../../../../core/ports/ComplianceRepository';
import { ComplianceService } from '../../../../core/application/services/ComplianceService';

export function createComplianceRoutes(
  complianceRepository: ComplianceRepository,
  complianceService: ComplianceService
): Router {
  const router = Router();

  // GET /compliance/cb?shipId&year
  router.get('/cb', async (req: Request, res: Response) => {
    try {
      const shipId = req.query.shipId as string;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;

      if (!shipId || !year) {
        return res.status(400).json({ error: 'shipId and year are required' });
      }

      const compliance = await complianceRepository.findByShipAndYear(shipId, year);
      if (!compliance) {
        return res.status(404).json({ error: 'Compliance data not found' });
      }

      res.json(compliance);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch compliance balance' });
    }
  });

  // GET /compliance/adjusted-cb?year
  router.get('/adjusted-cb', async (req: Request, res: Response) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;

      if (!year) {
        return res.status(400).json({ error: 'year is required' });
      }

      const compliances = await complianceRepository.findAllByYear(year);
      res.json(compliances);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch adjusted compliance balances' });
    }
  });

  return router;
}

