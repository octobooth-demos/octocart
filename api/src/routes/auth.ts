import { Router } from 'express';
import { store } from '../data/store.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { UnauthorizedError } from '../lib/errors.js';
import { createToken, verifyPassword } from '../lib/passwords.js';
import { validate } from '../lib/validate.js';
import { currentUser, requireAuth } from '../middleware/requireAuth.js';
import { LoginBody } from '../schemas.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  validate({ body: LoginBody }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as LoginBody;
    const user = await store.findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = createToken();
    await store.createSession(token, user.id);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  }),
);

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: currentUser(req) });
});

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.token) await store.deleteSession(req.token);
    res.status(204).end();
  }),
);
