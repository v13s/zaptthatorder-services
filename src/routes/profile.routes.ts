import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   - name: Profile
 *     description: User profile management endpoints
 */

/**
 * @swagger
 * /api/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Get user profile
 *     description: Retrieve the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 address:
 *                   type: string
 *                 socialLinks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       platform:
 *                         type: string
 *                       url:
 *                         type: string
 *                       isPublic:
 *                         type: boolean
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 */
router.get('/', profileController.getProfile);

/**
 * @swagger
 * /api/profile:
 *   put:
 *     tags: [Profile]
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
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
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 */
router.put('/', profileController.updateProfile);

/**
 * @swagger
 * /api/profile/image:
 *   put:
 *     tags: [Profile]
 *     summary: Update profile image
 *     description: Update the authenticated user's profile image
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL of the profile image
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 *       400:
 *         description: Image URL is required
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.put('/image', profileController.updateProfileImage);

/**
 * @swagger
 * /api/profile/social-links:
 *   get:
 *     tags: [Profile]
 *     summary: Get social links
 *     description: Retrieve the authenticated user's social links
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Social links retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 links:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       platform:
 *                         type: string
 *                       url:
 *                         type: string
 *                       isPublic:
 *                         type: boolean
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/social-links', profileController.getSocialLinks);

/**
 * @swagger
 * /api/profile/social-links:
 *   post:
 *     tags: [Profile]
 *     summary: Add social link
 *     description: Add a new social link to the authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform:
 *                 type: string
 *               url:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Social link added successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.post('/social-links', profileController.addSocialLink);

/**
 * @swagger
 * /api/profile/social-links/{linkId}:
 *   put:
 *     tags: [Profile]
 *     summary: Update social link
 *     description: Update an existing social link
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the social link to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Social link updated successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Social link not found
 */
router.put('/social-links/:linkId', profileController.updateSocialLink);

/**
 * @swagger
 * /api/profile/social-links/{linkId}:
 *   delete:
 *     tags: [Profile]
 *     summary: Delete social link
 *     description: Delete an existing social link
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the social link to delete
 *     responses:
 *       200:
 *         description: Social link deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Social link not found
 */
router.delete('/social-links/:linkId', profileController.deleteSocialLink);

export const profileRoutes = router; 