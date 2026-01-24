# Quick Start Guide

Get started with FSRS implementation in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js version (need >= 22.0.0)
node --version

# Check Yarn version (need >= 4.9.2)
yarn --version

# Check PostgreSQL (need 17+)
psql --version

# Check Docker (optional)
docker --version
```

## Step 1: Database Setup

1. **Start PostgreSQL**:
   ```bash
   # Using Docker Compose
   docker-compose up -d postgres
   
   # Or use your local PostgreSQL
   ```

2. **Create migration file**:
   - Copy schema from `documentation/PHASE_1_DATABASE.md`
   - Create `migrations/changesets/002-fsrs-core-schema.xml`

3. **Run migration**:
   ```bash
   yarn migrate:up
   ```

## Step 2: Backend Setup

1. **Initialize backend**:
   ```bash
   cd backend
   yarn init -y
   ```

2. **Install dependencies**:
   ```bash
   yarn add express cors helmet morgan dotenv pg zod
   yarn add -D typescript @types/node @types/express @types/cors @types/pg tsx nodemon
   ```

3. **Copy FSRS service**:
   ```bash
   cp ../private/docs/FSRS_IMPLEMENTATION.ts src/services/fsrs.service.ts
   ```

4. **Create basic server**:
   ```typescript
   // src/index.ts
   import express from 'express';
   
   const app = express();
   const PORT = process.env.PORT || 4000;
   
   app.use(express.json());
   
   app.get('/health', (req, res) => {
     res.json({ status: 'ok' });
   });
   
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

5. **Test**:
   ```bash
   yarn dev
   # Visit http://localhost:4002/health
   ```

## Step 3: Test FSRS

1. **Create test file**:
   ```typescript
   // src/test-fsrs.ts
   import { createFSRS } from './services/fsrs.service';
   
   const fsrs = createFSRS();
   
   // Test new card
   const result = fsrs.reviewCard(null, 3); // Good rating
   console.log('New card:', result);
   
   // Test existing card
   const existingState = result.state;
   const result2 = fsrs.reviewCard(existingState, 3);
   console.log('Review:', result2);
   ```

2. **Run test**:
   ```bash
   tsx src/test-fsrs.ts
   ```

## Step 4: First API Endpoint

1. **Create card review endpoint**:
   ```typescript
   // src/routes/cards.ts
   import { Router } from 'express';
   import { createFSRS } from '../services/fsrs.service';
   
   const router = Router();
   const fsrs = createFSRS();
   
   router.post('/:id/review', async (req, res) => {
     const { id } = req.params;
     const { rating } = req.body;
     
     // TODO: Get card from database
     // TODO: Review card with FSRS
     // TODO: Save updated state
     
     res.json({ success: true });
   });
   
   export default router;
   ```

2. **Test with curl**:
   ```bash
   curl -X POST http://localhost:4002/api/cards/123/review \
     -H "Content-Type: application/json" \
     -d '{"rating": 3}'
   ```

## Next Steps

1. ✅ Database schema created
2. ✅ Backend server running
3. ✅ FSRS service integrated
4. ⏭️ Connect to database
5. ⏭️ Create full API endpoints
6. ⏭️ Build frontend

See `documentation/IMPLEMENTATION_PLAN.md` for full roadmap!
