const {AppError} = require('../src/utilities/errorsUtilities.js')


function errorHandler(err, req, res, next) {
  console.log(err)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}


module.exports = errorHandler