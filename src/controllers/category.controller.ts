import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface CategoryGroup {
  category: string;
  _count: {
    category: number;
  };
}

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

interface ProductWithRelations {
  id: number;
  name: string;
  price: number;
  originalPrice: number | null;
  description: string;
  imageUrl: string;
  category: string;
  loyaltyPoints: number;
  stock: number;
  rating: number | null;
  isNew: boolean;
  isSale: boolean;
  createdAt: Date;
  images: Array<{
    imageUrl: string;
  }>;
  sizes: Array<{
    size: string;
  }>;
  colors: Array<{
    name: string;
    value: string;
  }>;
}

interface ProductFilter {
  isNew: boolean;
  isSale: boolean;
}

type SortOrder = 'asc' | 'desc';

export const categoryController = {
  // Get category details
  async getCategoryDetails(req: Request, res: Response) {
    try {
      const { categorySlug } = req.params;

      const [categoryStats, products] = await Promise.all([
        prisma.product.aggregate({
          where: { category: categorySlug },
          _count: true,
          _min: { price: true },
          _max: { price: true }
        }),
        prisma.product.findMany({
          where: { category: categorySlug },
          select: {
            isNew: true,
            isSale: true
          }
        })
      ]);

      const hasNewProducts = products.some((p: ProductFilter) => p.isNew);
      const hasSaleProducts = products.some((p: ProductFilter) => p.isSale);

      res.json({
        name: categorySlug,
        totalProducts: categoryStats._count,
        filters: {
          priceRange: {
            min: Number(categoryStats._min.price),
            max: Number(categoryStats._max.price)
          },
          availableFilters: {
            isNew: hasNewProducts,
            isSale: hasSaleProducts
          }
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to get category details');
    }
  },

  // Get all categories
  async getAllCategories(req: Request, res: Response) {
    try {
      const categories = await prisma.product.groupBy({
        by: ['category'],
        _count: {
          category: true
        }
      });

      res.json(categories.map((c: CategoryGroup) => ({
        name: c.category,
        count: c._count.category
      })));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to get categories');
    }
  },

  // Get products by category with filters
  async getProductsByCategory(req: Request, res: Response) {
    try {
      const { categorySlug } = req.params;
      const { 
        limit = '10', 
        offset = '0', 
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        priceMin,
        priceMax,
        isNew,
        isSale
      } = req.query;

      const parsedLimit = Math.max(1, parseInt(String(limit), 10));
      const parsedOffset = Math.max(0, parseInt(String(offset), 10));
      const validSortOrder: SortOrder = (sortOrder === 'asc' || sortOrder === 'desc') ? sortOrder : 'desc';

      // Build where clause
      const where: any = { category: categorySlug };
      
      if (priceMin || priceMax) {
        where.price = {};
        if (priceMin) where.price.gte = Number(priceMin);
        if (priceMax) where.price.lte = Number(priceMax);
      }
      
      if (isNew === 'true') where.isNew = true;
      if (isSale === 'true') where.isSale = true;

      // Build orderBy clause
      let orderBy: any = {};
      switch (sortBy) {
        case 'price-low':
          orderBy = { price: 'asc' };
          break;
        case 'price-high':
          orderBy = { price: 'desc' };
          break;
        case 'rating':
          orderBy = { rating: 'desc' };
          break;
        case 'newest':
        default:
          orderBy = { createdAt: 'desc' };
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip: parsedOffset,
          take: parsedLimit,
          orderBy,
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
        hasMore: parsedOffset + parsedLimit < total
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to get products by category');
    }
  }
}; 