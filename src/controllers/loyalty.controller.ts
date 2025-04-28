import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface LoyaltyStatus {
  tier: {
    name: string;
    multiplier: number;
    perks: string[];
  };
  points: {
    available: number;
    total: number;
  };
  nextTier?: {
    name: string;
    requiredPoints: number;
    multiplier: number;
  };
}

interface LoyaltyTransaction {
  id: number;
  userId: number;
  date: Date;
  type: string;
  points: number;
  description: string;
  status: string;
  createdAt: Date;
}

interface LoyaltyTier {
  name: string;
  requiredPoints: number;
  multiplier: number;
}

interface LoyaltyTierPerk {
  tierName: string;
  perk: string;
}

interface LoyaltyReward {
  id: number;
  name: string;
  pointsRequired: number;
  description: string;
  validityDays: number;
  type: string;
  value: number;
  isActive: boolean;
  createdAt: Date;
}

interface PrismaLoyaltyReward {
  id: number;
  name: string;
  points_required: number;
  description: string;
  validity_days: number;
  type: string;
  value: number;
  is_active: boolean;
}

interface PrismaLoyaltyTier {
  name: string;
  multiplier: { toNumber: () => number };
  required_points: number;
}

interface PrismaLoyaltyTransaction {
  id: number;
  userId: number;
  type: 'Earned' | 'Redeemed' | 'Cancelled' | 'Expired';
  points: number;
  description: string;
  status: string;
  date: Date;
}

interface LoyaltyEnrollment {
  userId: number;
  tierName: string;
  enrolledAt: Date;
}

interface PrismaLoyaltyCoupon {
  id: number;
  code: string;
  value: number;
  type: string;
  expires_at: Date;
}

const calculateTotalPoints = (transactions: LoyaltyTransaction[]): number => {
  return transactions.reduce((sum: number, t: LoyaltyTransaction) => {
    if (t.type === 'Earned') {
      return sum + t.points;
    } else if (t.type === 'Redeemed' || t.type === 'Cancelled' || t.type === 'Expired') {
      return sum - t.points;
    }
    return sum;
  }, 0);
};

export const loyaltyController = {
  getLoyaltyStatus: async (req: Request, res: Response): Promise<LoyaltyStatus> => {
    try {
      const userId = req.user?.id ? Number(req.user.id) : null;
      if (!userId || isNaN(userId)) {
        throw new AppError('User not authenticated', 401);
      }

      const enrollment = await prisma.loyaltyEnrollment.findUnique({
        where: { userId }
      });

      if (!enrollment) {
        throw new AppError('User not enrolled in loyalty program', 404);
      }

      const tier = await prisma.loyaltyTier.findUnique({
        where: { name: enrollment.tierName },
        select: {
          name: true,
          requiredPoints: true,
          multiplier: true
        }
      });

      if (!tier) {
        throw new AppError('Tier not found', 404);
      }

      const perks = await prisma.loyaltyTierPerk.findMany({
        where: { tierName: tier.name },
        select: {
          tierName: true,
          perk: true
        }
      });

      const transactions = await prisma.loyaltyTransaction.findMany({
        where: { userId },
        select: {
          id: true,
          userId: true,
          type: true,
          points: true,
          description: true,
          status: true,
          date: true,
          createdAt: true
        }
      });

      const mappedTransactions = transactions.map((t) => ({
        id: t.id,
        userId: t.userId,
        type: t.type,
        points: t.points,
        description: t.description,
        status: t.status,
        date: t.date,
        createdAt: t.createdAt
      }));

      const totalPoints = calculateTotalPoints(mappedTransactions);

      const nextTier = await prisma.loyaltyTier.findFirst({
        where: {
          requiredPoints: {
            gt: tier.requiredPoints
          }
        },
        orderBy: {
          requiredPoints: 'asc'
        },
        select: {
          name: true,
          requiredPoints: true,
          multiplier: true
        }
      });

      const status: LoyaltyStatus = {
        tier: {
          name: tier.name,
          multiplier: Number(tier.multiplier),
          perks: perks.map((p) => p.perk)
        },
        points: {
          available: totalPoints,
          total: totalPoints
        }
      };

      if (nextTier) {
        status.nextTier = {
          name: nextTier.name,
          requiredPoints: nextTier.requiredPoints,
          multiplier: Number(nextTier.multiplier)
        };
      }

      res.status(200).json(status);
      return status;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get loyalty status', 500);
    }
  },

  getLoyaltyBanner: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const status = await loyaltyController.getLoyaltyStatus(req, res);
      
      res.json({
        title: `Welcome to ${status.tier.name} Tier!`,
        description: `You have ${status.points.available} points available.`,
        ctaText: status.nextTier ? `Earn ${status.nextTier.requiredPoints - status.points.available} more points to reach ${status.nextTier.name} Tier` : 'You have reached the highest tier!',
        ctaLink: status.nextTier ? '/products' : null,
        pointsToNextTier: status.nextTier ? status.nextTier.requiredPoints - status.points.available : null,
        currentTier: status.tier.name,
        nextTier: status.nextTier?.name
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get loyalty banner', 500);
    }
  },

  getLoyaltyTransactions: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const transactions = await prisma.loyaltyTransaction.findMany({
        where: { userId },
        orderBy: {
          date: 'desc'
        }
      });

      res.json(transactions);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get loyalty transactions', 500);
    }
  },

  getLoyaltyCoupons: async (req: Request, res: Response) => {
    try {
      const coupons = await prisma.coupon.findMany({
        where: {
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      res.json(coupons);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get loyalty coupons', 500);
    }
  },

  getLoyaltyRewards: async (req: Request, res: Response) => {
    try {
      const rewards = await prisma.loyaltyReward.findMany({
        where: {
          isActive: true
        }
      });

      res.json(rewards);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get loyalty rewards', 500);
    }
  },

  redeemReward: async (req: Request, res: Response) => {
    try {
      const { rewardId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Get reward details
      const reward = await prisma.loyaltyReward.findUnique({
        where: { id: parseInt(rewardId) }
      });

      if (!reward) {
        throw new AppError('Reward not found', 404);
      }

      // Get user's current points
      const transactions = await prisma.loyaltyTransaction.findMany({
        where: { userId }
      });

      const totalPoints = calculateTotalPoints(transactions);

      if (totalPoints < reward.pointsRequired) {
        throw new AppError('Insufficient points', 400);
      }

      // Create redemption transaction
      const transaction = await prisma.loyaltyTransaction.create({
        data: {
          userId,
          type: 'Redeemed',
          points: reward.pointsRequired,
          description: `Redeemed ${reward.name}`,
          status: 'Completed',
          date: new Date()
        }
      });

      res.json({
        success: true,
        transaction,
        reward
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to redeem reward', 500);
    }
  },

  enrollInLoyalty: async (req: Request, res: Response) => {
    try {
      const userId = Number(req.user?.id);
      if (!userId || isNaN(userId)) {
        throw new AppError('User not authenticated', 401);
      }

      // Check if user is already enrolled
      const existingEnrollment = await prisma.loyaltyEnrollment.findUnique({
        where: { userId: userId }
      });

      if (existingEnrollment) {
        throw new AppError('User already enrolled in loyalty program', 400);
      }

      // Get base tier
      const baseTier = await prisma.loyaltyTier.findFirst({
        where: { requiredPoints: 0 }
      });

      if (!baseTier) {
        throw new AppError('Base tier not found', 500);
      }

      // Create enrollment
      await prisma.loyaltyEnrollment.create({
        data: {
          userId: userId,
          tierName: baseTier.name,
          enrolledAt: new Date()
        }
      });

      // Get tier perks
      const perks = await prisma.loyaltyTierPerk.findMany({
        where: { tierName: baseTier.name }
      });

      res.json({
        success: true,
        message: 'Successfully enrolled in loyalty program',
        tier: {
          name: baseTier.name,
          multiplier: Number(baseTier.multiplier),
          perks: perks.map((p: LoyaltyTierPerk) => p.perk)
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to enroll in loyalty program', 500);
    }
  },

  async getAllTiers(req: Request, res: Response) {
    try {
      const tiers = await prisma.loyaltyTier.findMany({
        include: {
          perks: true
        }
      });

      res.json(tiers);
    } catch (error) {
      console.error('Error getting loyalty tiers:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async getTierByName(req: Request, res: Response) {
    try {
      const { name } = req.params;
      const tier = await prisma.loyaltyTier.findUnique({
        where: { name },
        include: {
          perks: true
        }
      });

      if (!tier) {
        return res.status(404).json({ message: 'Tier not found' });
      }

      res.json(tier);
    } catch (error) {
      console.error('Error getting loyalty tier:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async calculateTier(req: Request, res: Response) {
    try {
      const { points } = req.body;
      const tiers = await prisma.loyaltyTier.findMany({
        orderBy: {
          requiredPoints: 'asc'
        }
      });

      let currentTier = null;
      for (const tier of tiers) {
        if (points >= tier.requiredPoints) {
          currentTier = tier;
        } else {
          break;
        }
      }

      res.json({ tier: currentTier });
    } catch (error) {
      console.error('Error calculating tier:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async createTransaction(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { type, points, description, status } = req.body;

      const transaction = await prisma.loyaltyTransaction.create({
        data: {
          userId: Number(userId),
          date: new Date(),
          type,
          points,
          description,
          status
        }
      });

      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create loyalty transaction', 500);
    }
  },

  async updateTransactionStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const transaction = await prisma.loyaltyTransaction.update({
        where: { id: Number(id) },
        data: { status }
      });

      res.json(transaction);
    } catch (error) {
      console.error('Error updating transaction status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getAvailableCoupons: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id ? Number(req.user.id) : null;
      if (!userId || isNaN(userId)) {
        throw new AppError('User not authenticated', 401);
      }

      const coupons = await prisma.coupon.findMany({
        where: {
          userId,
          expiresAt: {
            gt: new Date()
          },
          isUsed: false
        },
        select: {
          id: true,
          code: true,
          value: true,
          type: true,
          expiresAt: true
        }
      });

      res.status(200).json(coupons);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get available coupons', 500);
    }
  },

  redeemPoints: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id ? Number(req.user.id) : null;
      if (!userId || isNaN(userId)) {
        throw new AppError('User not authenticated', 401);
      }

      const { points, rewardId } = req.body;
      
      if (!points || !rewardId) {
        throw new AppError('Points and reward ID are required', 400);
      }

      // Get user's current points
      const status = await loyaltyController.getLoyaltyStatus(req, res);
      
      if (status.points.available < points) {
        throw new AppError('Insufficient points', 400);
      }

      // Get the reward details
      const reward = await prisma.loyaltyReward.findUnique({
        where: { id: rewardId }
      });

      if (!reward) {
        throw new AppError('Reward not found', 404);
      }

      if (!reward.isActive) {
        throw new AppError('Reward is not active', 400);
      }

      // Create transaction for points redemption
      await prisma.loyaltyTransaction.create({
        data: {
          userId,
          type: 'Redeemed',
          points: points,
          description: `Redeemed ${points} points for reward: ${reward.name}`,
          status: 'Completed',
          date: new Date()
        }
      });

      // Create coupon for the reward
      const coupon = await prisma.coupon.create({
        data: {
          code: `LOYALTY-${Date.now()}`,
          value: reward.value,
          type: reward.type,
          expiresAt: new Date(Date.now() + reward.validityDays * 24 * 60 * 60 * 1000),
          isUsed: false
        }
      });

      res.status(200).json({
        message: 'Points redeemed successfully',
        coupon: {
          code: coupon.code,
          value: coupon.value,
          type: coupon.type,
          expiresAt: coupon.expiresAt
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to redeem points', 500);
    }
  }
}; 