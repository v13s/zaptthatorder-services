import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
  };
}

interface CartItemResponse {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
  size: string | null;
  color: string | null;
}

export const cartController = {
  getCartSummary: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!cart) {
        return res.json({
          itemCount: 0,
          subtotal: 0,
          estimatedPoints: 0
        });
      }

      const subtotal = cart.items.reduce((sum: number, item) => {
        return sum + (Number(item.product.price) * item.quantity);
      }, 0);

      const estimatedPoints = cart.items.reduce((sum: number, item) => {
        return sum + (item.product.loyaltyPoints * item.quantity);
      }, 0);

      res.json({
        itemCount: cart.items.length,
        subtotal,
        estimatedPoints
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get cart summary', 500);
    }
  },

  getCartItems: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!cart) {
        return res.json({ items: [] });
      }

      res.json({
        items: cart.items.map((item): CartItemResponse => ({
          id: item.id,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: Number(item.product.price),
            image: item.product.imageUrl
          },
          quantity: item.quantity,
          size: item.size,
          color: item.color
        }))
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get cart items', 500);
    }
  },

  addCartItem: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { productId, quantity, size, color } = req.body;

      // Validate product exists and has stock
      const product = await prisma.product.findUnique({
        where: { id: Number(productId) }
      });

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      if (product.stock < quantity) {
        throw new AppError(`Only ${product.stock} items available in stock`, 400);
      }

      // Get or create cart
      let cart = await prisma.cart.findUnique({
        where: { userId }
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            userId
          }
        });
      }

      // Check if item already exists in cart
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: Number(productId),
          size: size || null,
          color: color || null
        }
      });

      if (existingItem) {
        // Update quantity if item exists
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          throw new AppError(`Only ${product.stock} items available in stock`, 400);
        }

        const updatedItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
          include: { product: true }
        });

        return res.json({
          id: updatedItem.id,
          product: {
            id: updatedItem.product.id,
            name: updatedItem.product.name,
            price: Number(updatedItem.product.price),
            image: updatedItem.product.imageUrl
          },
          quantity: updatedItem.quantity,
          size: updatedItem.size,
          color: updatedItem.color
        });
      }

      // Add new item to cart
      const cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: Number(productId),
          quantity,
          size,
          color
        },
        include: {
          product: true
        }
      });

      res.status(201).json({
        id: cartItem.id,
        product: {
          id: cartItem.product.id,
          name: cartItem.product.name,
          price: Number(cartItem.product.price),
          image: cartItem.product.imageUrl
        },
        quantity: cartItem.quantity,
        size: cartItem.size,
        color: cartItem.color
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to add item to cart', 500);
    }
  },

  updateCartItem: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { id } = req.params;
      const { quantity, size, color } = req.body;

      const cart = await prisma.carts.findUnique({
        where: { user_id: userId }
      });

      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      const cartItem = await prisma.cart_items.update({
        where: {
          id: Number(id),
          cart_id: cart.id
        },
        data: {
          quantity,
          size,
          color
        },
        include: {
          product: true
        }
      });

      res.json({
        id: cartItem.id,
        product: {
          id: cartItem.product.id,
          name: cartItem.product.name,
          price: cartItem.product.price,
          image: cartItem.product.image_url
        },
        quantity: cartItem.quantity,
        size: cartItem.size,
        color: cartItem.color
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update cart item', 500);
    }
  },

  removeCartItem: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { id } = req.params;

      const cart = await prisma.carts.findUnique({
        where: { user_id: userId }
      });

      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      await prisma.cart_items.delete({
        where: {
          id: Number(id),
          cart_id: cart.id
        }
      });

      res.json({ message: 'Item removed from cart' });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to remove cart item', 500);
    }
  },

  clearCart: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const cart = await prisma.carts.findUnique({
        where: { user_id: userId }
      });

      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      await prisma.cart_items.deleteMany({
        where: { cart_id: cart.id }
      });

      res.json({ message: 'Cart cleared' });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to clear cart', 500);
    }
  }
}; 