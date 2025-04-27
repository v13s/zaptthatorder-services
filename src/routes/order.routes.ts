import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Order creation route
router.post('/', orderController.createOrder);

// Order history routes
router.get('/', orderController.getOrderHistory);
router.get('/:orderId', orderController.getOrderDetails);
router.post('/:orderId/cancel', orderController.cancelOrder);
router.post('/:orderId/send-confirmation', orderController.sendOrderConfirmation);

export const orderRoutes = router; 