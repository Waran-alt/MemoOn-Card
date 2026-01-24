/**
 * Optimization Routes
 * 
 * Endpoints for FSRS weight optimization using the Python FSRS Optimizer
 */

import { Request, Response, Router } from 'express';
import { OptimizationService } from '../services/optimization.service';

const router = Router();
const optimizationService = new OptimizationService();

// Get user ID from request (placeholder - will add auth later)
const getUserId = (req: Request): string => {
  return (req.headers['x-user-id'] as string) || '00000000-0000-0000-0000-000000000000';
};

/**
 * GET /api/optimization/status
 * Check if optimization is available and if user can optimize
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const [optimizerStatus, canOptimize] = await Promise.all([
      optimizationService.checkOptimizerAvailable(),
      optimizationService.canOptimize(userId),
    ]);

    return res.json({
      success: true,
      data: {
        optimizerAvailable: optimizerStatus.available,
        optimizerMethod: optimizerStatus.method,
        ...canOptimize,
        installationHint: !optimizerStatus.available 
          ? 'Install with: pipx install fsrs-optimizer (recommended) or create a venv'
          : undefined,
      },
    });
  } catch (error) {
    console.error('Error checking optimization status:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/optimization/optimize
 * Run FSRS optimization for the user
 */
router.post('/optimize', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { timezone, dayStart, targetRetention } = req.body;

    // Check if optimizer is available
    const optimizerStatus = await optimizationService.checkOptimizerAvailable();
    if (!optimizerStatus.available) {
      return res.status(503).json({
        success: false,
        error: 'FSRS Optimizer is not available.',
        installationHint: 'Install with: pipx install fsrs-optimizer (recommended) or create a virtual environment',
      });
    }

    // Check if user has enough reviews
    const { canOptimize, reviewCount, minRequired } = await optimizationService.canOptimize(userId);
    if (!canOptimize) {
      return res.status(400).json({
        success: false,
        error: `Not enough reviews for optimization. Need ${minRequired}, have ${reviewCount}`,
        reviewCount,
        minRequired,
      });
    }

    // Run optimization
    const result = await optimizationService.optimizeWeights(userId, {
      timezone,
      dayStart,
      targetRetention,
    });

    if (result.success) {
      return res.json({
        success: true,
        data: {
          weights: result.weights,
          message: result.message,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || result.message,
      });
    }
  } catch (error) {
    console.error('Error optimizing weights:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/optimization/export
 * Export review logs as CSV for manual optimization
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { writeFile } = await import('fs/promises');
    const { join } = await import('path');
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const tempDir = join(process.cwd(), 'temp');
    const csvPath = join(tempDir, `revlog_${userId}_${Date.now()}.csv`);

    // Ensure temp directory exists
    await execAsync(`mkdir -p ${tempDir}`);

    // Export review logs
    await optimizationService.exportReviewLogsToCSV(userId, csvPath);

    // Send file as download
    return res.download(csvPath, `revlog_${userId}.csv`, async (err) => {
      // Cleanup after download
      await import('fs/promises').then(fs => fs.unlink(csvPath).catch(() => {}));
      if (err) {
        console.error('Error sending file:', err);
      }
    });
  } catch (error) {
    console.error('Error exporting review logs:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
