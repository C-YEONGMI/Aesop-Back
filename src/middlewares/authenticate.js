import Session from '../modules/sessions/session.model.js';
import User from '../modules/users/user.model.js';
import { verifyAccessToken } from '../modules/auth/auth.tokens.js';
import AppError from '../utils/AppError.js';

const getBearerToken = (authorizationHeader = '') => {
    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return '';
    }

    return token.trim();
};

const authenticate = async (req, res, next) => {
    try {
        const accessToken = getBearerToken(req.headers.authorization);

        if (!accessToken) {
            throw new AppError('Authentication is required.', 401, {
                code: 'UNAUTHENTICATED',
            });
        }

        const decodedToken = verifyAccessToken(accessToken);
        const session = await Session.findById(decodedToken.sessionId).lean();

        if (!session || session.isRevoked || new Date(session.expiresAt).getTime() <= Date.now()) {
            throw new AppError('Session is no longer valid.', 401, {
                code: 'INVALID_SESSION',
            });
        }

        const user = await User.findById(decodedToken.sub).lean();

        if (!user) {
            throw new AppError('User could not be found.', 401, {
                code: 'INVALID_USER',
            });
        }

        req.auth = {
            userId: String(user._id),
            sessionId: String(session._id),
            token: decodedToken,
        };
        req.user = user;

        next();
    } catch (error) {
        if (error instanceof AppError) {
            next(error);
            return;
        }

        next(
            new AppError('Access token is invalid or expired.', 401, {
                code: 'INVALID_ACCESS_TOKEN',
            })
        );
    }
};

export default authenticate;
