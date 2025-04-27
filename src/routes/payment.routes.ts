import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get available payment methods
router.get('/methods', paymentController.getPaymentMethods);

// Validate payment method
router.post('/validate', paymentController.validatePaymentMethod);

export const paymentRoutes = router; 