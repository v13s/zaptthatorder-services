import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { sendEmail } from '../utils/emailService';

const prisma = new PrismaClient();

interface OrderWithRelations {
  id: string;
  userId: string;
  status: string;
  total: number;
  items: OrderItemWithProduct[];
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItemWithProduct {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    price: number;
  };
}

export const orderController = {
  async getOrderHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const orders = await prisma.order.findMany({
        where: { userId },
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
          id: orderId,
          userId
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
          id: orderId,
          userId
        }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status !== 'PENDING') {
        throw new AppError('Cannot cancel order in current status', 400);
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
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
          id: orderId,
          userId
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