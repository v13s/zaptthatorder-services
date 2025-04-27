import express from 'express';
import { loyaltyController } from '../controllers/loyalty.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Get loyalty status
router.get('/status', authenticate, loyaltyController.getLoyaltyStatus);

// Get loyalty banner data
router.get('/banner', authenticate, loyaltyController.getLoyaltyBanner);

// Get loyalty transactions
router.get('/transactions', authenticate, loyaltyController.getLoyaltyTransactions);

// Get available coupons
router.get('/coupons', authenticate, loyaltyController.getAvailableCoupons);

// Loyalty tier routes
router.get('/tiers', loyaltyController.getAllTiers);
router.get('/tiers/:name', loyaltyController.getTierByName);
router.get('/calculate-tier', loyaltyController.calculateTier);

// Loyalty transaction routes
router.post('/transactions', loyaltyController.createTransaction);
router.patch('/transactions/:id/status', loyaltyController.updateTransactionStatus);

// New routes
router.get('/rewards', authenticate, loyaltyController.getLoyaltyRewards);
router.post('/redeem', authenticate, loyaltyController.redeemPoints);
router.post('/enroll', authenticate, loyaltyController.enrollInLoyalty);

export const loyaltyRoutes = router; 