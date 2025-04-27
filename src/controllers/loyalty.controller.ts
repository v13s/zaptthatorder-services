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
    required_points: number;
    multiplier: number;
  };
}

interface LoyaltyTransaction {
  id: number;
  user_id: number;
  type: 'Earned' | 'Redeemed';
  points: number;
  description: string;
  status: string;
  date: Date;
}

interface LoyaltyTier {
  name: string;
  required_points: number;
  multiplier: number;
}

interface LoyaltyTierPerk {
  tier_name: string;
  perk: string;
}

interface LoyaltyReward {
  id: number;
  name: string;
  points_required: number;
  description: string;
  validity_days: number;
  type: string;
  value: number;
  is_active: boolean;
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
  user_id: number;
  type: 'Earned' | 'Redeemed' | 'Cancelled' | 'Expired';
  points: number;
  description: string;
  status: string;
  date: Date;
}

interface LoyaltyEnrollment {
  user_id: number;
  tier_name: string;
  enrolled_at: Date;
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
    return sum + (t.type === 'Earned' ? t.points : -t.points);
  }, 0);
};

export const loyaltyController = {
  getLoyaltyStatus: async (req: Request, res: Response): Promise<LoyaltyStatus> => {
    try {
      const userId = req.user?.id ? Number(req.user.id) : null;
      if (!userId || isNaN(userId)) {
        throw new AppError('User not authenticated', 401);
      }

      const enrollment = await prisma.loyalty_enrollments.findUnique({
        where: { user_id: userId }
      });

      if (!enrollment) {
        throw new AppError('User not enrolled in loyalty program', 404);
      }

      const tier = await prisma.loyalty_tiers.findUnique({
        where: { name: enrollment.tier_name },
        select: {
          name: true,
          required_points: true,
          multiplier: true
        }
      });

      if (!tier) {
        throw new AppError('Tier not found', 404);
      }

      const perks = await prisma.loyalty_tier_perks.findMany({
        where: { tier_name: tier.name },
        select: {
          tier_name: true,
          perk: true
        }
      });

      const transactions = await prisma.loyalty_transactions.findMany({
        where: { user_id: userId },
        select: {
          id: true,
          user_id: true,
          type: true,
          points: true,
          description: true,
          status: true,
          date: true
        }
      });

      const mappedTransactions: LoyaltyTransaction[] = transactions.map((t: PrismaLoyaltyTransaction) => ({
        id: Number(t.id),
        user_id: Number(t.user_id),
        type: t.type as 'Earned' | 'Redeemed',
        points: Number(t.points),
        description: t.description,
        status: t.status,
        date: t.date
      }));

      const totalPoints = calculateTotalPoints(mappedTransactions);

      const nextTier = await prisma.loyalty_tiers.findFirst({
        where: {
          required_points: {
            gt: Number(tier.required_points)
          }
        },
        orderBy: {
          required_points: 'asc'
        },
        select: {
          name: true,
          required_points: true,
          multiplier: true
        }
      });

      const status: LoyaltyStatus = {
        tier: {
          name: tier.name,
          multiplier: Number(tier.multiplier),
          perks: perks.map((p: LoyaltyTierPerk) => p.perk)
        },
        points: {
          available: totalPoints,
          total: totalPoints
        }
      };

      if (nextTier) {
        status.nextTier = {
          name: nextTier.name,
          required_points: Number(nextTier.required_points),
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
        ctaText: status.nextTier ? `Earn ${status.nextTier.required_points - status.points.available} more points to reach ${status.nextTier.name} Tier` : 'You have reached the highest tier!',
        ctaLink: status.nextTier ? '/products' : null,
        pointsToNextTier: status.nextTier ? status.nextTier.required_points - status.points.available : null,
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

      const transactions = await prisma.loyalty_transactions.findMany({
        where: {
          user_id: userId
        },
        orderBy: {
          date: 'desc'
        }
      });

      res.json({
        transactions: transactions.map((t: PrismaLoyaltyTransaction) => ({
          id: t.id,
          date: t.date,
          type: t.type,
          points: t.points,
          description: t.description,
          status: t.status
        }))
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get loyalty transactions', 500);
    }
  },

  getAvailableCoupons: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const coupons = await prisma.coupons.findMany({
        where: {
          is_used: false,
          expires_at: {
            gt: new Date()
          }
        }
      });

      res.json({
        coupons: coupons.map((c: PrismaLoyaltyCoupon) => ({
          id: c.id,
          code: c.code,
          value: c.value,
          type: c.type,
          expiresAt: c.expires_at
        }))
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get available coupons', 500);
    }
  },

  getLoyaltyRewards: async (req: Request, res: Response): Promise<void> => {
    try {
      const rewards = await prisma.loyalty_rewards.findMany({
        where: {
          is_active: true
        },
        orderBy: {
          points_required: 'asc'
        },
        select: {
          id: true,
          name: true,
          points_required: true,
          description: true,
          validity_days: true,
          type: true,
          value: true,
          is_active: true
        }
      });

      const mappedRewards = rewards.map((r: PrismaLoyaltyReward) => ({
        id: Number(r.id),
        name: r.name,
        points: Number(r.points_required),
        description: r.description,
        validity: r.validity_days,
        type: r.type,
        value: Number(r.value),
        is_active: r.is_active
      }));

      res.status(200).json({ rewards: mappedRewards });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get loyalty rewards', 500);
    }
  },

  redeemPoints: async (req: Request, res: Response) => {
    try {
      const userId = Number(req.user?.id);
      if (!userId || isNaN(userId)) {
        throw new AppError('User not authenticated', 401);
      }

      const { rewardId } = req.body;
      if (!rewardId) {
        throw new AppError('Reward ID is required', 400);
      }

      // Get reward details
      const reward = await prisma.loyalty_rewards.findUnique({
        where: { id: Number(rewardId) }
      });

      if (!reward) {
        throw new AppError('Reward not found', 404);
      }

      // Get user's current points
      const transactions = await prisma.loyalty_transactions.findMany({
        where: { user_id: userId }
      });

      const availablePoints = calculateTotalPoints(transactions);

      if (availablePoints < reward.points_required) {
        throw new AppError('Insufficient points', 400);
      }

      // Create redemption transaction
      const transaction = await prisma.loyalty_transactions.create({
        data: {
          user_id: userId,
          type: 'Redeemed',
          points: reward.points_required,
          description: `Redeemed: ${reward.name}`,
          status: 'Completed',
          date: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Points redeemed successfully',
        transaction: {
          id: transaction.id,
          type: transaction.type,
          points: transaction.points,
          description: transaction.description,
          status: transaction.status,
          date: transaction.date
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to redeem points', 500);
    }
  },

  enrollInLoyalty: async (req: Request, res: Response) => {
    try {
      const userId = Number(req.user?.id);
      if (!userId || isNaN(userId)) {
        throw new AppError('User not authenticated', 401);
      }

      // Check if user is already enrolled
      const existingEnrollment = await prisma.loyalty_enrollments.findUnique({
        where: { user_id: userId }
      });

      if (existingEnrollment) {
        throw new AppError('User already enrolled in loyalty program', 400);
      }

      // Get base tier
      const baseTier = await prisma.loyalty_tiers.findFirst({
        where: { required_points: 0 }
      });

      if (!baseTier) {
        throw new AppError('Base tier not found', 500);
      }

      // Create enrollment
      await prisma.loyalty_enrollments.create({
        data: {
          user_id: userId,
          tier_name: baseTier.name,
          enrolled_at: new Date()
        }
      });

      // Get tier perks
      const perks = await prisma.loyalty_tier_perks.findMany({
        where: { tier_name: baseTier.name }
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
          required_points: 'asc'
        }
      });

      let currentTier = null;
      for (const tier of tiers) {
        if (points >= tier.required_points) {
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
      const { user_id, type, points, description } = req.body;
      const transaction = await prisma.loyaltyTransaction.create({
        data: {
          user_id,
          type,
          points,
          description,
          status: 'Pending'
        }
      });

      res.status(201).json(transaction);
    } catch (error) {
      console.error('Error creating loyalty transaction:', error);
      res.status(500).json({ message: 'Internal server error' });
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
  }
}; 