import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import { productRoutes } from './routes/product.routes';
import { loyaltyRoutes } from './routes/loyalty.routes';
import { couponRoutes } from './routes/coupon.routes';
import { profileRoutes } from './routes/profile.routes';
import { orderRoutes } from './routes/order.routes';
import { cartRoutes } from './routes/cart.routes';
import { shippingRoutes } from './routes/shipping.routes';
import { paymentRoutes } from './routes/payment.routes';
import { errorHandler } from './middleware/error.middleware';

// Load environment variables
config();

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies

// Routes
app.use('/api/products', productRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/payment', paymentRoutes);

// Error handling
app.use(errorHandler);

export default app; 