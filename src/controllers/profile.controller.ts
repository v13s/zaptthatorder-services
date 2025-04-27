import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
  };
}

export const profileController = {
  // Get user profile
  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, 'User not authenticated');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          profileImage: true,
          socialLinks: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json(user);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to get profile');
    }
  },

  // Update user profile
  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, 'User not authenticated');
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
          name: true,
          email: true,
          phone: true,
          address: true,
          profileImage: true,
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
      throw new AppError(500, 'Failed to update profile');
    }
  },

  // Get social links
  async getSocialLinks(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, 'User not authenticated');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          socialLinks: true,
        },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json({ links: user.socialLinks });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to get social links');
    }
  },

  // Add social link
  async addSocialLink(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, 'User not authenticated');
      }

      const { platform, url, isPublic } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          socialLinks: {
            push: {
              platform,
              url,
              isPublic,
            },
          },
        },
        select: {
          socialLinks: true,
        },
      });

      res.status(201).json({ links: user.socialLinks });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to add social link');
    }
  },

  // Update social link
  async updateSocialLink(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, 'User not authenticated');
      }

      const { linkId } = req.params;
      const { url, isPublic } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          socialLinks: true,
        },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      const updatedLinks = user.socialLinks.map((link: any) => {
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
          socialLinks: updatedLinks,
        },
      });

      res.json({ links: updatedLinks });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to update social link');
    }
  },

  // Delete social link
  async deleteSocialLink(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, 'User not authenticated');
      }

      const { linkId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          socialLinks: true,
        },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      const updatedLinks = user.socialLinks.filter(
        (link: any) => link.id !== parseInt(linkId)
      );

      await prisma.user.update({
        where: { id: userId },
        data: {
          socialLinks: updatedLinks,
        },
      });

      res.json({ links: updatedLinks });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to delete social link');
    }
  },

  // Update profile image
  async updateProfileImage(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, 'User not authenticated');
      }

      const { imageUrl } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          profileImage: imageUrl,
        },
        select: {
          profileImage: true,
        },
      });

      res.json(user);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to update profile image');
    }
  },
}; 