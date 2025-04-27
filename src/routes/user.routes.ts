import { Router } from 'express';
import { userController } from '../controllers/user.controller';

const router = Router();

// Get all users
router.get('/', userController.getAllUsers);

// Get a single user by ID
router.get('/:id', userController.getUserById);

// Create a new user
router.post('/', userController.createUser);

// Update a user
router.put('/:id', userController.updateUser);

// Delete a user
router.delete('/:id', userController.deleteUser);

// Get user's cart
router.get('/:id/cart', userController.getUserCart);

// Get user's reviews
router.get('/:id/reviews', userController.getUserReviews);

export const userRoutes = router; 