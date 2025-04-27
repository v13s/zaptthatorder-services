import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Profile routes
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.put('/image', profileController.updateProfileImage);

// Social links routes
router.get('/social-links', profileController.getSocialLinks);
router.post('/social-links', profileController.addSocialLink);
router.put('/social-links/:linkId', profileController.updateSocialLink);
router.delete('/social-links/:linkId', profileController.deleteSocialLink);

export const profileRoutes = router; 