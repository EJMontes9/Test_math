const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const paraleloRoutes = require('./routes/paraleloRoutes');
const settingRoutes = require('./routes/settingRoutes');

const app = express();

// Security middleware
app.use(helmet());

// CORS - Permitir múltiples orígenes para desarrollo
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:8080',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting - Solo en producción
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      success: false,
      message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', limiter);
  console.log('✅ Rate limiting habilitado (Producción)');
} else {
  console.log('⚠️  Rate limiting deshabilitado (Desarrollo)');
}

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/paralelos', paraleloRoutes);
app.use('/api/settings', settingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'MathMaster API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

module.exports = app;
