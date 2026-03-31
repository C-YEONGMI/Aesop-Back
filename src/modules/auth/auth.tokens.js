import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import env from '../../config/env.js';

export const signAccessToken = ({ userId, sessionId }) =>
    jwt.sign(
        {
            sub: userId,
            sessionId,
            type: 'access',
        },
        env.accessTokenSecret,
        {
            expiresIn: env.accessTokenTtl,
        }
    );

export const verifyAccessToken = (token) => jwt.verify(token, env.accessTokenSecret);

export const createRefreshToken = () => crypto.randomBytes(48).toString('hex');

export const hashRefreshToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex');

export const getRefreshTokenExpiryDate = () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.refreshTokenTtlDays);
    return expiresAt;
};
