const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Indian Lappa League API',
      version: '1.0.0',
      description: 'Backend API for IPL Prediction League - Predict | Banter | Win',
      contact: {
        name: 'ILL Admin',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Local Development',
      },
      {
        url: 'https://your-backend.vercel.app',
        description: 'Production',
      },
    ],
    tags: [
      { name: 'Public', description: 'Public endpoints - no authentication required' },
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Admin', description: 'Admin only endpoints' },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
