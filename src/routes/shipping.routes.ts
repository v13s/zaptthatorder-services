import { Router } from 'express';
import { shippingController } from '../controllers/shipping.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   - name: Shipping
 *     description: Shipping and delivery endpoints
 */

/**
 * @swagger
 * /api/shipping/methods:
 *   get:
 *     tags: [Shipping]
 *     summary: Get shipping methods
 *     description: Retrieve available shipping methods
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shipping methods
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 *                   estimatedDays:
 *                     type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/methods', shippingController.getShippingOptions);

/**
 * @swagger
 * /api/shipping/calculate:
 *   post:
 *     tags: [Shipping]
 *     summary: Calculate shipping cost
 *     description: Calculate shipping cost for an order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shippingMethod:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Shipping cost calculated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cost:
 *                   type: number
 *                 estimatedDays:
 *                   type: integer
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/calculate', shippingController.calculateShipping);

/**
 * @swagger
 * /api/shipping/track/{trackingNumber}:
 *   get:
 *     tags: [Shipping]
 *     summary: Track shipment
 *     description: Get tracking information for a shipment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Shipment tracking number
 *     responses:
 *       200:
 *         description: Tracking information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 location:
 *                   type: string
 *                 estimatedDelivery:
 *                   type: string
 *                   format: date-time
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       location:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tracking number not found
 */
router.get('/track/:trackingNumber', shippingController.trackShipment);

export const shippingRoutes = router; 