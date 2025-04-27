import { PrismaClient } from '@prisma/client';
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        is_loyalty_member: joinLoyalty || false
      }
    });

    // If user opted for loyalty program, create enrollment
    if (joinLoyalty) {
      await prisma.loyalty_enrollments.create({
        data: {
          user_id: user.id,
          tier_name: 'Bronze', // Default tier
          enrolled_at: new Date()
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isLoyaltyMember: user.is_loyalty_member
      },
      token
    };
  },

  async loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        phone: true,
        is_loyalty_member: true
      }
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isLoyaltyMember: user.is_loyalty_member
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
          is_loyalty_member: joinLoyalty || false,
          social_provider: provider,
          social_provider_id: providerId
        }
      });

      // If user opted for loyalty program, create enrollment
      if (joinLoyalty) {
        await prisma.loyalty_enrollments.create({
          data: {
            user_id: user.id,
            tier_name: 'Bronze',
            enrolled_at: new Date()
          }
        });
      }
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isLoyaltyMember: user.is_loyalty_member
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
        data: { password: hashedPassword }
      });

      return {
        message: 'Password reset successful'
      };
    } catch (error) {
      throw new AppError('Invalid or expired reset token', 400);
    }
  }
}; 