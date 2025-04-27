import { Router } from 'express';
import { cartController } from '../controllers/cart.controller';

const router = Router();

// Get cart summary
router.get('/summary', cartController.getCartSummary);

// Get cart items
router.get('/items', cartController.getCartItems);

// Add item to cart
router.post('/items', cartController.addCartItem);

// Update cart item
router.put('/items/:id', cartController.updateCartItem);

// Remove cart item
router.delete('/items/:id', cartController.removeCartItem);

// Clear cart
router.delete('/clear', cartController.clearCart);

export const cartRoutes = router; 