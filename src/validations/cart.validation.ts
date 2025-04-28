import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.number().int('Product ID must be an integer').min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  size: z.string().optional(),
  color: z.string().optional()
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  size: z.string().optional(),
  color: z.string().optional()
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>; 