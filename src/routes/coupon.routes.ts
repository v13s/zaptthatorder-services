import { Router } from 'express';
import { couponController } from '../controllers/coupon.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Coupons
 *     description: Coupon and discount management endpoints
 */

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: Get all coupons
 *     description: Retrieve all coupons with optional filtering
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [percentage, fixed]
 *         description: Filter by coupon type
 *     responses:
 *       200:
 *         description: List of coupons
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Coupon'
 */
router.get('/', couponController.getAllCoupons);

/**
 * @swagger
 * /api/coupons/{code}:
 *   get:
 *     tags: [Coupons]
 *     summary: Get coupon by code
 *     description: Retrieve a specific coupon by its code
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon code
 *     responses:
 *       200:
 *         description: Coupon details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 *       404:
 *         description: Coupon not found
 */
router.get('/:code', couponController.getCouponByCode);

/**
 * @swagger
 * /api/coupons:
 *   post:
 *     tags: [Coupons]
 *     summary: Create new coupon
 *     description: Create a new coupon
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               value:
 *                 type: number
 *               minPurchase:
 *                 type: number
 *               maxDiscount:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               usageLimit:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, couponController.createCoupon);

/**
 * @swagger
 * /api/coupons/{code}:
 *   put:
 *     tags: [Coupons]
 *     summary: Update coupon
 *     description: Update an existing coupon
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               value:
 *                 type: number
 *               minPurchase:
 *                 type: number
 *               maxDiscount:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               usageLimit:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Coupon not found
 */
router.put('/:code', authenticate, couponController.updateCoupon);

/**
 * @swagger
 * /api/coupons/{code}:
 *   delete:
 *     tags: [Coupons]
 *     summary: Delete coupon
 *     description: Delete an existing coupon
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon code
 *     responses:
 *       204:
 *         description: Coupon deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Coupon not found
 */
router.delete('/:code', authenticate, couponController.deleteCoupon);

export const couponRoutes = router; 