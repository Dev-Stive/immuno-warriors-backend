const { AppError } = require('../utils/errorUtils');
const  logger  = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  logger.error('Erreur interceptée', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      details: error.details || null,
    });
  }

  res.status(500).json({
    error: 'Erreur serveur interne',
    details: null,
  });
};

module.exports = errorHandler;
