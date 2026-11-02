export const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error Caught]:', err.stack || err.message);
  } else {
    // Structured production logging without exposing internal stack traces to logs unnecessarily
    console.error(`[Error]: ${err.name || 'Error'} - ${err.message} (${req.method} ${req.originalUrl})`);
  }

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

  // Mongoose CastError (invalid ObjectId or type casting)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_IDENTIFIER',
        message: `Invalid format provided for field "${err.path}".`
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
  const isProduction = process.env.NODE_ENV === 'production';
  const clientMessage =
    statusCode === 500 && isProduction
      ? 'An unexpected server error occurred. Please try again later.'
      : err.message || 'An unexpected server error occurred. Please try again later.';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: clientMessage
    }
  });
};
