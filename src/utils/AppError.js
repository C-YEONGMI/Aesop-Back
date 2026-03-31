export default class AppError extends Error {
    constructor(message, statusCode = 500, options = {}) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = options.code || 'APP_ERROR';
        this.details = options.details || null;
    }
}
