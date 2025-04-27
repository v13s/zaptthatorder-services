import { Router } from 'express';
import { productController } from '../controllers/product.controller';

const router = Router();

// Get all products with optional filtering
router.get('/', productController.getProducts);

// Search products
router.get('/search', productController.searchProducts);

// Get featured products
router.get('/featured', productController.getFeaturedProducts);

// Get product by ID
router.get('/:id', productController.getProductById);

// Get product images
router.get('/:id/images', productController.getProductImages);

// Get product sizes
router.get('/:id/sizes', productController.getProductSizes);

// Get product colors
router.get('/:id/colors', productController.getProductColors);

// Create a new product
router.post('/', productController.createProduct);

// Update a product
router.put('/:id', productController.updateProduct);

// Delete a product
router.delete('/:id', productController.deleteProduct);

export const productRoutes = router; 