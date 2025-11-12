import { Router, Request, Response } from 'express';
import { PoolRepository } from '../../../../core/ports/PoolRepository';
import { ComplianceRepository } from '../../../../core/ports/ComplianceRepository';
import { PoolService } from '../../../../core/application/services/PoolService';

export function createPoolRoutes(
  poolRepository: PoolRepository,
  complianceRepository: ComplianceRepository,
  poolService: PoolService
): Router {
  const router = Router();

  // POST /pools
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { name, year, members } = req.body;

      if (!year || !members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: 'year and members array are required' });
      }

      // Get CB before for all ships
      const cbBefore: Record<string, number> = {};
      for (const member of members) {
        const compliance = await complianceRepository.findByShipAndYear(member.shipId, year);
        if (!compliance) {
          return res.status(404).json({ 
            error: `Compliance data not found for ship ${member.shipId}` 
          });
        }
        cbBefore[member.shipId] = compliance.complianceBalance;
      }

      // Validate pool rules
      const validation = poolService.validatePool({ name, year, members }, cbBefore);
      
      if (!validation.valid) {
        return res.status(400).json({ 
          error: 'Pool validation failed',
          details: validation.errors,
        });
      }

      // Create pool
      const pool = await poolRepository.create({ name, year });

      // Add members with cb_before and cb_after
      const poolMembers = await poolRepository.addMembers(
        pool.id,
        members.map(m => ({
          shipId: m.shipId,
          cbBefore: cbBefore[m.shipId],
          cbAfter: m.adjustedCB,
        }))
      );

      res.status(201).json({
        ...pool,
        members: poolMembers,
        cbBefore: validation.cbBefore,
        cbAfter: validation.cbAfter,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create pool' });
    }
  });

  // GET /pools?year
  router.get('/', async (req: Request, res: Response) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;

      if (!year) {
        return res.status(400).json({ error: 'year is required' });
      }

      const pools = await poolRepository.findAllByYear(year);
      res.json(pools);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch pools' });
    }
  });

  return router;
}

