import { Router } from 'express';
import { cartController } from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all cart routes
router.use(authenticate);

// Get cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/items', cartController.addItem);

// Update cart item
router.put('/items/:id', cartController.updateItem);

// Remove item from cart
router.delete('/items/:id', cartController.removeItem);

// Clear cart
router.delete('/', cartController.clearCart);

export default router; 