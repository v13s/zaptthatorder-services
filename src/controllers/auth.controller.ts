import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import jwt from 'jsonwebtoken';
import { authService } from '../services/auth.service';

const prisma = new PrismaClient();

export const authController = {
  getAuthStatus: async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.json({
          isAuthenticated: false,
          isLoyaltyMember: false
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          isLoyaltyMember: true
        }
      });

      if (!user) {
        return res.json({
          isAuthenticated: false,
          isLoyaltyMember: false
        });
      }

      res.json({
        isAuthenticated: true,
        isLoyaltyMember: user.isLoyaltyMember,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      throw new AppError('Authentication error', 401);
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await authService.loginUser(email, password);
      res.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Login failed', 500);
    }
  },

  register: async (req: Request, res: Response) => {
    try {
      const { name, email, password, phone, joinLoyalty } = req.body;
      const result = await authService.registerUser({
        name,
        email,
        password,
        phone,
        joinLoyalty
      });
      res.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Registration failed', 500);
    }
  },

  socialLogin: async (req: Request, res: Response) => {
    try {
      const { provider, code } = req.body;
      // TODO: Implement OAuth flow for social login
      // For now, we'll just return a mock response
      res.json({
        message: 'Social login not implemented yet'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Social login failed', 500);
    }
  },

  requestPasswordReset: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);
      res.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Password reset request failed', 500);
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);
      res.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Password reset failed', 500);
    }
  },

  logout: async (req: Request, res: Response) => {
    try {
      // In a JWT system, logout is handled client-side by removing the token
      res.json({
        message: 'Logged out successfully'
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Logout failed', 500);
    }
  }
}; 