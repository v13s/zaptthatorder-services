import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { check } from 'express-validator/check';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and authorization endpoints
 */

/**
 * @swagger
 * /api/auth/status:
 *   get:
 *     tags: [Authentication]
 *     summary: Check authentication status
 *     description: Check if the user is authenticated and get their current status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authentication status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAuthenticated:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/status', authController.getAuthStatus);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user and return JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  [
    check('email').isEmail().normalizeEmail(),
    check('password').isLength({ min: 6 })
  ],
  validateRequest,
  authController.login
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: User registration
 *     description: Register a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               phone:
 *                 type: string
 *                 description: Optional phone number
 *               joinLoyalty:
 *                 type: boolean
 *                 description: Optional flag to join loyalty program
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email already exists
 */
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

/**
 * @swagger
 * /api/auth/social/github:
 *   post:
 *     tags: [Authentication]
 *     summary: GitHub social login
 *     description: Authenticate user using GitHub OAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: GitHub OAuth code
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid code
 */
router.post(
  '/social/github',
  [
    check('code').notEmpty()
  ],
  validateRequest,
  authController.socialLogin
);

/**
 * @swagger
 * /api/auth/social/facebook:
 *   post:
 *     tags: [Authentication]
 *     summary: Facebook social login
 *     description: Authenticate user using Facebook OAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Facebook OAuth code
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid code
 */
router.post(
  '/social/facebook',
  [
    check('code').notEmpty()
  ],
  validateRequest,
  authController.socialLogin
);

/**
 * @swagger
 * /api/auth/reset-password/request:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset
 *     description: Request a password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent
 *       400:
 *         description: Invalid email
 */
router.post(
  '/reset-password/request',
  [
    check('email').isEmail().normalizeEmail()
  ],
  validateRequest,
  authController.requestPasswordReset
);

/**
 * @swagger
 * /api/auth/reset-password/verify:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password
 *     description: Reset password using token from email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token or password
 */
router.post(
  '/reset-password/verify',
  [
    check('token').notEmpty(),
    check('newPassword').isLength({ min: 6 })
  ],
  validateRequest,
  authController.resetPassword
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: User logout
 *     description: Logout the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authController.logout);

export const authRoutes = router; 