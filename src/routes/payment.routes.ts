import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Payment processing endpoints
 */

/**
 * @swagger
 * /api/payments/methods:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment methods
 *     description: Retrieve available payment methods
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment methods
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
 *                   isActive:
 *                     type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/methods', paymentController.getPaymentMethods);

/**
 * @swagger
 * /api/payments/process:
 *   post:
 *     tags: [Payments]
 *     summary: Process payment
 *     description: Process a payment for an order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: integer
 *               paymentMethod:
 *                 type: string
 *               paymentDetails:
 *                 type: object
 *                 properties:
 *                   cardNumber:
 *                     type: string
 *                   expiryDate:
 *                     type: string
 *                   cvv:
 *                     type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 amount:
 *                   type: number
 *       400:
 *         description: Invalid payment details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post('/process', paymentController.processPayment);

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     tags: [Payments]
 *     summary: Process refund
 *     description: Process a refund for an order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refundId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 amount:
 *                   type: number
 *       400:
 *         description: Invalid refund request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post('/refund', paymentController.processRefund);

export const paymentRoutes = router; 