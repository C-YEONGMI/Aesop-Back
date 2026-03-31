import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import corsOptions from './config/cors.js';
import env from './config/env.js';
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';
import authRouter from './modules/auth/auth.routes.js';
import productRouter from './modules/products/product.routes.js';

const app = express();

app.set('env', env.nodeEnv);

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        environment: env.nodeEnv,
    });
});

app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
