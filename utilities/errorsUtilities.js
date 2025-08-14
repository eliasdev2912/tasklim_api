class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, 401, code)
  }
}
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, 403, code)
  }
}
class NotFoundError extends AppError {
  constructor(message = 'Not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}
class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(message, 409, code)
  }
}

// Podés seguir con UnauthorizedError, ValidationError, etc.


const sendError = (res, error) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }

  return res.status(statusCode).json({
    error: process.env.NODE_ENV === 'development' ? error : undefined,
    message: error.message,
    code: error.code || 'INTERNAL_ERROR'
  });
};


module.exports = { 
  AppError, 
  BadRequestError, 
  NotFoundError,
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError, 
  sendError 
};
