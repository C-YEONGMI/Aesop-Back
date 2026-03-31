import mongoose from 'mongoose';
import env from './env.js';

const redactMongoUri = (uri = '') =>
    uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/i, '$1***$3');

const inferMongoMode = (uri = '') => {
    if (uri.startsWith('mongodb+srv://')) {
        return 'atlas-srv';
    }

    if (uri.includes('.mongodb.net')) {
        return 'atlas-standard';
    }

    return 'local-or-self-hosted';
};

const getMongoConnectOptions = () => {
    const options = {
        family: env.mongodbFamily,
        serverSelectionTimeoutMS: env.mongodbServerSelectionTimeoutMs,
    };

    if (env.mongodbDbName) {
        options.dbName = env.mongodbDbName;
    }

    if (env.mongodbAuthSource) {
        options.authSource = env.mongodbAuthSource;
    }

    return options;
};

export const summarizeMongoConnectionError = (error) => {
    const baseSummary = {
        name: error?.name || 'MongoConnectionError',
        message: error?.message || 'Unknown MongoDB connection error',
        category: 'unknown',
    };

    if (error?.code === 'ECONNREFUSED' && error?.syscall === 'querySrv') {
        return {
            ...baseSummary,
            category: 'dns',
            hint: 'SRV DNS lookup failed. Verify mongodb+srv URI resolution or switch to the standard mongodb:// Atlas connection string.',
        };
    }

    if (error?.message?.includes('authentication failed')) {
        return {
            ...baseSummary,
            category: 'credentials',
            hint: 'MongoDB credentials or authSource are incorrect.',
        };
    }

    const serverDescriptions = Array.from(error?.reason?.servers?.values?.() || []);
    const networkError = serverDescriptions.find((server) => server?.error)?.error;
    const networkCode = networkError?.cause?.code || networkError?.code;

    if (networkCode === 'EACCES') {
        return {
            ...baseSummary,
            category: 'network',
            hint: 'The OS blocked node.exe from opening a MongoDB socket. Check firewall, antivirus, VPN, or network security tools.',
        };
    }

    if (networkCode === 'ECONNREFUSED') {
        return {
            ...baseSummary,
            category: 'network',
            hint: 'MongoDB host or port refused the connection. Verify the host, port, and firewall rules.',
        };
    }

    if (networkCode === 'ETIMEDOUT' || error?.name === 'MongooseServerSelectionError') {
        return {
            ...baseSummary,
            category: 'network',
            hint: 'Server selection timed out. Verify Atlas IP access, cluster status, and outbound connectivity from this machine.',
        };
    }

    return baseSummary;
};

export const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (mongoose.connection.readyState === 2) {
        await mongoose.connection.asPromise();
        return mongoose.connection;
    }

    if (mongoose.connection.readyState === 3) {
        await mongoose.disconnect();
    }

    const connectOptions = getMongoConnectOptions();

    try {
        await mongoose.connect(env.mongodbUri, connectOptions);
    } catch (error) {
        const summary = summarizeMongoConnectionError(error);

        console.error('[mongo] connection failed');
        console.error(`[mongo] mode=${inferMongoMode(env.mongodbUri)}`);
        console.error(`[mongo] uri=${redactMongoUri(env.mongodbUri)}`);
        console.error(
            `[mongo] options=${JSON.stringify({
                dbName: connectOptions.dbName || null,
                authSource: connectOptions.authSource || null,
                family: connectOptions.family,
                serverSelectionTimeoutMS: connectOptions.serverSelectionTimeoutMS,
            })}`
        );
        console.error(`[mongo] category=${summary.category}`);
        if (summary.hint) {
            console.error(`[mongo] hint=${summary.hint}`);
        }

        throw error;
    }

    return mongoose.connection;
};

export const disconnectFromDatabase = async () => {
    if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
        return;
    }

    if (mongoose.connection.readyState === 2) {
        await mongoose.connection.asPromise().catch(() => undefined);

        if (mongoose.connection.readyState === 0) {
            return;
        }
    }

    await mongoose.disconnect();
};
