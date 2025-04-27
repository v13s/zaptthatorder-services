import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';

const router = Router();

// Review routes
router.get('/', reviewController.getAllReviews);
router.get('/:id', reviewController.getReviewById);
router.post('/', reviewController.createReview);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);
router.get('/product/:productId', reviewController.getProductReviews);

export const reviewRoutes = router; 