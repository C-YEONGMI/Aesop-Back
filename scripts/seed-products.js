import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    connectToDatabase,
    disconnectFromDatabase,
    summarizeMongoConnectionError,
} from '../src/config/db.js';
import Product from '../src/modules/products/product.model.js';
import { normalizeProductsForDatabase } from '../src/modules/products/product.ingest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const productJsonPath = path.join(repoRoot, 'src', 'data', 'products.json');

const run = async () => {
    const rawProductJson = await fs.readFile(productJsonPath, 'utf8');
    const parsedProducts = JSON.parse(rawProductJson);

    await connectToDatabase();
    const existingProducts = await Product.find({}).lean();
    const normalizedProducts = normalizeProductsForDatabase(parsedProducts, {
        existingProducts,
    });
    await Product.deleteMany({});
    await Product.insertMany(normalizedProducts);

    console.log(`Seeded ${normalizedProducts.length} products from products.json.`);
};

run()
    .catch((error) => {
        console.error('Failed to seed products.', error);
        const summary = summarizeMongoConnectionError(error);
        console.error(`Seed failure category: ${summary.category}`);
        if (summary.hint) {
            console.error(`Seed hint: ${summary.hint}`);
        }
        process.exitCode = 1;
    })
    .finally(async () => {
        try {
            await disconnectFromDatabase();
        } catch (error) {
            console.error('Failed to close database connection.', error);
        }
    });
