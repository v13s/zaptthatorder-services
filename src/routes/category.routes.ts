import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Product category management endpoints
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories
 *     description: Retrieve all product categories
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   count:
 *                     type: integer
 */
router.get('/', categoryController.getAllCategories);

/**
 * @swagger
 * /api/categories/{categorySlug}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category details
 *     description: Get details of a specific category including filters and stats
 *     parameters:
 *       - in: path
 *         name: categorySlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 totalProducts:
 *                   type: integer
 *                 filters:
 *                   type: object
 *                   properties:
 *                     priceRange:
 *                       type: object
 *                       properties:
 *                         min:
 *                           type: number
 *                         max:
 *                           type: number
 *                     availableFilters:
 *                       type: object
 *                       properties:
 *                         isNew:
 *                           type: boolean
 *                         isSale:
 *                           type: boolean
 *       404:
 *         description: Category not found
 */
router.get('/:categorySlug', categoryController.getCategoryDetails);

/**
 * @swagger
 * /api/categories/{categorySlug}/products:
 *   get:
 *     tags: [Categories]
 *     summary: Get products by category
 *     description: Get products in a specific category with filtering and sorting
 *     parameters:
 *       - in: path
 *         name: categorySlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of products to skip
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, price-low, price-high, rating]
 *           default: newest
 *         description: Sort products by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: isNew
 *         schema:
 *           type: boolean
 *         description: Filter by new products
 *       - in: query
 *         name: isSale
 *         schema:
 *           type: boolean
 *         description: Filter by sale products
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 total:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 *       404:
 *         description: Category not found
 */
router.get('/:categorySlug/products', categoryController.getProductsByCategory);

export default router; 