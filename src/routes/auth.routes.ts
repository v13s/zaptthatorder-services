import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { check } from 'express-validator/check';

const router = Router();

// Auth status endpoint
router.get('/status', authController.getAuthStatus);

// Login endpoint
router.post(
  '/login',
  [
    check('email').isEmail().normalizeEmail(),
    check('password').isLength({ min: 6 })
  ],
  validateRequest,
  authController.login
);

// Register endpoint
router.post(
  '/register',
  [
    check('name').trim().notEmpty(),
    check('email').isEmail().normalizeEmail(),
    check('password').isLength({ min: 6 }),
    check('phone').optional().isMobilePhone('any'),
    check('joinLoyalty').optional().isBoolean()
  ],
  validateRequest,
  authController.register
);

// Social login endpoints
router.post(
  '/social/github',
  [
    check('code').notEmpty()
  ],
  validateRequest,
  authController.socialLogin
);

router.post(
  '/social/facebook',
  [
    check('code').notEmpty()
  ],
  validateRequest,
  authController.socialLogin
);

// Password reset endpoints
router.post(
  '/reset-password/request',
  [
    check('email').isEmail().normalizeEmail()
  ],
  validateRequest,
  authController.requestPasswordReset
);

router.post(
  '/reset-password/verify',
  [
    check('token').notEmpty(),
    check('newPassword').isLength({ min: 6 })
  ],
  validateRequest,
  authController.resetPassword
);

// Logout endpoint
router.post('/logout', authController.logout);

export const authRoutes = router; 