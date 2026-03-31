import { Router } from 'express';
import authenticate from '../../middlewares/authenticate.js';
import {
    findAccount,
    login,
    logout,
    me,
    profile,
    refresh,
    signup,
    socialComplete,
} from './auth.controller.js';

const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/signup', signup);
authRouter.post('/social/complete', socialComplete);
authRouter.post('/refresh', refresh);
authRouter.get('/me', authenticate, me);
authRouter.post('/logout', logout);
authRouter.patch('/profile', authenticate, profile);
authRouter.post('/find-account', findAccount);

export default authRouter;
