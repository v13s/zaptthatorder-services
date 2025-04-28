import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export const couponController = {
  // Get all coupons with optional filtering
  async getAllCoupons(req: Request, res: Response) {
    const { isUsed, type } = req.query;

    const filters: any = {};

    if (isUsed !== undefined) filters.isUsed = isUsed === 'true';
    if (type) filters.type = type;

    const coupons = await prisma.coupon.findMany({
      where: filters,
      orderBy: {
        expiresAt: 'asc',
      },
    });

    res.json(coupons);
  },

  // Get a single coupon by code
  async getCouponByCode(req: Request, res: Response) {
    const { code } = req.params;

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    res.json(coupon);
  },

  // Create a new coupon
  async createCoupon(req: Request, res: Response) {
    const { code, value, type, expiresAt } = req.body;

    const existingCoupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (existingCoupon) {
      throw new AppError('Coupon code already exists', 409);
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        value,
        type,
        expiresAt: new Date(expiresAt),
        isUsed: false,
      },
    });

    res.status(201).json(coupon);
  },

  // Validate and apply a coupon
  async validateCoupon(req: Request, res: Response) {
    const { code } = req.params;
    const { orderAmount } = req.body;

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    if (coupon.isUsed) {
      throw new AppError('Coupon has already been used', 400);
    }

    if (new Date() > new Date(coupon.expiresAt)) {
      throw new AppError('Coupon has expired', 400);
    }

    const discountAmount = coupon.type === 'Percentage'
      ? (orderAmount * Number(coupon.value)) / 100
      : Number(coupon.value);

    res.json({
      isValid: true,
      discountAmount,
      finalAmount: orderAmount - discountAmount,
    });
  },

  // Mark a coupon as used
  async markCouponAsUsed(req: Request, res: Response) {
    const { code } = req.params;

    const coupon = await prisma.coupon.update({
      where: { code },
      data: { isUsed: true },
    });

    res.json(coupon);
  },

  // Delete a coupon
  async deleteCoupon(req: Request, res: Response) {
    const { code } = req.params;

    await prisma.coupon.delete({
      where: { code },
    });

    res.status(204).send();
  },

  // Get loyalty coupons for a user
  async getLoyaltyCoupons(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const coupons = await prisma.coupon.findMany({
      where: {
        code: {
          startsWith: 'LOYALTY-'
        },
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        expiresAt: 'asc'
      }
    });

    res.json(coupons);
  }
}; 