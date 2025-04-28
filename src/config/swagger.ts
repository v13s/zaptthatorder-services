import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ZapThatOrder API Documentation',
      version: '1.0.0',
      description: 'API documentation for ZapThatOrder e-commerce platform',
      contact: {
        name: 'API Support',
        email: 'support@zapthatorder.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Profile',
        description: 'User profile management endpoints'
      },
      {
        name: 'Products',
        description: 'Product listing and management endpoints'
      },
      {
        name: 'Cart',
        description: 'Shopping cart management endpoints'
      },
      {
        name: 'Orders',
        description: 'Order management endpoints'
      },
      {
        name: 'Payments',
        description: 'Payment processing endpoints'
      },
      {
        name: 'Shipping',
        description: 'Shipping and delivery endpoints'
      },
      {
        name: 'Categories',
        description: 'Product category management endpoints'
      },
      {
        name: 'Reviews',
        description: 'Product review management endpoints'
      },
      {
        name: 'Coupons',
        description: 'Coupon and discount management endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints (Admin only)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            name: {
              type: 'string'
            },
            price: {
              type: 'number',
              format: 'decimal'
            },
            originalPrice: {
              type: 'number',
              format: 'decimal'
            },
            description: {
              type: 'string'
            },
            image: {
              type: 'string'
            },
            category: {
              type: 'string'
            },
            loyaltyPoints: {
              type: 'integer'
            },
            stock: {
              type: 'integer'
            },
            rating: {
              type: 'number',
              format: 'decimal'
            },
            isNew: {
              type: 'boolean'
            },
            isSale: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ProductInput: {
          type: 'object',
          required: ['name', 'price', 'description', 'category', 'stock'],
          properties: {
            name: {
              type: 'string'
            },
            price: {
              type: 'number',
              format: 'decimal'
            },
            originalPrice: {
              type: 'number',
              format: 'decimal'
            },
            description: {
              type: 'string'
            },
            image: {
              type: 'string'
            },
            category: {
              type: 'string'
            },
            loyaltyPoints: {
              type: 'integer'
            },
            stock: {
              type: 'integer'
            },
            rating: {
              type: 'number',
              format: 'decimal'
            },
            isNew: {
              type: 'boolean'
            },
            isSale: {
              type: 'boolean'
            }
          }
        },
        ProductImage: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            productId: {
              type: 'integer'
            },
            url: {
              type: 'string'
            },
            isPrimary: {
              type: 'boolean'
            }
          }
        },
        ProductSize: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            productId: {
              type: 'integer'
            },
            size: {
              type: 'string'
            }
          }
        },
        ProductColor: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            productId: {
              type: 'integer'
            },
            color: {
              type: 'string'
            }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Cart ID'
            },
            userId: {
              type: 'integer',
              description: 'User ID who owns the cart'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem'
              }
            },
            total: {
              type: 'number',
              format: 'float',
              description: 'Total price of all items in cart'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        CartItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Cart item ID'
            },
            cartId: {
              type: 'integer',
              description: 'Cart ID this item belongs to'
            },
            productId: {
              type: 'integer',
              description: 'Product ID'
            },
            quantity: {
              type: 'integer',
              description: 'Quantity of the product'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Price per unit'
            },
            size: {
              type: 'string',
              description: 'Selected size of the product'
            },
            color: {
              type: 'string',
              description: 'Selected color of the product'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        CartItemInput: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: {
              type: 'integer',
              description: 'Product ID to add to cart'
            },
            quantity: {
              type: 'integer',
              description: 'Quantity of the product'
            },
            size: {
              type: 'string',
              description: 'Selected size of the product'
            },
            color: {
              type: 'string',
              description: 'Selected color of the product'
            }
          }
        },
        CartItemUpdate: {
          type: 'object',
          properties: {
            quantity: {
              type: 'integer',
              description: 'New quantity of the product'
            },
            size: {
              type: 'string',
              description: 'New selected size of the product'
            },
            color: {
              type: 'string',
              description: 'New selected color of the product'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options); 