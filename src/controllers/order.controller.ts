import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { sendEmail } from '../utils/emailService';

const prisma = new PrismaClient();

interface OrderWithRelations {
  id: number;
  userId: number;
  status: string;
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  createdAt: Date;
  items: OrderItemWithProduct[];
}

interface OrderItemWithProduct {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
  };
}

export const orderController = {
  async createOrder(req: Request, res: Response) {
    try {
      const { items, shippingAddress, paymentMethod } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Validate items
      if (!Array.isArray(items) || items.length === 0) {
        throw new AppError('Order must contain at least one item', 400);
      }

      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create order with items in a transaction
      const order = await prisma.$transaction(async (tx) => {
        // Create the order
        const newOrder = await tx.order.create({
          data: {
            userId: userId,
            status: 'pending',
            totalAmount: totalAmount,
            shippingAddress,
            paymentMethod,
          },
        });

        // Create order items
        const orderItems = await Promise.all(
          items.map((item) =>
            tx.orderItem.create({
              data: {
                orderId: newOrder.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              },
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    image: true,
                  },
                },
              },
            })
          )
        );

        return {
          ...newOrder,
          items: orderItems,
        };
      });

      // Send order confirmation email
      await sendEmail({
        to: req.user?.email || '',
        subject: 'Order Confirmation',
        html: `<h1>Thank you for your order!</h1><p>Your order ID is ${order.id}.</p>`,
      });

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        console.error('Order creation error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create order',
        });
      }
    }
  },

  async getOrderHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const orders = await prisma.order.findMany({
        where: { userId: userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json(orders);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  },

  async getOrderDetails(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const order = await prisma.order.findFirst({
        where: {
          id: parseInt(orderId),
          userId: userId
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      res.json(order);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  },

  async cancelOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const order = await prisma.order.findFirst({
        where: {
          id: parseInt(orderId),
          userId: userId
        }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status !== 'PENDING') {
        throw new AppError('Cannot cancel order in current status', 400);
      }

      const updatedOrder = await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { status: 'CANCELLED' }
      });

      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  },

  async sendOrderConfirmation(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const order = await prisma.order.findFirst({
        where: {
          id: parseInt(orderId),
          userId: userId
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      await sendEmail({
        to: req.user?.email || '',
        subject: 'Order Confirmation',
        template: 'order-confirmation',
        data: { order }
      });

      res.json({ message: 'Order confirmation email sent' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }
}; 