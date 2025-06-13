

const sendError = (res, statusCode, error, message) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }

  return res.status(statusCode).json({
    error: process.env.NODE_ENV === 'development' ? error : undefined,
    message
  });
};

module.exports = { sendError };
