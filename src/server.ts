import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/error.middleware';
import { authRoutes } from './routes/auth.routes';
import { productRoutes } from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import { profileRoutes } from './routes/profile.routes';
import cartRoutes from './routes/cart.routes';
import { orderRoutes } from './routes/order.routes';
import { loyaltyRoutes } from './routes/loyalty.routes';
import { paymentRoutes } from './routes/payment.routes';
import { shippingRoutes } from './routes/shipping.routes';
import { reviewRoutes } from './routes/review.routes';
import { validateRequest } from './middleware/validate.middleware';
import { authenticate } from './middleware/auth.middleware';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/reviews', reviewRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
}); 