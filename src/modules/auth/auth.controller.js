import { getRefreshCookieOptions } from '../../config/cookies.js';
import env from '../../config/env.js';
import asyncHandler from '../../utils/asyncHandler.js';
import {
    completeSocialLogin,
    findAccountByIdentifier,
    getCurrentUser,
    loginUser,
    logoutUserSession,
    refreshUserSession,
    signupUser,
    updateUserProfile,
} from './auth.service.js';
import {
    validateLoginPayload,
    validateRefreshPayload,
} from './auth.validators.js';

const setRefreshTokenCookie = (res, refreshToken) => {
    res.cookie(env.cookieName, refreshToken, getRefreshCookieOptions());
};

const clearRefreshTokenCookie = (res) => {
    res.clearCookie(env.cookieName, getRefreshCookieOptions());
};

const getRequestMeta = (req) => ({
    userAgent: req.get('user-agent') || '',
    ipAddress: req.ip,
});

export const login = asyncHandler(async (req, res) => {
    const credentials = validateLoginPayload(req.body);
    const result = await loginUser({
        ...credentials,
        ...getRequestMeta(req),
    });

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
        user: result.user,
        tokens: result.tokens,
        session: result.session,
    });
});

export const signup = asyncHandler(async (req, res) => {
    const result = await signupUser({
        ...req.body,
        ...getRequestMeta(req),
    });

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(201).json({
        user: result.user,
        tokens: result.tokens,
        session: result.session,
    });
});

export const socialComplete = asyncHandler(async (req, res) => {
    const result = await completeSocialLogin({
        provider: req.body.provider,
        profile: req.body.profile,
        ...getRequestMeta(req),
    });

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
        user: result.user,
        tokens: result.tokens,
        session: result.session,
    });
});

export const refresh = asyncHandler(async (req, res) => {
    const payload = validateRefreshPayload(req.body);
    const refreshToken = req.cookies?.[env.cookieName] || payload.refreshToken;
    const result = await refreshUserSession({
        refreshToken,
        ...getRequestMeta(req),
    });

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
        user: result.user,
        tokens: result.tokens,
        session: result.session,
    });
});

export const me = asyncHandler(async (req, res) => {
    const user = await getCurrentUser(req.auth.userId);

    res.status(200).json({
        user,
    });
});

export const logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[env.cookieName] || req.body?.refreshToken || '';
    await logoutUserSession(refreshToken);
    clearRefreshTokenCookie(res);

    res.status(200).json({
        success: true,
    });
});

export const profile = asyncHandler(async (req, res) => {
    const user = await updateUserProfile(req.auth.userId, req.body);

    res.status(200).json({
        user,
    });
});

export const findAccount = asyncHandler(async (req, res) => {
    const found = await findAccountByIdentifier(req.body?.identifier || '');

    res.status(200).json({
        found,
    });
});
