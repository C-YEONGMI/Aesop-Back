import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    connectToDatabase,
    disconnectFromDatabase,
    summarizeMongoConnectionError,
} from '../src/config/db.js';
import { replaceProductsFromSource } from '../src/modules/products/product.sync.js';
import { scrapeAesopProducts } from './lib/aesopProductScraper.js';

const __filename = fileURLToPath(import.meta.url);

const isDirectRun =
    process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

const printHelp = () => {
    console.log('Usage: npm run sync:products');
    console.log('Scrapes the Aesop product catalog and writes the normalized result directly to MongoDB.');
    console.log('Optional env: SCRAPER_HEADLESS=false');
};

export const syncProductsToMongo = async () => {
    const scrapedProducts = await scrapeAesopProducts({
        headless: process.env.SCRAPER_HEADLESS !== 'false',
    });

    await connectToDatabase();
    const result = await replaceProductsFromSource(scrapedProducts);

    console.log(`Scraped ${scrapedProducts.length} products from the website.`);
    console.log(
        `Synced ${result.totalSynced} products to MongoDB (replaced ${result.totalExisting} existing records).`
    );
};

if (isDirectRun) {
    if (process.argv.includes('--help')) {
        printHelp();
        process.exit(0);
    }

    syncProductsToMongo()
        .catch((error) => {
            console.error('Failed to sync products from scraper.', error);
            const summary = summarizeMongoConnectionError(error);
            console.error(`Sync failure category: ${summary.category}`);
            if (summary.hint) {
                console.error(`Sync hint: ${summary.hint}`);
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
}
