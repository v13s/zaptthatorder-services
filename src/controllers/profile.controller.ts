import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

interface SocialLink {
  id: number;
  platform: string;
  url: string;
  isPublic: boolean;
}

export const profileController = {
  // Get user profile
  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          socialLinks: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json(user);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get profile', 500);
    }
  },

  // Update user profile
  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { name, email, phone, address } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          email,
          phone,
          address,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          socialLinks: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(user);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update profile', 500);
    }
  },

  // Get social links
  async getSocialLinks(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          socialLinks: true,
        },
      });

      if (!user || !user.socialLinks) {
        throw new AppError('User not found or no social links', 404);
      }

      const socialLinks = JSON.parse(JSON.stringify(user.socialLinks)) as SocialLink[];
      res.json({ links: socialLinks });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get social links', 500);
    }
  },

  // Add social link
  async addSocialLink(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { platform, url, isPublic } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          socialLinks: true,
        },
      });

      const socialLinks = user?.socialLinks ? JSON.parse(JSON.stringify(user.socialLinks)) as SocialLink[] : [];
      const newLink = {
        id: Date.now(),
        platform,
        url,
        isPublic: isPublic !== undefined ? isPublic : true,
      };

      const updatedLinks = [...socialLinks, newLink];

      await prisma.user.update({
        where: { id: userId },
        data: {
          socialLinks: updatedLinks as any,
        },
      });

      res.status(201).json({ link: newLink });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to add social link', 500);
    }
  },

  // Update social link
  async updateSocialLink(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { linkId } = req.params;
      const { url, isPublic } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          socialLinks: true,
        },
      });

      if (!user || !user.socialLinks) {
        throw new AppError('User not found or no social links', 404);
      }

      const socialLinks = JSON.parse(JSON.stringify(user.socialLinks)) as SocialLink[];
      const updatedLinks = socialLinks.map((link) => {
        if (link.id === parseInt(linkId)) {
          return {
            ...link,
            url: url || link.url,
            isPublic: isPublic !== undefined ? isPublic : link.isPublic,
          };
        }
        return link;
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          socialLinks: updatedLinks as any,
        },
      });

      res.json({ links: updatedLinks });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update social link', 500);
    }
  },

  // Delete social link
  async deleteSocialLink(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { linkId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          socialLinks: true,
        },
      });

      if (!user || !user.socialLinks) {
        throw new AppError('User not found or no social links', 404);
      }

      const socialLinks = JSON.parse(JSON.stringify(user.socialLinks)) as SocialLink[];
      const updatedLinks = socialLinks.filter(
        (link) => link.id !== parseInt(linkId)
      );

      await prisma.user.update({
        where: { id: userId },
        data: {
          socialLinks: updatedLinks as any,
        },
      });

      res.json({ links: updatedLinks });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete social link', 500);
    }
  },

  // Update profile image
  async updateProfileImage(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const imageUrl = req.body.imageUrl;
      if (!imageUrl) {
        throw new AppError('Image URL is required', 400);
      }

      // Since there's no image field in the User model, we'll store it in socialLinks
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          socialLinks: true,
        },
      });

      const socialLinks = user?.socialLinks ? JSON.parse(JSON.stringify(user.socialLinks)) as SocialLink[] : [];
      const updatedLinks = [...socialLinks, { id: Date.now(), platform: 'profile_image', url: imageUrl, isPublic: true }];

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          socialLinks: updatedLinks as any,
        },
        select: {
          id: true,
          email: true,
          name: true,
          socialLinks: true,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update profile image', 500);
    }
  },
}; 