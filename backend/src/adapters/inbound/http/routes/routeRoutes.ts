import { Router, Request, Response } from 'express';
import { RouteRepository } from '../../../../core/ports/RouteRepository';
import { RouteService } from '../../../../core/application/services/RouteService';

export function createRouteRoutes(
  routeRepository: RouteRepository,
  routeService: RouteService
): Router {
  const router = Router();

  // GET /routes
  router.get('/', async (req: Request, res: Response) => {
    try {
      const filters = {
        vesselType: req.query.vesselType as string | undefined,
        fuelType: req.query.fuelType as string | undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
      };

      const routes = await routeRepository.findAll(filters);
      res.json(routes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch routes' });
    }
  });

  // POST /routes/:id/baseline
  router.post('/:id/baseline', async (req: Request, res: Response) => {
    try {
      const routeId = req.params.id;
      const route = await routeRepository.setBaseline(routeId);
      res.json(route);
    } catch (error: any) {
      res.status(404).json({ error: error.message || 'Route not found' });
    }
  });

  // GET /routes/comparison
  router.get('/comparison', async (req: Request, res: Response) => {
    try {
      const baseline = await routeRepository.findBaseline();
      if (!baseline) {
        return res.status(404).json({ error: 'No baseline route set' });
      }

      const filters = {
        vesselType: req.query.vesselType as string | undefined,
        fuelType: req.query.fuelType as string | undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
      };

      const routes = await routeRepository.findAll(filters);
      const comparisons = routeService.compareRoutes(baseline, routes);

      res.json({
        baseline: {
          routeId: baseline.routeId,
          ghgIntensity: baseline.ghgIntensity,
        },
        comparisons,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to compare routes' });
    }
  });

  return router;
}

