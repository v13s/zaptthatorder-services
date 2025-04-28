import express from 'express';
import { loyaltyController } from '../controllers/loyalty.controller';
import { couponController } from '../controllers/coupon.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Loyalty
 *     description: Loyalty program management endpoints
 */

/**
 * @swagger
 * /api/loyalty/status:
 *   get:
 *     tags: [Loyalty]
 *     summary: Get loyalty status
 *     description: Get the current user's loyalty program status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loyalty status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isMember:
 *                   type: boolean
 *                 currentTier:
 *                   type: string
 *                 points:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/status', authenticate, loyaltyController.getLoyaltyStatus);

/**
 * @swagger
 * /api/loyalty/banner:
 *   get:
 *     tags: [Loyalty]
 *     summary: Get loyalty banner
 *     description: Get promotional banner data for the loyalty program
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Banner data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/banner', authenticate, loyaltyController.getLoyaltyBanner);

/**
 * @swagger
 * /api/loyalty/transactions:
 *   get:
 *     tags: [Loyalty]
 *     summary: Get loyalty transactions
 *     description: Get the user's loyalty point transactions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   date:
 *                     type: string
 *                     format: date-time
 *                   type:
 *                     type: string
 *                   points:
 *                     type: integer
 *                   description:
 *                     type: string
 *                   status:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/transactions', authenticate, loyaltyController.getLoyaltyTransactions);

/**
 * @swagger
 * /api/loyalty/coupons:
 *   get:
 *     tags: [Loyalty]
 *     summary: Get loyalty coupons
 *     description: Get available coupons for loyalty members
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                   value:
 *                     type: number
 *                   type:
 *                     type: string
 *                   expiresAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/coupons', authenticate, couponController.getLoyaltyCoupons);

/**
 * @swagger
 * /api/loyalty/tiers:
 *   get:
 *     tags: [Loyalty]
 *     summary: Get all loyalty tiers
 *     description: Get information about all available loyalty tiers
 *     responses:
 *       200:
 *         description: Tiers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   requiredPoints:
 *                     type: integer
 *                   multiplier:
 *                     type: number
 *                   perks:
 *                     type: array
 *                     items:
 *                       type: string
 */
router.get('/tiers', loyaltyController.getAllTiers);

/**
 * @swagger
 * /api/loyalty/tiers/{name}:
 *   get:
 *     tags: [Loyalty]
 *     summary: Get tier by name
 *     description: Get detailed information about a specific loyalty tier
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Tier name
 *     responses:
 *       200:
 *         description: Tier details retrieved successfully
 *       404:
 *         description: Tier not found
 */
router.get('/tiers/:name', loyaltyController.getTierByName);

/**
 * @swagger
 * /api/loyalty/calculate-tier:
 *   get:
 *     tags: [Loyalty]
 *     summary: Calculate tier
 *     description: Calculate which tier a user would be in based on points
 *     parameters:
 *       - in: query
 *         name: points
 *         required: true
 *         schema:
 *           type: integer
 *         description: Number of loyalty points
 *     responses:
 *       200:
 *         description: Tier calculation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tier:
 *                   type: string
 *                 nextTier:
 *                   type: string
 *                 pointsToNextTier:
 *                   type: integer
 */
router.get('/calculate-tier', loyaltyController.calculateTier);

/**
 * @swagger
 * /api/loyalty/transactions:
 *   post:
 *     tags: [Loyalty]
 *     summary: Create loyalty transaction
 *     description: Create a new loyalty point transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               type:
 *                 type: string
 *               points:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/transactions', loyaltyController.createTransaction);

/**
 * @swagger
 * /api/loyalty/transactions/{id}/status:
 *   patch:
 *     tags: [Loyalty]
 *     summary: Update transaction status
 *     description: Update the status of a loyalty transaction
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       404:
 *         description: Transaction not found
 */
router.patch('/transactions/:id/status', loyaltyController.updateTransactionStatus);

/**
 * @swagger
 * /api/loyalty/rewards:
 *   get:
 *     tags: [Loyalty]
 *     summary: Get loyalty rewards
 *     description: Get available rewards for loyalty points
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rewards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   pointsRequired:
 *                     type: integer
 *                   description:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/rewards', authenticate, loyaltyController.getLoyaltyRewards);

/**
 * @swagger
 * /api/loyalty/redeem:
 *   post:
 *     tags: [Loyalty]
 *     summary: Redeem loyalty points
 *     description: Redeem loyalty points for a reward
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rewardId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Points redeemed successfully
 *       400:
 *         description: Invalid input or insufficient points
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reward not found
 */
router.post('/redeem', authenticate, loyaltyController.redeemPoints);

/**
 * @swagger
 * /api/loyalty/enroll:
 *   post:
 *     tags: [Loyalty]
 *     summary: Enroll in loyalty program
 *     description: Enroll the current user in the loyalty program
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully enrolled in loyalty program
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Already enrolled
 */
router.post('/enroll', authenticate, loyaltyController.enrollInLoyalty);

/**
 * @swagger
 * /api/loyalty/tiers:
 *   post:
 *     tags: [Loyalty]
 *     summary: Create a new loyalty tier
 *     description: Create a new loyalty tier (Admin only)
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
 *               requiredPoints:
 *                 type: integer
 *               multiplier:
 *                 type: number
 *               perks:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tier created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.post('/tiers', authenticate, isAdmin, loyaltyController.createTier);

/**
 * @swagger
 * /api/loyalty/tiers/{name}:
 *   put:
 *     tags: [Loyalty]
 *     summary: Update a loyalty tier
 *     description: Update an existing loyalty tier (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Tier name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requiredPoints:
 *                 type: integer
 *               multiplier:
 *                 type: number
 *               perks:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Tier updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Tier not found
 */
router.put('/tiers/:name', authenticate, isAdmin, loyaltyController.updateTier);

/**
 * @swagger
 * /api/loyalty/tiers/{name}:
 *   delete:
 *     tags: [Loyalty]
 *     summary: Delete a loyalty tier
 *     description: Delete an existing loyalty tier (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Tier name
 *     responses:
 *       200:
 *         description: Tier deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Tier not found
 */
router.delete('/tiers/:name', authenticate, isAdmin, loyaltyController.deleteTier);

export const loyaltyRoutes = router; 