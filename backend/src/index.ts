import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createFSRS } from './services/fsrs.service';
import { testConnection } from './config/database';
import decksRoutes from './routes/decks.routes';
import cardsRoutes from './routes/cards.routes';
import reviewsRoutes from './routes/reviews.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3002',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  const dbConnected = await testConnection();
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'memoon-card-backend',
    database: dbConnected ? 'connected' : 'disconnected',
  });
});

// Test FSRS endpoint
app.get('/api/test-fsrs', (_req: Request, res: Response) => {
  try {
    const fsrs = createFSRS();
    
    // Test new card
    const result = fsrs.reviewCard(null, 3); // Good rating
    
    return res.json({
      success: true,
      test: 'new-card',
      result: {
        stability: result.state.stability,
        difficulty: result.state.difficulty,
        nextReview: result.state.nextReview,
        message: result.message,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// API Routes
app.use('/api/decks', decksRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/reviews', reviewsRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
async function startServer() {
  // Test database connection
  await testConnection();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🧪 Test FSRS: http://localhost:${PORT}/api/test-fsrs`);
    console.log(`📚 API Routes:`);
    console.log(`   - GET    /api/decks`);
    console.log(`   - POST   /api/decks`);
    console.log(`   - GET    /api/decks/:id`);
    console.log(`   - PUT    /api/decks/:id`);
    console.log(`   - DELETE /api/decks/:id`);
    console.log(`   - GET    /api/decks/:id/stats`);
    console.log(`   - GET    /api/decks/:deckId/cards`);
    console.log(`   - POST   /api/decks/:deckId/cards`);
    console.log(`   - GET    /api/cards/:id`);
    console.log(`   - PUT    /api/cards/:id`);
    console.log(`   - DELETE /api/cards/:id`);
    console.log(`   - POST   /api/cards/:id/review`);
    console.log(`   - POST   /api/reviews/batch`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
