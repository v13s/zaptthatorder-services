import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface UserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  joinLoyalty?: boolean;
}

interface SocialUserInput {
  name: string;
  email: string;
  provider: 'github' | 'facebook';
  providerId: string;
  phone?: string;
  joinLoyalty?: boolean;
}

export const authService = {
  async registerUser(input: UserInput) {
    const { name, email, password, phone, joinLoyalty } = input;

    return await prisma.$transaction(async (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
      // Check if user already exists
      const existingUser = await tx.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new AppError('Email already registered', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          isLoyaltyMember: joinLoyalty || false,
          socialLinks: {}
        }
      });

      // If user opted for loyalty program
      if (joinLoyalty) {
        // Check if we have any loyalty tiers
        const defaultTier = await tx.loyaltyTier.findFirst({
          where: { name: 'Bronze' }
        });

        // Create default tier if it doesn't exist
        if (!defaultTier) {
          await tx.loyaltyTier.create({
            data: {
              name: 'Bronze',
              requiredPoints: 0,
              multiplier: 1.0,
              perks: {
                create: [
                  { perk: 'Earn 1 point per dollar spent' },
                  { perk: 'Birthday bonus points' }
                ]
              }
            }
          });
        }

        // Create loyalty enrollment
        await tx.loyaltyEnrollment.create({
          data: {
            userId: user.id,
            tierName: 'Bronze'
          }
        });

        // Create initial loyalty transaction
        await tx.loyaltyTransaction.create({
          data: {
            userId: user.id,
            date: new Date(),
            type: 'Earned',
            points: 0,
            description: 'Initial enrollment',
            status: 'Completed'
          }
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isLoyaltyMember: user.isLoyaltyMember
        },
        token
      };
    });
  },

  async loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true,
        isLoyaltyMember: true,
        socialLinks: true
      }
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // For social login users, password is not required
    if (Object.keys(user.socialLinks || {}).length > 0) {
      throw new AppError('Please use social login', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password || '');
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isLoyaltyMember: user.isLoyaltyMember
      },
      token
    };
  },

  async socialLogin(input: SocialUserInput) {
    const { name, email, provider, providerId, phone, joinLoyalty } = input;

    // Check if user exists with this email
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          isLoyaltyMember: joinLoyalty || false,
          socialLinks: {
            [provider]: providerId
          }
        }
      });

      // If user opted for loyalty program, create enrollment
      if (joinLoyalty) {
        await prisma.loyaltyTransaction.create({
          data: {
            userId: user.id,
            date: new Date(),
            type: 'Earned',
            points: 0,
            description: 'Initial enrollment',
            status: 'Completed'
          }
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isLoyaltyMember: user.isLoyaltyMember
      },
      token
    };
  },

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // TODO: Send email with reset token
    // For now, we'll just return the token
    return {
      message: 'Password reset email sent',
      resetToken
    };
  },

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: decoded.userId },
        data: { socialLinks: { password: hashedPassword } }
      });

      return {
        message: 'Password reset successful'
      };
    } catch (error) {
      throw new AppError('Invalid or expired reset token', 400);
    }
  }
}; 