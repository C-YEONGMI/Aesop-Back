import http from 'node:http';
import app from './app.js';
import { connectToDatabase, summarizeMongoConnectionError } from './config/db.js';
import env from './config/env.js';

const startServer = async () => {
    await connectToDatabase();

    const server = http.createServer(app);

    server.listen(env.port, () => {
        console.log(`Aesop server listening on port ${env.port}`);
    });

    return server;
};

startServer().catch((error) => {
    console.error('Failed to start server', error);
    const summary = summarizeMongoConnectionError(error);
    console.error(`Server start failure category: ${summary.category}`);
    if (summary.hint) {
        console.error(`Server start hint: ${summary.hint}`);
    }
    process.exit(1);
});
