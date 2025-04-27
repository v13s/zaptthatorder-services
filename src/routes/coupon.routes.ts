import { Router } from 'express';
import { couponController } from '../controllers/coupon.controller';

const router = Router();

// Get all coupons with optional filtering
router.get('/', couponController.getAllCoupons);

// Get a single coupon by code
router.get('/:code', couponController.getCouponByCode);

// Create a new coupon
router.post('/', couponController.createCoupon);

// Validate and apply a coupon
router.post('/:code/validate', couponController.validateCoupon);

// Mark a coupon as used
router.patch('/:code/use', couponController.markCouponAsUsed);

// Delete a coupon
router.delete('/:code', couponController.deleteCoupon);

export const couponRoutes = router; 