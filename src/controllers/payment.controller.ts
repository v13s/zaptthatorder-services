import { Request, Response } from 'express';
import { PrismaClient, PaymentMethod as PrismaPaymentMethod } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface PaymentMethod {
  id: number;
  name: string;
  icon: string;
  description: string;
  isActive: boolean;
}

export const paymentController = {
  getPaymentMethods: async (req: Request, res: Response) => {
    try {
      const methods = await prisma.paymentMethod.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });

      res.json({
        methods: methods.map((method: PrismaPaymentMethod): PaymentMethod => ({
          id: method.id,
          name: method.name,
          icon: method.icon,
          description: method.description,
          isActive: method.isActive
        }))
      });
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
  }
}; 