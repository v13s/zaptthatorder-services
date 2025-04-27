import { Request, Response } from 'express';
import { PrismaClient, Product, ProductImage, ProductSize, ProductColor } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface ProductResponse {
  id: number;
  name: string;
  price: number;
  originalPrice: number | null;
  description: string;
  image: string;
  images: string[];
  category: string;
  sizes: string[];
  colors: Array<{
    name: string;
    value: string;
  }>;
  loyaltyPoints: number;
  stock: number;
  rating: number | null;
  isNew: boolean;
  isSale: boolean;
}

interface ProductWithRelations extends Product {
  images: ProductImage[];
  sizes: ProductSize[];
  colors: ProductColor[];
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - description
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the product
 *         name:
 *           type: string
 *           description: The name of the product
 *         price:
 *           type: number
 *           description: The price of the product
 *         description:
 *           type: string
 *           description: The description of the product
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of product image URLs
 *         sizes:
 *           type: array
 *           items:
 *             type: string
 *           description: Available sizes for the product
 *         colors:
 *           type: array
 *           items:
 *             type: string
 *           description: Available colors for the product
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Returns the list of all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: The list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: true,
        sizes: true,
        colors: true
      }
    });
    res.json(products);
  } catch (error) {
    throw new AppError('Failed to fetch products', 500);
  }
};

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product id
 *     responses:
 *       200:
 *         description: The product description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: The product was not found
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        sizes: true,
        colors: true
      }
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.json(product);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch product', 500);
  }
};

export const productController = {
  getProducts: async (req: Request, res: Response) => {
    try {
      const { category, isNew, isSale, limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

      const where: any = {};
      if (category) where.category = category;
      if (isNew === 'true') where.isNew = true;
      if (isSale === 'true') where.isSale = true;

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip: Number(offset),
          take: Number(limit),
          orderBy: {
            [sortBy as string]: sortOrder
          }
        }),
        prisma.product.count({ where })
      ]);

      res.json({
        products: products.map((p): ProductResponse => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          description: p.description,
          image: p.imageUrl,
          images: [],
          category: p.category,
          sizes: [],
          colors: [],
          loyaltyPoints: p.loyaltyPoints,
          stock: p.stock,
          rating: p.rating ? Number(p.rating) : null,
          isNew: p.isNew,
          isSale: p.isSale
        })),
        total,
        hasMore: Number(offset) + Number(limit) < total
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get products', 500);
    }
  },

  getFeaturedProducts: async (req: Request, res: Response) => {
    try {
      const { filter = 'all', limit = '10', offset = '0' } = req.query;

      const where: any = {};
      if (filter === 'new') where.is_new = true;
      if (filter === 'sale') where.is_sale = true;

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip: Number(offset),
          take: Number(limit),
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            images: true,
            sizes: true,
            colors: true
          }
        }),
        prisma.product.count({ where })
      ]);

      res.json({
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          description: p.description,
          image: p.imageUrl,
          images: p.images.map(img => img.imageUrl),
          category: p.category,
          sizes: p.sizes.map(s => s.size),
          colors: p.colors.map(c => ({
            name: c.name,
            value: c.value
          })),
          loyaltyPoints: p.loyaltyPoints,
          stock: p.stock,
          rating: p.rating ? Number(p.rating) : null,
          isNew: p.isNew,
          isSale: p.isSale
        })),
        total,
        hasMore: Number(offset) + Number(limit) < total
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get featured products', 500);
    }
  },

  getProductImages: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const images = await prisma.product_images.findMany({
        where: { product_id: Number(id) }
      });

      res.json({
        images: images.map(i => ({
          id: i.id,
          url: i.image_url,
          isPrimary: i.is_primary
        }))
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get product images', 500);
    }
  },

  getProductSizes: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const sizes = await prisma.product_sizes.findMany({
        where: { product_id: Number(id) }
      });

      res.json({
        sizes: sizes.map(s => s.size)
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get product sizes', 500);
    }
  },

  getProductColors: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const colors = await prisma.product_colors.findMany({
        where: { product_id: Number(id) }
      });

      res.json({
        colors: colors.map(c => ({
          name: c.name,
          value: c.value
        }))
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get product colors', 500);
    }
  },

  // Create a new product
  async createProduct(req: Request, res: Response) {
    const {
      name,
      price,
      originalPrice,
      description,
      imageUrl,
      category,
      loyaltyPoints,
      stock,
      rating,
      isNew,
      isSale,
      images,
      sizes,
      colors,
    } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        price,
        originalPrice,
        description,
        imageUrl,
        category,
        loyaltyPoints,
        stock,
        rating,
        isNew,
        isSale,
        images: {
          create: images?.map((image: { imageUrl: string; isPrimary: boolean }) => ({
            imageUrl: image.imageUrl,
            isPrimary: image.isPrimary,
          })),
        },
        sizes: {
          create: sizes?.map((size: string) => ({
            size,
          })),
        },
        colors: {
          create: colors?.map((color: { name: string; value: string }) => ({
            name: color.name,
            value: color.value,
          })),
        },
      },
      include: {
        images: true,
        sizes: true,
        colors: true,
      },
    });

    res.status(201).json(product);
  },

  // Update a product
  async updateProduct(req: Request, res: Response) {
    const { id } = req.params;
    const updateData = req.body;

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        images: true,
        sizes: true,
        colors: true,
      },
    });

    res.json(product);
  },

  // Delete a product
  async deleteProduct(req: Request, res: Response) {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  },

  // Search products
  searchProducts: async (req: Request, res: Response) => {
    try {
      const { 
        category, 
        isNew, 
        isSale, 
        limit = '10', 
        offset = '0', 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = req.query;

      const where: any = {};
      if (category) where.category = category;
      if (isNew === 'true') where.isNew = true;
      if (isSale === 'true') where.isSale = true;

      const orderBy: any = {};
      switch (sortBy) {
        case 'price':
          orderBy.price = sortOrder;
          break;
        case 'rating':
          orderBy.rating = sortOrder;
          break;
        case 'newest':
          orderBy.createdAt = sortOrder;
          break;
        default:
          orderBy.createdAt = 'desc';
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip: Number(offset),
          take: Number(limit),
          orderBy
        }),
        prisma.product.count({ where })
      ]);

      res.json({
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          image: p.imageUrl,
          category: p.category,
          rating: p.rating ? Number(p.rating) : null,
          isNew: p.isNew,
          isSale: p.isSale
        })),
        total,
        hasMore: Number(offset) + Number(limit) < total
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to search products', 500);
    }
  },
}; 