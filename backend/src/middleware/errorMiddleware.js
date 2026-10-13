export const errorHandler = (err, req, res, next) => {
  console.error('[Error Caught]:', err.stack || err.message);

  // MongoDB duplicate key error (E11000)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'ALREADY_PARTICIPATING',
        message: "You're already participating! You can participate again when a new giveaway event begins."
      }
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: messages.join('. ')
      }
    });
  }

  // Custom known error codes
  if (err.message && err.message.startsWith('INSUFFICIENT_')) {
    return res.status(400).json({
      success: false,
      error: {
        code: err.message,
        message: 'Insufficient balance to participate in this giveaway.',
        deficit: err.deficit
      }
    });
  }

  // General server error
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: err.message || 'An unexpected server error occurred. Please try again later.'
    }
  });
};
