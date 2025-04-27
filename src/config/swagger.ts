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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'] // Path to the API routes and controllers
};

export const swaggerSpec = swaggerJsdoc(options); 