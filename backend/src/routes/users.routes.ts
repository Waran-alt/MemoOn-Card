/**
 * User-scoped **category** HTTP API under `/api/users`.
 *
 * Mount: `app.use('/api/users', authMiddleware, usersRoutes)` — every handler assumes `getUserId(req)`
 * is already set by JWT middleware. Category IDs in params are validated as UUIDs; mutations always
 * pair `(categoryId, userId)` in the service layer so one user cannot touch another user's rows.
 *
 * Query conventions:
 * - `GET .../me/categories?cardCount=true|1` — include `card_count` per category (heavier query).
 *   Any other value is treated as “without counts” (same as omitting the query).
 */

import { Router } from 'express';
import { getUserId } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateParams, validateRequest } from '@/middleware/validation';
import { CreateCategorySchema, UpdateCategorySchema, CategoryIdParamSchema } from '@/schemas/category.schemas';
import { CategoryService } from '@/services/category.service';
import { NotFoundError } from '@/utils/errors';

const router = Router();
/** One instance per process; holds no per-request state beyond the pool inside the service. */
const categoryService = new CategoryService();

/**
 * GET /api/users/me/categories
 * List categories for the current user (optional `card_count` per row via query).
 */
router.get('/me/categories', asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const withCardCount = (req.query?.cardCount as string) === 'true' || (req.query?.cardCount as string) === '1';
  const list = await categoryService.listByUserId(userId, withCardCount);
  return res.json({ success: true, data: list });
}));

/**
 * POST /api/users/me/categories
 * Create a category; body validated by `CreateCategorySchema` (trimmed name, max length).
 */
router.post('/me/categories', validateRequest(CreateCategorySchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const category = await categoryService.create(userId, req.body.name);
  return res.status(201).json({ success: true, data: category });
}));

/**
 * PATCH /api/users/me/categories/:id
 * Rename a category. Returns 404 if the id does not exist for this user.
 */
router.patch('/me/categories/:id', validateParams(CategoryIdParamSchema), validateRequest(UpdateCategorySchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const categoryId = String(req.params.id);
  const category = await categoryService.update(categoryId, userId, req.body.name);
  if (!category) throw new NotFoundError('Category');
  return res.json({ success: true, data: category });
}));

/**
 * DELETE /api/users/me/categories/:id
 * Delete a category and detach from cards (`card_categories`). Returns 404 if not found for user.
 */
router.delete('/me/categories/:id', validateParams(CategoryIdParamSchema), asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const categoryId = String(req.params.id);
  const deleted = await categoryService.delete(categoryId, userId);
  if (!deleted) throw new NotFoundError('Category');
  return res.json({ success: true, message: 'Category deleted' });
}));

export default router;
