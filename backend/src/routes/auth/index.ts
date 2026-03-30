/**
 * Auth HTTP routes under `/api/auth` (no CSRF; refresh in httpOnly cookie).
 */

import { Router } from 'express';
import { registerLoginRouter } from './registerLogin.routes';
import { sessionRouter } from './session.routes';
import { passwordRouter } from './password.routes';
import { logoutRouter } from './logout.routes';

const router = Router();

router.use(registerLoginRouter);
router.use(sessionRouter);
router.use(passwordRouter);
router.use(logoutRouter);

export default router;
