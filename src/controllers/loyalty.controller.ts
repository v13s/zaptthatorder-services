import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { Decimal } from '@prisma/client/runtime/library';

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
  perks: string[];
}

interface LoyaltyTierPerk {
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
        where: { userId },
        include: {
          tier: {
            include: {
              perks: true
            }
          }
        }
      });

      if (!enrollment) {
        throw new AppError('User not enrolled in loyalty program', 404);
      }

      const transactions = await prisma.loyaltyTransaction.findMany({
        where: { userId }
      });

      const totalPoints = calculateTotalPoints(transactions);

      const nextTier = await prisma.loyaltyTier.findFirst({
        where: {
          requiredPoints: {
            gt: enrollment.tier.requiredPoints
          }
        },
        orderBy: {
          requiredPoints: 'asc'
        }
      });

      const status: LoyaltyStatus = {
        tier: {
          name: enrollment.tier.name,
          multiplier: Number(enrollment.tier.multiplier),
          perks: enrollment.tier.perks.map((p: { perk: string }) => p.perk)
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
        where: { userId: Number(userId) },
        orderBy: { date: 'desc' }
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

  getAllTiers: async (req: Request, res: Response) => {
    try {
      const tiers = await prisma.loyaltyTier.findMany({
        include: {
          perks: true
        },
        orderBy: {
          requiredPoints: 'asc'
        }
      });

      const formattedTiers: LoyaltyTier[] = tiers.map((tier: { name: string; requiredPoints: number; multiplier: Decimal; perks: { perk: string }[] }) => ({
        name: tier.name,
        requiredPoints: tier.requiredPoints,
        multiplier: Number(tier.multiplier),
        perks: tier.perks.map((p: { perk: string }) => p.perk)
      }));

      res.json(formattedTiers);
    } catch (error) {
      throw new AppError('Failed to get loyalty tiers', 500);
    }
  },

  getTierByName: async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const tier = await prisma.loyaltyTier.findUnique({
        where: { name },
        include: {
          perks: true
        }
      });

      if (!tier) {
        throw new AppError('Tier not found', 404);
      }

      const formattedTier: LoyaltyTier = {
        name: tier.name,
        requiredPoints: tier.requiredPoints,
        multiplier: Number(tier.multiplier),
        perks: tier.perks.map((p: { perk: string }) => p.perk)
      };

      res.json(formattedTier);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get tier details', 500);
    }
  },

  calculateTier: async (req: Request, res: Response) => {
    try {
      const points = Number(req.query.points);
      if (isNaN(points)) {
        throw new AppError('Invalid points value', 400);
      }

      const tiers = await prisma.loyaltyTier.findMany({
        orderBy: {
          requiredPoints: 'desc'
        }
      });

      const currentTier = tiers.find((tier: { requiredPoints: number }) => points >= tier.requiredPoints);
      const nextTier = tiers.find((tier: { requiredPoints: number }) => tier.requiredPoints > points);

      if (!currentTier) {
        throw new AppError('No tier found for the given points', 404);
      }

      res.json({
        tier: currentTier.name,
        nextTier: nextTier?.name,
        pointsToNextTier: nextTier ? nextTier.requiredPoints - points : 0
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to calculate tier', 500);
    }
  },

  createTransaction: async (req: Request, res: Response) => {
    try {
      const { userId, type, points, description } = req.body;

      if (!['Earned', 'Redeemed', 'Cancelled', 'Expired'].includes(type)) {
        throw new AppError('Invalid transaction type', 400);
      }

      const transaction = await prisma.loyaltyTransaction.create({
        data: {
          userId: Number(userId),
          type,
          points: Number(points),
          description,
          status: 'Completed',
          date: new Date()
        }
      });

      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create transaction', 500);
    }
  },

  updateTransactionStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['Pending', 'Completed', 'Cancelled', 'Failed'].includes(status)) {
        throw new AppError('Invalid status', 400);
      }

      const transaction = await prisma.loyaltyTransaction.update({
        where: { id: Number(id) },
        data: { status }
      });

      res.json(transaction);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update transaction status', 500);
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
  },

  createTier: async (req: Request, res: Response) => {
    try {
      const { name, requiredPoints, multiplier, perks } = req.body;

      // Check if tier with same name already exists
      const existingTier = await prisma.loyaltyTier.findUnique({
        where: { name }
      });

      if (existingTier) {
        throw new AppError('Tier with this name already exists', 409);
      }

      // Create tier and its perks in a transaction
      const result = await prisma.$transaction(async (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
        // Create the tier
        const tier = await tx.loyaltyTier.create({
          data: {
            name,
            requiredPoints,
            multiplier
          }
        });

        // Create the perks
        if (perks && perks.length > 0) {
          await tx.loyaltyTierPerk.createMany({
            data: perks.map((perk: string) => ({
              tierName: name,
              perk
            }))
          });
        }

        return tier;
      });

      res.status(201).json({
        name: result.name,
        requiredPoints: result.requiredPoints,
        multiplier: Number(result.multiplier),
        perks: perks || []
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create loyalty tier', 500);
    }
  },

  updateTier: async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const { requiredPoints, multiplier, perks } = req.body;

      if (!requiredPoints && !multiplier && !perks) {
        throw new AppError('No fields to update', 400);
      }

      // Check if tier exists
      const existingTier = await prisma.loyaltyTier.findUnique({
        where: { name },
        include: { perks: true }
      });

      if (!existingTier) {
        throw new AppError('Tier not found', 404);
      }

      // Update tier
      const updatedTier = await prisma.loyaltyTier.update({
        where: { name },
        data: {
          requiredPoints,
          multiplier,
          perks: perks ? {
            deleteMany: {},
            create: perks.map((perk: string) => ({ perk }))
          } : undefined
        },
        include: {
          perks: true
        }
      });

      res.status(200).json({
        message: 'Tier updated successfully',
        tier: {
          name: updatedTier.name,
          requiredPoints: updatedTier.requiredPoints,
          multiplier: Number(updatedTier.multiplier),
          perks: updatedTier.perks.map((p: LoyaltyTierPerk) => p.perk)
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update tier', 500);
    }
  },

  deleteTier: async (req: Request, res: Response) => {
    try {
      const { name } = req.params;

      // Check if tier exists
      const existingTier = await prisma.loyaltyTier.findUnique({
        where: { name }
      });

      if (!existingTier) {
        throw new AppError('Tier not found', 404);
      }

      // Check if tier is in use
      const enrollments = await prisma.loyaltyEnrollment.findMany({
        where: { tierName: name }
      });

      if (enrollments.length > 0) {
        throw new AppError('Cannot delete tier that is in use', 400);
      }

      // Delete tier and its perks
      await prisma.loyaltyTier.delete({
        where: { name }
      });

      res.status(200).json({
        message: 'Tier deleted successfully'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete tier', 500);
    }
  }
}; 