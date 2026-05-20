const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const agentsRouter = require('./routes/agents');
const workflowsRouter = require('./routes/workflows');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security & utility middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/agents', agentsRouter);
app.use('/api/workflows', workflowsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
