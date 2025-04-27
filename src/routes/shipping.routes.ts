import { Router } from 'express';
import { shippingController } from '../controllers/shipping.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get available shipping options
router.get('/options', shippingController.getShippingOptions);

// Calculate shipping cost
router.post('/calculate', shippingController.calculateShipping);

export const shippingRoutes = router; 