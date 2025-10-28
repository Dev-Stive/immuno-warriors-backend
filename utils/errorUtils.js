class AppError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'APP_ERROR';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(400, message, 'VALIDATION_ERROR');
    this.details = details || [];
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(404, message, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message) {
    super(401, message, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message) {
    super(403, message, 'FORBIDDEN');
  }
}

// Format error for API response
const formatErrorResponse = (error) => ({
  status: 'error',
  code: error.code || 'UNKNOWN_ERROR',
  message: error.message || 'An unexpected error occurred',
  details: error.details || null,
  stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
});

// Handle async errors in controllers
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  formatErrorResponse,
  catchAsync
};
