/**
 * Integration-style tests for `users.routes.ts` (mounted at `/api/users`).
 *
 * These routes manage **categories** under `/me/categories` for the authenticated JWT user.
 * We do not hit PostgreSQL: `CategoryService` is replaced with a class whose methods are spies.
 *
 * Auth simulation: middleware in `createApp` sets `req.userId` directly, bypassing JWT parsing —
 * same pattern as other route tests in this repo.
 *
 * UUID note: `CategoryIdParamSchema` requires a valid UUID string; `categoryId` below is v4-shaped
 * so param validation passes and we exercise handler logic, not Zod 400s.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import usersRoutes from '@/routes/users.routes';
import { errorHandler } from '@/middleware/errorHandler';

/** Hoisted so `vi.mock` factory can close over stable fn references before imports run. */
const categoryMocks = vi.hoisted(() => ({
  listByUserId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  deleteCategory: vi.fn(),
}));

vi.mock('@/services/category.service', () => ({
  CategoryService: class {
    listByUserId = categoryMocks.listByUserId;
    create = categoryMocks.create;
    update = categoryMocks.update;
    delete = categoryMocks.deleteCategory;
  },
}));

const mockUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const categoryId = 'b2c3d4e5-f6a7-41a1-a111-f12345678901';

/** Minimal Express app: JSON body, fake auth, real router + global error handler. */
function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use((req, _res, next) => {
    req.userId = mockUserId;
    next();
  });
  app.use('/api/users', usersRoutes);
  app.use(errorHandler);
  return app;
}

describe('Users routes (categories)', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/users/me/categories lists categories', async () => {
    const rows = [{ id: 'c1', user_id: mockUserId, name: 'A', created_at: new Date() }];
    categoryMocks.listByUserId.mockResolvedValueOnce(rows);

    const res = await request(app).get('/api/users/me/categories');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // JSON serialization turns Date → ISO string; match shape without brittle timestamp equality.
    expect(res.body.data).toMatchObject([{ id: 'c1', user_id: mockUserId, name: 'A' }]);
    expect(categoryMocks.listByUserId).toHaveBeenCalledWith(mockUserId, false);
  });

  it('GET /api/users/me/categories passes cardCount flag', async () => {
    categoryMocks.listByUserId.mockResolvedValueOnce([]);

    await request(app).get('/api/users/me/categories?cardCount=true');

    // Second argument triggers JOIN/COUNT path in real CategoryService.
    expect(categoryMocks.listByUserId).toHaveBeenCalledWith(mockUserId, true);
  });

  it('POST /api/users/me/categories creates a category', async () => {
    const created = { id: 'c-new', user_id: mockUserId, name: 'Verbs', created_at: new Date() };
    categoryMocks.create.mockResolvedValueOnce(created);

    const res = await request(app).post('/api/users/me/categories').send({ name: 'Verbs' });

    expect(res.status).toBe(201);
    expect(categoryMocks.create).toHaveBeenCalledWith(mockUserId, 'Verbs');
    expect(res.body.data).toMatchObject({ id: 'c-new', user_id: mockUserId, name: 'Verbs' });
  });

  it('PATCH /api/users/me/categories/:id updates', async () => {
    const updated = { id: categoryId, user_id: mockUserId, name: 'Nouns', created_at: new Date() };
    categoryMocks.update.mockResolvedValueOnce(updated);

    const res = await request(app).patch(`/api/users/me/categories/${categoryId}`).send({ name: 'Nouns' });

    expect(res.status).toBe(200);
    expect(categoryMocks.update).toHaveBeenCalledWith(categoryId, mockUserId, 'Nouns');
    expect(res.body.data).toMatchObject({ id: categoryId, name: 'Nouns' });
  });

  it('PATCH returns 404 when category missing', async () => {
    categoryMocks.update.mockResolvedValueOnce(null);

    const res = await request(app).patch(`/api/users/me/categories/${categoryId}`).send({ name: 'X' });

    expect(res.status).toBe(404);
  });

  it('DELETE /api/users/me/categories/:id removes', async () => {
    categoryMocks.deleteCategory.mockResolvedValueOnce(true);

    const res = await request(app).delete(`/api/users/me/categories/${categoryId}`);

    expect(res.status).toBe(200);
    expect(categoryMocks.deleteCategory).toHaveBeenCalledWith(categoryId, mockUserId);
  });

  it('DELETE returns 404 when category missing', async () => {
    categoryMocks.deleteCategory.mockResolvedValueOnce(false);

    const res = await request(app).delete(`/api/users/me/categories/${categoryId}`);

    expect(res.status).toBe(404);
  });
});
