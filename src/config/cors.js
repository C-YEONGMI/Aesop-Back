import env from './env.js';

const isAllowedOrigin = (origin) => {
    if (!origin) {
        return true;
    }

    return env.corsOrigins.includes(origin);
};

const corsOptions = {
    origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error('CORS origin is not allowed.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

export default corsOptions;
