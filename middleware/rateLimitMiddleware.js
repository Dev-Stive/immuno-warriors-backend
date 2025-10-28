const rateLimit = require('express-rate-limit');
const  logger  = require('../utils/logger');
const config = require('../config');

const rateLimitMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    logger.warn('Limite de requêtes atteinte', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: 'Trop de requêtes, veuillez réessayer plus tard.',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
    });
  },
});

module.exports = rateLimitMiddleware;
