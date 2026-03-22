import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './app/configs';
import router from './app/routes';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import notFoundErrorHandler from './app/middlewares/notFoundErrorHandler';
import seedData from './db/seedData';

const app: Application = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ['http://localhost:8080', 'http://localhost:5173'],
    credentials: true,
  }),
);



// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Home route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the DBFLOW API',
  });
});

// Importing routes
app.use('/api/v1', router);

// Error handling middleware
app.use(globalErrorHandler);

// 404 Not Found middleware
app.use(notFoundErrorHandler);

// Running the server
app.listen(config.port, async () => {
  try {
    await seedData();
  } catch (error) {
    console.error('Failed to seed data:', error);
  }
  console.log(`Server is running on port ${config.port}`);
});
