import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
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

interface ProductImage {
  url: string;
  isPrimary: boolean;
}

interface ProductSize {
  size: string;
}

interface ProductColor {
  name: string;
  value: string;
}

interface ProductWithRelations {
  id: number;
  name: string;
  price: any; // Prisma Decimal type
  originalPrice: any | null; // Prisma Decimal type
  description: string;
  image: string;
  category: string;
  loyaltyPoints: number;
  stock: number;
  rating: any | null; // Prisma Decimal type
  isNew: boolean;
  isSale: boolean;
  images: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  sizes: Array<{
    size: string;
  }>;
  colors: Array<{
    name: string;
    value: string;
  }>;
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
      where: { id: Number(id) },
      include: {
        images: true,
        sizes: true,
        colors: true
      }
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.json({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      description: product.description,
      image: product.image,
      images: product.images.map((img: ProductImage) => img.url),
      category: product.category,
      sizes: product.sizes.map((s: ProductSize) => s.size),
      colors: product.colors.map((c: ProductColor) => ({
        name: c.name,
        value: c.value
      })),
      loyaltyPoints: product.loyaltyPoints,
      stock: product.stock,
      rating: product.rating ? Number(product.rating) : null,
      isNew: product.isNew,
      isSale: product.isSale
    });
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
        products: products.map((p: ProductWithRelations): ProductResponse => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          description: p.description,
          image: p.image,
          images: p.images.map((img: { url: string }) => img.url),
          category: p.category,
          sizes: p.sizes.map((s: { size: string }) => s.size),
          colors: p.colors.map((c: { name: string; value: string }) => ({
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
      throw new AppError('Failed to get products', 500);
    }
  },

  getProductById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const product = await prisma.product.findUnique({
        where: { id: Number(id) },
        include: {
          images: true,
          sizes: true,
          colors: true
        }
      });

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      res.json({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        description: product.description,
        image: product.image,
        images: product.images.map((img: ProductImage) => img.url),
        category: product.category,
        sizes: product.sizes.map((s: ProductSize) => s.size),
        colors: product.colors.map((c: ProductColor) => ({
          name: c.name,
          value: c.value
        })),
        loyaltyPoints: product.loyaltyPoints,
        stock: product.stock,
        rating: product.rating ? Number(product.rating) : null,
        isNew: product.isNew,
        isSale: product.isSale
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch product', 500);
    }
  },

  getFeaturedProducts: async (req: Request, res: Response) => {
    try {
      const products = await prisma.product.findMany({
        where: {
          isNew: true
        },
        take: 8,
        include: {
          images: true,
          sizes: true,
          colors: true
        }
      });

      res.json(products.map((p: ProductWithRelations): ProductResponse => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        description: p.description,
        image: p.image,
        images: p.images.map((img: { url: string }) => img.url),
        category: p.category,
        sizes: p.sizes.map((s: { size: string }) => s.size),
        colors: p.colors.map((c: { name: string; value: string }) => ({
          name: c.name,
          value: c.value
        })),
        loyaltyPoints: p.loyaltyPoints,
        stock: p.stock,
        rating: p.rating ? Number(p.rating) : null,
        isNew: p.isNew,
        isSale: p.isSale
      })));
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
      const images = await prisma.productImage.findMany({
        where: { productId: Number(id) }
      });

      res.json(images.map((i: { url: string }) => i.url));
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
      const sizes = await prisma.productSize.findMany({
        where: { productId: Number(id) }
      });

      res.json(sizes.map((s: { size: string }) => s.size));
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
      const colors = await prisma.productColor.findMany({
        where: { productId: Number(id) }
      });

      res.json(colors.map((c: { name: string; value: string }) => ({
        name: c.name,
        value: c.value
      })));
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
      image,
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
        image,
        category,
        loyaltyPoints,
        stock,
        rating,
        isNew,
        isSale,
        images: {
          create: images?.map((img: { url: string; isPrimary: boolean }) => ({
            url: img.url,
            isPrimary: img.isPrimary,
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
      const { query } = req.query;
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query as string } },
            { description: { contains: query as string } }
          ]
        },
        include: {
          images: true,
          sizes: true,
          colors: true
        }
      });

      res.json(products.map((p: ProductWithRelations): ProductResponse => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        description: p.description,
        image: p.image,
        images: p.images.map((img: { url: string }) => img.url),
        category: p.category,
        sizes: p.sizes.map((s: { size: string }) => s.size),
        colors: p.colors.map((c: { name: string; value: string }) => ({
          name: c.name,
          value: c.value
        })),
        loyaltyPoints: p.loyaltyPoints,
        stock: p.stock,
        rating: p.rating ? Number(p.rating) : null,
        isNew: p.isNew,
        isSale: p.isSale
      })));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to search products', 500);
    }
  },
}; 