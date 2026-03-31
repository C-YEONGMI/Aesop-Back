import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Session from '../sessions/session.model.js';
import User from '../users/user.model.js';
import AppError from '../../utils/AppError.js';
import {
    createRefreshToken,
    getRefreshTokenExpiryDate,
    hashRefreshToken,
    signAccessToken,
} from './auth.tokens.js';

const sanitizeUser = (user) => {
    if (!user) {
        return null;
    }

    const plainUser = typeof user.toObject === 'function' ? user.toObject() : user;
    const { passwordHash, ...safeUser } = plainUser;

    safeUser.id = String(safeUser._id || safeUser.id);
    delete safeUser._id;

    return safeUser;
};

const buildAccessTokenExpiry = (accessToken) => {
    const decodedToken = jwt.decode(accessToken);
    const expiresAt = decodedToken?.exp ? new Date(decodedToken.exp * 1000) : null;
    return expiresAt ? expiresAt.toISOString() : null;
};

const createSession = async ({ user, userAgent, ipAddress }) => {
    const refreshToken = createRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const session = await Session.create({
        user: user._id,
        refreshTokenHash,
        userAgent,
        ipAddress,
        expiresAt: getRefreshTokenExpiryDate(),
        lastUsedAt: new Date(),
    });

    return {
        refreshToken,
        session,
    };
};

const rotateSession = async (session, metadata = {}) => {
    session.isRevoked = true;
    session.revokedAt = new Date();

    const nextSessionBundle = await createSession({
        user: session.user,
        userAgent: metadata.userAgent || session.userAgent,
        ipAddress: metadata.ipAddress || session.ipAddress,
    });

    session.replacedBy = nextSessionBundle.session._id;
    await session.save();

    return nextSessionBundle;
};

const buildAuthResponse = ({ user, session }) => {
    const accessToken = signAccessToken({
        userId: String(user._id || user.id),
        sessionId: String(session._id),
    });

    return {
        user: sanitizeUser(user),
        tokens: {
            accessToken,
            accessTokenExpiresAt: buildAccessTokenExpiry(accessToken),
            refreshTokenExpiresAt: session.expiresAt.toISOString(),
        },
        session: {
            sessionId: String(session._id),
            userId: String(user._id || user.id),
        },
    };
};

const findUserByIdentifier = async (identifier) => {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    return User.findOne({
        $or: [
            { email: normalizedIdentifier },
            { userId: normalizedIdentifier },
        ],
    });
};

const assertActiveSession = (session) => {
    if (!session) {
        throw new AppError('Refresh session was not found.', 401, {
            code: 'INVALID_REFRESH_TOKEN',
        });
    }

    if (session.isRevoked || session.revokedAt) {
        throw new AppError('Refresh session has already been revoked.', 401, {
            code: 'REVOKED_REFRESH_TOKEN',
        });
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
        throw new AppError('Refresh session has expired.', 401, {
            code: 'EXPIRED_REFRESH_TOKEN',
        });
    }
};

export const loginUser = async ({ identifier, password, userAgent, ipAddress }) => {
    const user = await findUserByIdentifier(identifier);

    if (!user) {
        throw new AppError('Invalid identifier or password.', 401, {
            code: 'INVALID_CREDENTIALS',
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        throw new AppError('Invalid identifier or password.', 401, {
            code: 'INVALID_CREDENTIALS',
        });
    }

    const { refreshToken, session } = await createSession({
        user,
        userAgent,
        ipAddress,
    });

    return {
        refreshToken,
        ...buildAuthResponse({ user, session }),
    };
};

export const signupUser = async ({
    userId,
    name,
    email,
    password,
    phone = '',
    gender = '',
    birthDate = '',
    userAgent,
    ipAddress,
}) => {
    const normalizedUserId = userId.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    const duplicatedUser = await User.findOne({
        $or: [
            { userId: normalizedUserId },
            { email: normalizedEmail },
        ],
    }).lean();

    if (duplicatedUser?.userId === normalizedUserId) {
        throw new AppError('This user ID is already in use.', 409, {
            code: 'DUPLICATE_USER_ID',
        });
    }

    if (duplicatedUser?.email === normalizedEmail) {
        throw new AppError('This email is already in use.', 409, {
            code: 'DUPLICATE_EMAIL',
        });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
        userId: normalizedUserId,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: phone.trim(),
        gender,
        birthDate,
    });

    const { refreshToken, session } = await createSession({
        user,
        userAgent,
        ipAddress,
    });

    return {
        refreshToken,
        ...buildAuthResponse({ user, session }),
    };
};

export const completeSocialLogin = async ({
    provider,
    profile,
    userAgent,
    ipAddress,
}) => {
    const socialId = String(profile?.providerUserId || '').trim();
    const normalizedEmail = (profile?.email || '').trim().toLowerCase();
    const fallbackUserId = `${provider}_${socialId || Date.now()}`;
    const normalizedUserId = (profile?.userId || fallbackUserId).trim().toLowerCase();

    let user =
        (socialId
            ? await User.findOne({ socialProvider: provider, socialId })
            : null) ||
        (normalizedEmail ? await User.findOne({ email: normalizedEmail }) : null) ||
        (normalizedUserId ? await User.findOne({ userId: normalizedUserId }) : null);

    if (!user) {
        const passwordHash = await bcrypt.hash(createRefreshToken(), 10);
        user = await User.create({
            userId: normalizedUserId,
            name: (profile?.name || `${provider} user`).trim(),
            email: normalizedEmail || `${normalizedUserId}@aesop.member`,
            passwordHash,
            phone: (profile?.phone || '').trim(),
            authMethod: 'social',
            socialProvider: provider,
            socialId,
            avatarUrl: profile?.avatarUrl || profile?.picture || '',
        });
    } else {
        user.name = (profile?.name || user.name).trim();
        user.phone = (profile?.phone || user.phone || '').trim();
        user.socialProvider = provider;
        user.socialId = socialId;
        user.authMethod = 'social';
        user.avatarUrl = profile?.avatarUrl || profile?.picture || user.avatarUrl || '';
        await user.save();
    }

    const { refreshToken, session } = await createSession({
        user,
        userAgent,
        ipAddress,
    });

    return {
        refreshToken,
        ...buildAuthResponse({ user, session }),
    };
};

export const refreshUserSession = async ({ refreshToken, userAgent, ipAddress }) => {
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const session = await Session.findOne({
        refreshTokenHash,
    }).populate('user');

    assertActiveSession(session);

    const nextSessionBundle = await rotateSession(session, {
        userAgent,
        ipAddress,
    });

    return {
        refreshToken: nextSessionBundle.refreshToken,
        ...buildAuthResponse({
            user: session.user,
            session: nextSessionBundle.session,
        }),
    };
};

export const getCurrentUser = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('User could not be found.', 404, {
            code: 'USER_NOT_FOUND',
        });
    }

    return sanitizeUser(user);
};

export const logoutUserSession = async (refreshToken) => {
    if (!refreshToken) {
        return;
    }

    const refreshTokenHash = hashRefreshToken(refreshToken);

    await Session.findOneAndUpdate(
        { refreshTokenHash },
        {
            isRevoked: true,
            revokedAt: new Date(),
        }
    );
};

export const updateUserProfile = async (userId, profileData = {}) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('User could not be found.', 404, {
            code: 'USER_NOT_FOUND',
        });
    }

    if (profileData.email && profileData.email.trim().toLowerCase() !== user.email) {
        const duplicatedEmail = await User.findOne({
            email: profileData.email.trim().toLowerCase(),
            _id: { $ne: user._id },
        }).lean();

        if (duplicatedEmail) {
            throw new AppError('This email is already in use.', 409, {
                code: 'DUPLICATE_EMAIL',
            });
        }

        user.email = profileData.email.trim().toLowerCase();
    }

    if (profileData.name) {
        user.name = profileData.name.trim();
    }

    if (profileData.phone !== undefined) {
        user.phone = String(profileData.phone || '').trim();
    }

    await user.save();

    return sanitizeUser(user);
};

export const findAccountByIdentifier = async (identifier) => {
    const user = await findUserByIdentifier(identifier);
    return Boolean(user);
};
