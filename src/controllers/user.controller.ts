import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export const userController = {
  // Get all users
  async getAllUsers(req: Request, res: Response) {
    const users = await prisma.user.findMany({
      include: {
        reviews: true,
        cart: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });
    res.json(users);
  },

  // Get a single user by ID
  async getUserById(req: Request, res: Response) {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        reviews: true,
        cart: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found',404);
    }

    res.json(user);
  },

  // Create a new user
  async createUser(req: Request, res: Response) {
    const { name, email, phone, address, isLoyaltyMember, socialLinks } = req.body;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        address,
        isLoyaltyMember,
        socialLinks,
      },
    });

    res.status(201).json(user);
  },

  // Update a user
  async updateUser(req: Request, res: Response) {
    const { id } = req.params;
    const updateData = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(user);
  },

  // Delete a user
  async deleteUser(req: Request, res: Response) {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  },

  // Get user's cart
  async getUserCart(req: Request, res: Response) {
    const { id } = req.params;

    const cart = await prisma.cart.findUnique({
      where: { userId: parseInt(id) },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      throw new AppError('Cart not found',404);
    }

    res.json(cart);
  },

  // Get user's reviews
  async getUserReviews(req: Request, res: Response) {
    const { id } = req.params;

    const reviews = await prisma.review.findMany({
      where: { userId: parseInt(id) },
      include: {
        product: true,
      },
    });

    res.json(reviews);
  },
}; 