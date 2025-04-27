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
      throw new AppError(404, 'Coupon not found');
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
      throw new AppError(409, 'Coupon code already exists');
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
      throw new AppError(404, 'Coupon not found');
    }

    if (coupon.isUsed) {
      throw new AppError(400, 'Coupon has already been used');
    }

    if (new Date() > new Date(coupon.expiresAt)) {
      throw new AppError(400, 'Coupon has expired');
    }

    const discountAmount = coupon.type === 'Percentage'
      ? (orderAmount * coupon.value) / 100
      : coupon.value;

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
}; 