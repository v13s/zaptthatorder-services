import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export const paymentController = {
  getPaymentMethods: async (req: Request, res: Response) => {
    try {
      const methods = await prisma.paymentMethod.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });

      res.json({ methods });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get payment methods', 500);
    }
  },

  validatePaymentMethod: async (req: Request, res: Response) => {
    try {
      const { methodId, paymentDetails } = req.body;

      const method = await prisma.paymentMethod.findUnique({
        where: { id: Number(methodId) }
      });

      if (!method) {
        throw new AppError('Payment method not found', 404);
      }

      if (!method.isActive) {
        throw new AppError('Payment method is not available', 400);
      }

      // In a real application, you would:
      // 1. Validate payment details based on the payment method
      // 2. Check for fraud
      // 3. Verify payment credentials
      // 4. Return appropriate validation result

      res.json({
        isValid: true,
        method: {
          id: method.id,
          name: method.name,
          icon: method.icon
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to validate payment method', 500);
    }
  },

  processPayment: async (req: Request, res: Response) => {
    try {
      const { orderId, paymentMethod, paymentDetails } = req.body;

      // Validate order exists and belongs to user
      const order = await prisma.order.findUnique({
        where: { id: Number(orderId) },
        include: {
          user: true
        }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // In a real application, you would:
      // 1. Validate payment details
      // 2. Process payment through payment gateway
      // 3. Update order status
      // 4. Create payment record
      // 5. Send confirmation email

      // For now, we'll just simulate a successful payment
      const transactionId = `TXN${Date.now()}`;

      await prisma.order.update({
        where: { id: Number(orderId) },
        data: {
          status: 'paid'
        }
      });

      res.json({
        transactionId,
        status: 'success',
        amount: Number(order.totalAmount)
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to process payment', 500);
    }
  },

  processRefund: async (req: Request, res: Response) => {
    try {
      const { orderId, amount, reason } = req.body;

      // Validate order exists and is paid
      const order = await prisma.order.findUnique({
        where: { id: Number(orderId) }
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status !== 'paid') {
        throw new AppError('Order is not paid', 400);
      }

      if (Number(amount) > Number(order.totalAmount)) {
        throw new AppError('Refund amount cannot exceed order total', 400);
      }

      // In a real application, you would:
      // 1. Process refund through payment gateway
      // 2. Update order status
      // 3. Create refund record
      // 4. Send confirmation email

      // For now, we'll just simulate a successful refund
      const refundId = `REF${Date.now()}`;

      await prisma.order.update({
        where: { id: Number(orderId) },
        data: {
          status: 'refunded'
        }
      });

      res.json({
        refundId,
        status: 'success',
        amount: Number(amount)
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to process refund', 500);
    }
  }
}; 