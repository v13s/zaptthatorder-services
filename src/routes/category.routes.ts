import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';

const router = Router();

// Get all categories
router.get('/', categoryController.getAllCategories);

// Get category details
router.get('/:categorySlug', categoryController.getCategoryDetails);

// Get products by category with filters
router.get('/:categorySlug/products', categoryController.getProductsByCategory);

export const categoryRoutes = router; 