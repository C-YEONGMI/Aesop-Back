import Product from './product.model.js';
import { normalizeProductsForDatabase } from './product.ingest.js';

export const replaceProductsFromSource = async (sourceProducts = [], options = {}) => {
    const { existingProducts } = options;
    const currentProducts = existingProducts || (await Product.find({}).lean());
    const normalizedProducts = normalizeProductsForDatabase(sourceProducts, {
        existingProducts: currentProducts,
    });

    await Product.deleteMany({});

    if (normalizedProducts.length > 0) {
        await Product.insertMany(normalizedProducts);
    }

    return {
        totalExisting: currentProducts.length,
        totalSynced: normalizedProducts.length,
    };
};
