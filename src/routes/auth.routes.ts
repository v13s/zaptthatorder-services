import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { body } from 'express-validator';

const router = Router();

// Auth status endpoint
router.get('/status', authController.getAuthStatus);

// Login endpoint
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  validateRequest,
  authController.login
);

// Register endpoint
router.post(
  '/register',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('phone').optional().isMobilePhone('any'),
    body('joinLoyalty').optional().isBoolean()
  ],
  validateRequest,
  authController.register
);

// Social login endpoints
router.post(
  '/social/github',
  [
    body('code').notEmpty()
  ],
  validateRequest,
  authController.socialLogin
);

router.post(
  '/social/facebook',
  [
    body('code').notEmpty()
  ],
  validateRequest,
  authController.socialLogin
);

// Password reset endpoints
router.post(
  '/reset-password/request',
  [
    body('email').isEmail().normalizeEmail()
  ],
  validateRequest,
  authController.requestPasswordReset
);

router.post(
  '/reset-password/verify',
  [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  validateRequest,
  authController.resetPassword
);

// Logout endpoint
router.post('/logout', authController.logout);

export const authRoutes = router; 