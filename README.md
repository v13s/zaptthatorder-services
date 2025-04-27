# ZapThatOrder Services

Backend services for the ZapThatOrder e-commerce platform, built with Node.js, Express, TypeScript, and Prisma.

## Features

- RESTful API with TypeScript
- Prisma ORM for database management
- JWT Authentication
- Swagger API Documentation
- Error handling middleware
- Input validation
- Rate limiting
- CORS support
- Security headers with Helmet

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Documentation**: Swagger/OpenAPI
- **Validation**: express-validator
- **Security**: Helmet, bcryptjs

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL
- Prisma CLI

## Installation

1. Clone the repository:
```bash
git clone https://github.com/v13s/zapthatorder-services.git
cd zapthatorder-services
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your configuration.

4. Set up the database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

## Development

Start the development server:
```bash
npm run dev
```

The server will start at `http://localhost:3000`

## API Documentation

Access the Swagger API documentation at:
```
http://localhost:3000/api-docs
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm test` - Run tests (to be implemented)

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
└── server.ts       # Application entry point
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/reset-password` - Password reset

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `GET /api/categories/:id/products` - Get products by category

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove item from cart

### Orders
- `GET /api/orders` - Get order history
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status

### Loyalty Program
- `GET /api/loyalty/status` - Get loyalty status
- `GET /api/loyalty/rewards` - Get available rewards
- `POST /api/loyalty/redeem` - Redeem loyalty points

## Error Handling

The API uses a custom error handling middleware that returns consistent error responses:

```json
{
  "error": {
    "message": "Error message",
    "statusCode": 400
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email zapthatorder@outlook.com or create an issue in the repository. 