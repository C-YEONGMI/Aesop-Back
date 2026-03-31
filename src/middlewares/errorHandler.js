import AppError from '../utils/AppError.js';

const errorHandler = (error, req, res, next) => {
    const normalizedError =
        error instanceof AppError
            ? error
            : new AppError(error.message || 'Internal server error', 500, {
                  code: error.code || 'INTERNAL_SERVER_ERROR',
              });

    if (req.app.get('env') !== 'production') {
        console.error(error);
    }

    res.status(normalizedError.statusCode).json({
        message: normalizedError.message,
        code: normalizedError.code,
        details: normalizedError.details,
    });
};

export default errorHandler;
