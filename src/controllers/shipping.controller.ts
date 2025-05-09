import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface ShippingOption {
  id: number;
  name: string;
  price: number;
  estimatedDays: number;
  description: string;
}

type PrismaShippingOption = {
  id: number;
  name: string;
  price: any;
  estimatedDays: number;
  description: string;
  isActive: boolean;
  createdAt: Date;
};

export const shippingController = {
  getShippingOptions: async (req: Request, res: Response) => {
    try {
      const options = await prisma.shippingOption.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' }
      });

      res.json({
        options: options.map((option: PrismaShippingOption): ShippingOption => ({
          id: option.id,
          name: option.name,
          price: Number(option.price),
          estimatedDays: option.estimatedDays,
          description: option.description
        }))
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get shipping options', 500);
    }
  },

  calculateShipping: async (req: Request, res: Response) => {
    try {
      const { optionId, address } = req.body;

      const option = await prisma.shippingOption.findUnique({
        where: { id: Number(optionId) }
      });

      if (!option) {
        throw new AppError('Shipping option not found', 404);
      }

      // In a real application, you would calculate shipping based on:
      // 1. Shipping option
      // 2. Delivery address
      // 3. Package weight/size
      // 4. Special handling requirements
      // For now, we'll just return the base price

      res.json({
        price: Number(option.price),
        estimatedDays: option.estimatedDays,
        name: option.name
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to calculate shipping', 500);
    }
  },

  trackShipment: async (req: Request, res: Response) => {
    try {
      const { trackingNumber } = req.params;

      // In a real application, you would:
      // 1. Call shipping carrier's API to get tracking info
      // 2. Parse and format the response
      // 3. Return tracking details

      // For now, we'll return mock data
      res.json({
        status: 'In Transit',
        location: 'Local Delivery Facility',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        history: [
          {
            status: 'Order Placed',
            location: 'Online',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            status: 'Picked Up',
            location: 'Warehouse',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            status: 'In Transit',
            location: 'Local Delivery Facility',
            timestamp: new Date().toISOString()
          }
        ]
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to track shipment', 500);
    }
  }
}; 