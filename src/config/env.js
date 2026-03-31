import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '../..');

dotenv.config({
    path: path.join(serverRoot, '.env'),
});

const requiredEnvKeys = [
    'MONGODB_URI',
    'ACCESS_TOKEN_SECRET',
];

const missingEnvKeys = requiredEnvKeys.filter((key) => !process.env[key]);

if (missingEnvKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvKeys.join(', ')}`);
}

const parseNumber = (value, fallback) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const parseOrigins = (value = '') =>
    value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

const defaultCorsOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
];

const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    port: parseNumber(process.env.PORT, 4000),
    mongodbUri: process.env.MONGODB_URI,
    mongodbDbName: process.env.MONGODB_DB_NAME || undefined,
    mongodbAuthSource: process.env.MONGODB_AUTH_SOURCE || undefined,
    mongodbFamily: parseNumber(process.env.MONGODB_FAMILY, 4),
    mongodbServerSelectionTimeoutMs: parseNumber(
        process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
        30000
    ),
    corsOrigins: parseOrigins(process.env.CORS_ORIGIN || defaultCorsOrigins.join(',')),
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
    refreshTokenTtlDays: parseNumber(process.env.REFRESH_TOKEN_TTL_DAYS, 30),
    cookieName: process.env.COOKIE_NAME || 'aesop_refresh_token',
    cookieDomain: process.env.COOKIE_DOMAIN || undefined,
    serverRoot,
};

export default env;
