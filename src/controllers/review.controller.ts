import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export const reviewController = {
  // Get all reviews
  async getAllReviews(req: Request, res: Response) {
    const reviews = await prisma.review.findMany({
      include: {
        user: true,
        product: true,
      },
    });
    res.json(reviews);
  },

  // Get a single review by ID
  async getReviewById(req: Request, res: Response) {
    const { id } = req.params;
    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true,
        product: true,
      },
    });

    if (!review) {
      throw new AppError('Review not found',404);
    }

    res.json(review);
  },

  // Create a new review
  async createReview(req: Request, res: Response) {
    const { userId, userName, rating, comment, productId } = req.body;

    const review = await prisma.review.create({
      data: {
        userId,
        userName,
        rating,
        comment,
        productId,
      },
      include: {
        user: true,
        product: true,
      },
    });

    res.status(201).json(review);
  },

  // Update a review
  async updateReview(req: Request, res: Response) {
    const { id } = req.params;
    const updateData = req.body;

    const review = await prisma.review.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: true,
        product: true,
      },
    });

    res.json(review);
  },

  // Delete a review
  async deleteReview(req: Request, res: Response) {
    const { id } = req.params;

    await prisma.review.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  },

  // Get reviews for a specific product
  async getProductReviews(req: Request, res: Response) {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { productId: parseInt(productId) },
      include: {
        user: true,
      },
    });

    res.json(reviews);
  },
}; 