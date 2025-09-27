import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { apiLimiter } from './src/middleware/auth.middleware';
import routes from './src/modules';
import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
const cookieParser = require('cookie-parser');
import {Server} from "socket.io"
import http from "http"

const app = express();
const server = http.createServer(app);

export const io: Server = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
}) as Server;

// Security middleware
app.use(helmet());

// CORS configuration - Allow all origins while supporting credentials
const corsOptions: CorsOptions = {
  origin: true, // Reflects the request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
  ],
  exposedHeaders: ['set-cookie', 'token', 'Authorization'],
};


// Ensure caches and proxies vary by Origin when reflecting origin
app.use((req, res, next) => {
  res.header('Vary', 'Origin');
  next();
});

app.use(cors(corsOptions));
// Explicitly handle preflight across all routes (Express 5 safe)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
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

// Import and initialize socket service
import { initializeSocket } from './src/services/socket.service';
initializeSocket(io);

export { server };
export default app;

export const getIo=()=>{
  if(!io){
    throw new Error("Socket.io not initialized")
  }
  return io
}
