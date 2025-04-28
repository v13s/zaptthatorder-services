import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

interface CartItemResponse {
  id: number;
  productId: number;
  quantity: number;
  size: string | null;
  color: string | null;
  product: {
    id: number;
    name: string;
    price: number;
    originalPrice: number | null;
    image: string;
    loyaltyPoints: number;
  };
}

export const cartController = {
  // Get cart
  async getCart(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  originalPrice: true,
                  image: true,
                  loyaltyPoints: true
                }
              }
            }
          }
        }
      });

      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      res.json({
        id: cart.id,
        userId: cart.userId,
        subtotal: Number(cart.subtotal),
        total: Number(cart.total),
        estimatedLoyaltyPoints: cart.estimatedLoyaltyPoints,
        items: cart.items.map((item: { id: number; productId: number; quantity: number; size: string | null; color: string | null; product: { id: number; name: string; price: Prisma.Decimal; originalPrice: Prisma.Decimal | null; image: string; loyaltyPoints: number } }) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: Number(item.product.price),
            originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : null,
            image: item.product.image,
            loyaltyPoints: item.product.loyaltyPoints
          }
        }))
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get cart', 500);
    }
  },

  // Add item to cart
  async addItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { productId, quantity, size, color } = req.body;

      // Get or create cart
      let cart = await prisma.cart.findUnique({
        where: { userId: req.user.id }
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            userId: req.user.id,
            subtotal: 0,
            total: 0,
            estimatedLoyaltyPoints: 0
          }
        });
      }

      // Add item to cart
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          price: true,
          originalPrice: true,
          image: true,
          loyaltyPoints: true
        }
      }) as {
        id: number;
        name: string;
        price: any;
        originalPrice: any | null;
        image: string;
        loyaltyPoints: number;
      };

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      const item = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          size,
          color
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              originalPrice: true,
              image: true
            }
          }
        }
      });

      // Update cart totals
      const updatedCart = await prisma.cart.update({
        where: { id: cart.id },
        data: {
          subtotal: Number(cart.subtotal) + (Number(product.price) * quantity),
          total: Number(cart.total) + (Number(product.price) * quantity),
          estimatedLoyaltyPoints: cart.estimatedLoyaltyPoints + (product.loyaltyPoints * quantity)
        }
      });

      res.status(201).json({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price),
          originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : null,
          image: item.product.image
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to add item to cart', 500);
    }
  },

  // Update cart item
  async updateItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const { quantity, size, color } = req.body;

      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id }
      });

      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      const cartItem = await prisma.cartItem.findUnique({
        where: { id: Number(id) },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              originalPrice: true,
              image: true,
              loyaltyPoints: true
            }
          }
        }
      });

      if (!cartItem || cartItem.cartId !== cart.id) {
        throw new AppError('Item not found in cart', 404);
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: Number(id) },
        data: {
          quantity,
          size,
          color
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              originalPrice: true,
              image: true,
              loyaltyPoints: true
            }
          }
        }
      });

      // Update cart totals
      const priceDiff = (Number(updatedItem.product.price) * quantity) - (Number(cartItem.product.price) * cartItem.quantity);
      const pointsDiff = (updatedItem.product.loyaltyPoints * quantity) - (cartItem.product.loyaltyPoints * cartItem.quantity);

      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          subtotal: Number(cart.subtotal) + priceDiff,
          total: Number(cart.total) + priceDiff,
          estimatedLoyaltyPoints: cart.estimatedLoyaltyPoints + pointsDiff
        }
      });

      res.json({
        id: updatedItem.id,
        productId: updatedItem.productId,
        quantity: updatedItem.quantity,
        size: updatedItem.size,
        color: updatedItem.color,
        product: {
          id: updatedItem.product.id,
          name: updatedItem.product.name,
          price: Number(updatedItem.product.price),
          originalPrice: updatedItem.product.originalPrice ? Number(updatedItem.product.originalPrice) : null,
          image: updatedItem.product.image,
          loyaltyPoints: updatedItem.product.loyaltyPoints
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update cart item', 500);
    }
  },

  // Remove item from cart
  async removeItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;

      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id }
      });

      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      const cartItem = await prisma.cartItem.findUnique({
        where: { id: Number(id) },
        include: {
          product: true
        }
      });

      if (!cartItem || cartItem.cartId !== cart.id) {
        throw new AppError('Item not found in cart', 404);
      }

      await prisma.cartItem.delete({
        where: { id: Number(id) }
      });

      // Update cart totals
      const priceDiff = Number(cartItem.product.price) * cartItem.quantity;
      const pointsDiff = cartItem.product.loyaltyPoints * cartItem.quantity;

      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          subtotal: Number(cart.subtotal) - priceDiff,
          total: Number(cart.total) - priceDiff,
          estimatedLoyaltyPoints: cart.estimatedLoyaltyPoints - pointsDiff
        }
      });

      res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to remove item from cart', 500);
    }
  },

  // Clear cart
  async clearCart(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id }
      });

      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          subtotal: 0,
          total: 0,
          estimatedLoyaltyPoints: 0
        }
      });

      res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to clear cart', 500);
    }
  }
}; 