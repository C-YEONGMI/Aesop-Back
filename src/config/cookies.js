import env from './env.js';

export const getRefreshCookieOptions = () => ({
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/api/auth',
    domain: env.cookieDomain,
    maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
});
