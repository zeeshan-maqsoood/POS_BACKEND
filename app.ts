import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { apiLimiter } from './src/middleware/auth.middleware';
import routes from './src/modules';
import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
const cookieParser = require('cookie-parser');
const app = express();

// Security middleware
app.use(helmet());


// CORS configuration - Allow all origins
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow any origin
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token'
  );
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'set-cookie, token, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});


app.use(cookieParser());
// Rate limiting
// app.use(apiLimiter);

// Parse JSON bodies
app.use(express.json({ limit: '10kb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get("/",(req,res)=>{
    res.send("Hello world")
})

// Register API routes
app.use('/api', routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found | Please check the URL',
  });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
    if (err.code === 'P2002') {
      return res.status(httpStatus.CONFLICT).json({
        status: 'error',
        message: 'A unique constraint was violated',
      });
    }
    
    return res.status(httpStatus.BAD_REQUEST).json({
      status: 'error',
      message: 'Database error occurred',
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(httpStatus.UNAUTHORIZED).json({
      status: 'error',
      message: 'Invalid token',
    });
  }

  // Handle JWT expired error
  if (err.name === 'TokenExpiredError') {
    return res.status(httpStatus.UNAUTHORIZED).json({
      status: 'error',
      message: 'Token expired',
    });
  }

  // Handle other errors
  const statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
    return res.status(statusCode).json({
      status: 'error',
      message,
      stack: err.stack,
    });
  }

  return res.status(statusCode).json({
    status: 'error',
    message,
  });
});

export default app;
