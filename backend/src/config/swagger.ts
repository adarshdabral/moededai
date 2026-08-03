import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const swaggerDefinition: swaggerJsdoc.SwaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'ModEd.ai API',
    version: '1.0.0',
    description:
      'AI-powered learning platform backend: AI Tutor, AI-generated tests, Knowledge Score, ' +
      'monthly assessments, anonymous doubts, and role-based dashboards.',
  },
  servers: [{ url: `http://localhost:${env.PORT}${env.API_PREFIX}` }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      SuccessEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
        },
      },
      ErrorEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    issue: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [
    'src/modules/**/*.routes.ts',
    'src/routes/*.ts',
    'dist/modules/**/*.routes.js',
    'dist/routes/*.js',
  ],
});
